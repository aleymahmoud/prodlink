import { NextRequest, NextResponse } from 'next/server';
import { db, lines } from '@/shared/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheet = workbook.getWorksheet('Products') || workbook.worksheets[0];
    if (!sheet) {
      return NextResponse.json({ error: 'No worksheet found' }, { status: 400 });
    }

    // Get active lines for mapping
    const activeLines = await db
      .select({ id: lines.id, name: lines.name, code: lines.code })
      .from(lines)
      .where(eq(lines.isActive, true));

    const lineMap = new Map<string, string>();
    activeLines.forEach(l => {
      lineMap.set(`${l.name} (${l.code})`, l.id);
      lineMap.set(l.name, l.id);
      lineMap.set(l.code, l.id);
    });

    const products: Array<{
      name: string;
      code: string;
      category: string | null;
      unit_of_measure: string;
      line_id: string | null;
      line_display: string;
    }> = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const lineValue = String(row.getCell(1).value || '').trim();
      const name = String(row.getCell(2).value || '').trim();
      const code = String(row.getCell(3).value || '').trim();
      const category = String(row.getCell(4).value || '').trim();
      const unit = String(row.getCell(5).value || '').trim();

      if (name && code) {
        products.push({
          name,
          code,
          category: category || null,
          unit_of_measure: unit || 'unit',
          line_id: lineMap.get(lineValue) || null,
          line_display: lineValue,
        });
      }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Parse Excel error:', error);
    return NextResponse.json({ error: 'Failed to parse Excel file' }, { status: 500 });
  }
}
