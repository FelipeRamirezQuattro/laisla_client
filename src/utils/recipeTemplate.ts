// Plantilla Excel y lector para la importación masiva de recetas-producto.
// exceljs es pesado: quien llama debe invocar estas funciones desde la página
// de importación (el import es dinámico para no engordar el bundle principal).
import type { Workbook } from 'exceljs';

export const TEMPLATE_SHEET = 'Productos';
export const TEMPLATE_SIZES = ['6OZ', '8OZ', '12OZ', '16OZ', '20OZ', 'UND'];
export const TEMPLATE_TAXES = ['IVA 19%', 'Impoconsumo 8%', 'Sin impuesto'];
const MAX_ROWS = 500;

const COLUMNS = [
  { key: 'nombre', header: 'Nombre*', width: 30 },
  { key: 'categoria', header: 'Categoría*', width: 22 },
  { key: 'descripcion', header: 'Descripción', width: 36 },
  { key: 'tamano', header: 'Tamaño*', width: 12 },
  { key: 'precio_venta', header: 'Precio de venta (con impuesto)*', width: 20 },
  { key: 'impuesto', header: 'Impuesto*', width: 18 },
  { key: 'tiempo_preparacion_min', header: 'Tiempo de preparación (min)', width: 16 },
  { key: 'activo', header: 'Activo', width: 10 },
] as const;

export type SheetRow = Partial<Record<(typeof COLUMNS)[number]['key'], unknown>> & { fila: number };

const normalizeHeader = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const HEADER_ALIASES: Record<string, (typeof COLUMNS)[number]['key']> = {
  nombre: 'nombre',
  categoria: 'categoria',
  descripcion: 'descripcion',
  tamano: 'tamano',
  precio: 'precio_venta',
  precioventa: 'precio_venta',
  preciodeventa: 'precio_venta',
  preciodeventaconimpuesto: 'precio_venta',
  impuesto: 'impuesto',
  tiempodepreparacionmin: 'tiempo_preparacion_min',
  tiempopreparacionmin: 'tiempo_preparacion_min',
  activo: 'activo',
};

function aliasFor(header: string) {
  return HEADER_ALIASES[normalizeHeader(header)];
}

export async function buildRecipeTemplate(categoryLabels: string[]): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();

  const sheet = wb.addWorksheet(TEMPLATE_SHEET, { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F6F73' } };
  header.alignment = { vertical: 'middle', wrapText: true };
  header.height = 32;

  const lists = wb.addWorksheet('Listas');
  lists.addRow(['Categorías (puedes escribir una nueva)', 'Tamaños', 'Impuestos', 'Activo']);
  lists.getRow(1).font = { bold: true };
  const longest = Math.max(categoryLabels.length, TEMPLATE_SIZES.length, TEMPLATE_TAXES.length, 2);
  for (let i = 0; i < longest; i++) {
    lists.addRow([categoryLabels[i] ?? '', TEMPLATE_SIZES[i] ?? '', TEMPLATE_TAXES[i] ?? '', ['SI', 'NO'][i] ?? '']);
  }
  lists.columns = [{ width: 38 }, { width: 12 }, { width: 18 }, { width: 10 }];
  const catEnd = Math.max(categoryLabels.length, 1) + 1;

  for (let r = 2; r <= MAX_ROWS + 1; r++) {
    sheet.getCell(`B${r}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: [`Listas!$A$2:$A$${catEnd}`],
      showErrorMessage: true, errorStyle: 'warning', errorTitle: 'Categoría nueva',
      error: 'Esta categoría no existe todavía; se creará al importar.',
    };
    sheet.getCell(`D${r}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: [`"${TEMPLATE_SIZES.join(',')}"`],
      showErrorMessage: true, errorTitle: 'Tamaño inválido', error: `Usa: ${TEMPLATE_SIZES.join(', ')}`,
    };
    sheet.getCell(`E${r}`).numFmt = '#,##0';
    sheet.getCell(`F${r}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: [`"${TEMPLATE_TAXES.join(',')}"`],
      showErrorMessage: true, errorTitle: 'Impuesto inválido', error: `Usa: ${TEMPLATE_TAXES.join(', ')}`,
    };
    sheet.getCell(`H${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: ['"SI,NO"'] };
  }

  const example = wb.addWorksheet('Ejemplo');
  example.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  example.getRow(1).font = { bold: true };
  example.addRows([
    { nombre: 'Latte', categoria: 'Café caliente', descripcion: 'Espresso con leche', tamano: '8OZ', precio_venta: 7000, impuesto: 'IVA 19%', tiempo_preparacion_min: 3, activo: 'SI' },
    { nombre: 'Latte', categoria: 'Café caliente', tamano: '12OZ', precio_venta: 9000, impuesto: 'IVA 19%' },
    { nombre: 'Waffle de frutas', categoria: 'Waffle', tamano: 'UND', precio_venta: 14000, impuesto: 'Impoconsumo 8%', tiempo_preparacion_min: 8 },
  ]);

  const help = wb.addWorksheet('Instrucciones');
  help.getColumn(1).width = 110;
  [
    'CÓMO USAR ESTA PLANTILLA',
    '1. Llena la hoja "Productos": una fila por cada tamaño (variante) de un producto.',
    '2. Si un producto tiene varios tamaños, repite el mismo Nombre y la misma Categoría en cada fila (mira la hoja "Ejemplo").',
    '3. Los campos con * son obligatorios. El precio es el precio final de venta, con el impuesto incluido.',
    '4. Tamaño: 6OZ, 8OZ, 12OZ, 16OZ, 20OZ o UND (para productos por unidad).',
    '5. Impuesto: IVA 19%, Impoconsumo 8% o Sin impuesto.',
    '6. Activo: SI o NO (si lo dejas vacío se toma SI).',
    '7. Máximo 500 filas por archivo. No cambies los títulos de las columnas de la hoja "Productos".',
    '8. Los productos que ya existen (mismo nombre) se omiten, no se sobrescriben.',
    '9. Los ingredientes y costos se agregan después, editando cada receta.',
    '10. Si escribes una categoría que no existe, se crea automáticamente al importar.',
  ].forEach((line, i) => {
    const row = help.addRow([line]);
    if (i === 0) row.font = { bold: true, size: 13 };
    row.alignment = { wrapText: true, vertical: 'top' };
  });

  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

function cellValue(value: unknown): unknown {
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const v = value as { richText?: Array<{ text: string }>; result?: unknown; text?: unknown };
    if (v.richText) return v.richText.map((part) => part.text).join('');
    if ('result' in v) return v.result;
    if ('text' in v) return v.text;
  }
  return value;
}

export async function readRecipeSheet(data: ArrayBuffer): Promise<{ rows: SheetRow[]; missingColumns: string[] }> {
  const { default: ExcelJS } = await import('exceljs');
  const wb: Workbook = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  const sheet = wb.getWorksheet(TEMPLATE_SHEET) ?? wb.worksheets[0];
  if (!sheet) return { rows: [], missingColumns: COLUMNS.map((c) => c.header) };

  const columnByIndex = new Map<number, (typeof COLUMNS)[number]['key']>();
  sheet.getRow(1).eachCell((cell, col) => {
    const key = aliasFor(String(cellValue(cell.value) ?? ''));
    if (key) columnByIndex.set(col, key);
  });
  const found = new Set(columnByIndex.values());
  const required = ['nombre', 'categoria', 'tamano', 'precio_venta', 'impuesto'] as const;
  const missingColumns = required
    .filter((key) => !found.has(key))
    .map((key) => COLUMNS.find((c) => c.key === key)!.header);

  const rows: SheetRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const parsed: SheetRow = { fila: rowNumber };
    let hasData = false;
    columnByIndex.forEach((key, col) => {
      const value = cellValue(row.getCell(col).value);
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        parsed[key] = value;
        hasData = true;
      }
    });
    if (hasData) rows.push(parsed);
  });
  return { rows, missingColumns };
}
