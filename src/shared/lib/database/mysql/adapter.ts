import { getMySQLPool, generateUUID } from './client'
import { createMySQLAuth } from './auth'
import type { DatabaseAdapter, QueryBuilder, QueryResult, DatabaseAuth } from '../types'

interface QueryState {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete'
  columns: string
  data: Record<string, unknown> | Record<string, unknown>[] | null
  conditions: { column: string; operator: string; value: unknown }[]
  orderBy: { column: string; ascending: boolean } | null
  limitCount: number | null
  isSingle: boolean
  isMaybeSingle: boolean
}

function parseSelectColumns(columns: string): string[] {
  // Handle Supabase-style nested selects like "id, name, line:lines(name)"
  // For MySQL, we'll just return the base columns and handle joins separately
  const parts = columns.split(',').map(p => p.trim())
  const result: string[] = []

  for (const part of parts) {
    // Check for nested select pattern: alias:table(columns)
    const nestedMatch = part.match(/^(\w+):(\w+)\(([^)]+)\)$/)
    if (nestedMatch) {
      // For now, skip nested selects - they need JOINs
      // The adapter will handle these specially
      continue
    }
    result.push(part)
  }

  return result.length > 0 ? result : ['*']
}

class MySQLQueryBuilder<T = unknown> implements QueryBuilder<T> {
  private state: QueryState

  constructor(table: string) {
    this.state = {
      table,
      operation: 'select',
      columns: '*',
      data: null,
      conditions: [],
      orderBy: null,
      limitCount: null,
      isSingle: false,
      isMaybeSingle: false,
    }
  }

  select(columns?: string): QueryBuilder<T> {
    this.state.operation = 'select'
    this.state.columns = columns || '*'
    return this
  }

  insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T> {
    this.state.operation = 'insert'
    this.state.data = data as Record<string, unknown> | Record<string, unknown>[]
    return this
  }

  update(data: Partial<T>): QueryBuilder<T> {
    this.state.operation = 'update'
    this.state.data = data as Record<string, unknown>
    return this
  }

  delete(): QueryBuilder<T> {
    this.state.operation = 'delete'
    return this
  }

  eq(column: string, value: unknown): QueryBuilder<T> {
    this.state.conditions.push({ column, operator: '=', value })
    return this
  }

  neq(column: string, value: unknown): QueryBuilder<T> {
    this.state.conditions.push({ column, operator: '!=', value })
    return this
  }

  in(column: string, values: unknown[]): QueryBuilder<T> {
    this.state.conditions.push({ column, operator: 'IN', value: values })
    return this
  }

  is(column: string, value: unknown): QueryBuilder<T> {
    if (value === null) {
      this.state.conditions.push({ column, operator: 'IS', value: null })
    } else {
      this.state.conditions.push({ column, operator: '=', value })
    }
    return this
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T> {
    this.state.orderBy = {
      column,
      ascending: options?.ascending ?? true,
    }
    return this
  }

  limit(count: number): QueryBuilder<T> {
    this.state.limitCount = count
    return this
  }

  single(): QueryBuilder<T> {
    this.state.isSingle = true
    this.state.limitCount = 1
    return this
  }

  maybeSingle(): QueryBuilder<T> {
    this.state.isMaybeSingle = true
    this.state.limitCount = 1
    return this
  }

  private buildWhereClause(): { sql: string; params: unknown[] } {
    if (this.state.conditions.length === 0) {
      return { sql: '', params: [] }
    }

    const clauses: string[] = []
    const params: unknown[] = []

    for (const cond of this.state.conditions) {
      if (cond.operator === 'IS' && cond.value === null) {
        clauses.push(`\`${cond.column}\` IS NULL`)
      } else if (cond.operator === 'IN') {
        const values = cond.value as unknown[]
        const placeholders = values.map(() => '?').join(', ')
        clauses.push(`\`${cond.column}\` IN (${placeholders})`)
        params.push(...values)
      } else {
        clauses.push(`\`${cond.column}\` ${cond.operator} ?`)
        params.push(cond.value)
      }
    }

    return { sql: ' WHERE ' + clauses.join(' AND '), params }
  }

  async then<TResult>(
    onfulfilled?: (value: QueryResult<T>) => TResult | PromiseLike<TResult>
  ): Promise<TResult> {
    const result = await this.execute()
    if (onfulfilled) {
      return onfulfilled(result)
    }
    return result as unknown as TResult
  }

  private async execute(): Promise<QueryResult<T>> {
    const pool = getMySQLPool()

    try {
      switch (this.state.operation) {
        case 'select': {
          const columns = parseSelectColumns(this.state.columns)
          let sql = `SELECT ${columns.join(', ')} FROM \`${this.state.table}\``
          const { sql: whereSql, params } = this.buildWhereClause()
          sql += whereSql

          if (this.state.orderBy) {
            sql += ` ORDER BY \`${this.state.orderBy.column}\` ${this.state.orderBy.ascending ? 'ASC' : 'DESC'}`
          }

          if (this.state.limitCount !== null) {
            sql += ` LIMIT ${this.state.limitCount}`
          }

          const [rows] = await pool.execute(sql, params)
          const data = rows as T[]

          if (this.state.isSingle) {
            if (data.length === 0) {
              return { data: null, error: 'No rows returned' }
            }
            return { data: data[0] as T, error: null }
          }

          if (this.state.isMaybeSingle) {
            return { data: (data[0] || null) as T, error: null }
          }

          return { data: data as unknown as T, error: null }
        }

        case 'insert': {
          const dataArray = Array.isArray(this.state.data) ? this.state.data : [this.state.data]
          const insertedRows: Record<string, unknown>[] = []

          for (const row of dataArray) {
            const rowWithId = { id: generateUUID(), ...row }
            const columns = Object.keys(rowWithId)
            const values = Object.values(rowWithId)
            const placeholders = columns.map(() => '?').join(', ')

            const sql = `INSERT INTO \`${this.state.table}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`
            await pool.execute(sql, values)
            insertedRows.push(rowWithId)
          }

          return {
            data: (Array.isArray(this.state.data) ? insertedRows : insertedRows[0]) as T,
            error: null
          }
        }

        case 'update': {
          const data = this.state.data as Record<string, unknown>
          const columns = Object.keys(data)
          const values = Object.values(data)
          const setClause = columns.map(c => `\`${c}\` = ?`).join(', ')

          let sql = `UPDATE \`${this.state.table}\` SET ${setClause}`
          const { sql: whereSql, params: whereParams } = this.buildWhereClause()
          sql += whereSql

          await pool.execute(sql, [...values, ...whereParams])
          return { data: null, error: null }
        }

        case 'delete': {
          let sql = `DELETE FROM \`${this.state.table}\``
          const { sql: whereSql, params } = this.buildWhereClause()
          sql += whereSql

          await pool.execute(sql, params)
          return { data: null, error: null }
        }

        default:
          return { data: null, error: 'Unknown operation' }
      }
    } catch (error) {
      console.error('MySQL query error:', error)
      return { data: null, error: (error as Error).message }
    }
  }
}

export function createMySQLAdapter(): DatabaseAdapter {
  const auth: DatabaseAuth = createMySQLAuth()

  return {
    auth,
    from<T = unknown>(table: string): QueryBuilder<T> {
      return new MySQLQueryBuilder<T>(table)
    },
    getProvider() {
      return 'mysql' as const
    },
  }
}
