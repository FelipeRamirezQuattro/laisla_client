import { describe, it, expect } from 'vitest';
import { buildRecipeTemplate, readRecipeSheet } from './recipeTemplate';

describe('recipeTemplate', () => {
  it('genera una plantilla vacía que se puede leer sin filas', async () => {
    const buffer = await buildRecipeTemplate(['Café caliente', 'Waffle']);
    const { rows, missingColumns } = await readRecipeSheet(buffer);
    expect(missingColumns).toEqual([]);
    expect(rows).toEqual([]);
  });

  it('lee filas llenadas por el usuario', async () => {
    const { default: ExcelJS } = await import('exceljs');
    const buffer = await buildRecipeTemplate(['Café caliente']);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    const sheet = wb.getWorksheet('Productos')!;
    sheet.getRow(2).values = ['Latte', 'Café caliente', '', '8OZ', 7000, 'IVA 19%', 3, 'SI'];
    sheet.getRow(4).values = ['Chai', 'Chai', 'Con especias', '12OZ', 9000, 'Sin impuesto'];
    const out = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
    const { rows } = await readRecipeSheet(out);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ fila: 2, nombre: 'Latte', tamano: '8OZ', precio_venta: 7000, impuesto: 'IVA 19%' });
    expect(rows[1]).toMatchObject({ fila: 4, nombre: 'Chai', descripcion: 'Con especias' });
  });

  it('avisa de columnas obligatorias que faltan', async () => {
    const { default: ExcelJS } = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('Productos').addRow(['Nombre', 'Otra cosa']);
    const { missingColumns } = await readRecipeSheet((await wb.xlsx.writeBuffer()) as ArrayBuffer);
    expect(missingColumns).toEqual(expect.arrayContaining(['Categoría*', 'Tamaño*']));
  });
});
