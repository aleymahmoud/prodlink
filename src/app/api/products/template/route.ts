import { NextResponse } from 'next/server';
import { db, lines } from '@/shared/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active lines
    const activeLines = await db
      .select({ id: lines.id, name: lines.name, code: lines.code })
      .from(lines)
      .where(eq(lines.isActive, true));

    const lineNames = activeLines.map(l => `${l.name} (${l.code})`);

    const unitOptions = [
      'kg', 'g', 'ton',
      'liter', 'ml',
      'piece', 'pcs',
      'box', 'carton', 'pack',
      'dozen', 'tray',
      'meter', 'cm',
    ];

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ProdLink';
    workbook.created = new Date();

    // === Lists Sheet (hidden reference data) ===
    const listsSheet = workbook.addWorksheet('Lists', { state: 'veryHidden' });
    listsSheet.getColumn(1).header = 'Production Lines';
    listsSheet.getColumn(2).header = 'Units of Measure';

    lineNames.forEach((name, i) => {
      listsSheet.getCell(i + 2, 1).value = name;
    });

    unitOptions.forEach((unit, i) => {
      listsSheet.getCell(i + 2, 2).value = unit;
    });

    // Define named ranges for dropdowns
    const lineRangeEnd = lineNames.length + 1;
    const unitRangeEnd = unitOptions.length + 1;

    // === Products Sheet ===
    const sheet = workbook.addWorksheet('Products');

    // Column widths
    sheet.columns = [
      { header: 'Production Line', key: 'line', width: 30 },
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Product Code / SKU', key: 'code', width: 20 },
      { header: 'Category (optional)', key: 'category', width: 22 },
      { header: 'Unit of Measure', key: 'unit', width: 18 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }, // indigo-600
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 28;

    // Add data validation for Production Line (column A) - rows 2 to 500
    const lineFormula = `Lists!$A$2:$A$${lineRangeEnd}`;
    for (let row = 2; row <= 500; row++) {
      sheet.getCell(row, 1).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [lineFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Line',
        error: 'Please select a production line from the dropdown list.',
      };
    }

    // Add data validation for Unit of Measure (column E) - rows 2 to 500
    const unitFormula = `Lists!$B$2:$B$${unitRangeEnd}`;
    for (let row = 2; row <= 500; row++) {
      sheet.getCell(row, 5).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [unitFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Unit',
        error: 'Please select a unit of measure from the dropdown list.',
      };
    }

    // Style data area with light borders
    for (let row = 2; row <= 10; row++) {
      for (let col = 1; col <= 5; col++) {
        const cell = sheet.getCell(row, col);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      }
    }

    // Protect sheet structure but allow editing cells
    sheet.protect('', {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: true,
      insertRows: true,
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ProdLink-Products-Template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
