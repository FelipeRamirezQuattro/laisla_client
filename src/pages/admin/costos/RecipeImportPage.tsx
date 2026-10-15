import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { recipesApi, RecipeImportResponse } from '../../../api/costs';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatCOP } from '../../../utils/formatCurrency';
import { buildRecipeTemplate, readRecipeSheet, SheetRow } from '../../../utils/recipeTemplate';

const MAX_ROWS = 500;
const TAX_LABEL: Record<string, string> = { IVA_19: 'IVA 19%', CONSUMO_8: 'Impoconsumo 8%', NONE: 'Sin impuesto' };

function apiError(error: unknown, fallback: string) {
  return (error as { response?: { data?: { error?: string } } }).response?.data?.error || fallback;
}

export function RecipeImportPage() {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [preview, setPreview] = useState<RecipeImportResponse | null>(null);
  const [result, setResult] = useState<RecipeImportResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFileName('');
    setRows([]);
    setPreview(null);
    setResult(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const downloadTemplate = async () => {
    try {
      const { data: categories } = await recipesApi.getCategories();
      const buffer = await buildRecipeTemplate(categories.map((c) => c.label));
      const url = URL.createObjectURL(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla-productos.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo generar la plantilla');
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    reset();
    setBusy(true);
    try {
      const { rows: parsed, missingColumns } = await readRecipeSheet(await file.arrayBuffer());
      if (missingColumns.length > 0) {
        toast.error(`Faltan columnas en el archivo: ${missingColumns.join(', ')}. Usa la plantilla.`);
        return;
      }
      if (parsed.length === 0) { toast.error('El archivo no tiene filas con datos'); return; }
      if (parsed.length > MAX_ROWS) { toast.error(`Máximo ${MAX_ROWS} filas por archivo (tiene ${parsed.length})`); return; }
      setFileName(file.name);
      setRows(parsed);
      const res = await recipesApi.importRecipes(parsed, true);
      setPreview(res.data);
    } catch (error) {
      toast.error(apiError(error, 'No se pudo leer el archivo. ¿Es un .xlsx válido?'));
    } finally {
      setBusy(false);
    }
  };

  const confirmImport = async () => {
    setBusy(true);
    try {
      const res = await recipesApi.importRecipes(rows, false);
      setResult(res.data);
      setPreview(null);
      toast.success(`${res.data.created ?? 0} receta(s) creada(s)`);
    } catch (error) {
      toast.error(apiError(error, 'Error al importar las recetas'));
    } finally {
      setBusy(false);
    }
  };

  const toCreate = preview?.toCreate ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/costos/recetas" className="inline-flex items-center gap-1 text-sm text-island-dark/70 font-body mb-2">
          <ArrowLeft size={14} /> Recetas
        </Link>
        <h1 className="font-body text-2xl font-bold text-island-dark">Importar recetas desde Excel</h1>
        <p className="text-island-dark/70 font-body text-sm">
          Crea varios productos a la vez: una fila por tamaño. Los ingredientes y costos se agregan después en cada receta.
        </p>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" icon={<Download size={15} />} onClick={downloadTemplate}>Descargar plantilla</Button>
          <Button icon={<Upload size={15} />} loading={busy} onClick={() => fileInput.current?.click()}>
            Elegir archivo .xlsx
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </div>
        {fileName && (
          <p className="text-sm font-body text-island-dark flex items-center gap-2">
            <FileSpreadsheet size={16} /> {fileName} · {rows.length} fila(s)
          </p>
        )}
      </div>

      {preview && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="green" label={`${toCreate.length} receta(s) para crear`} />
            {preview.skipped.length > 0 && <Badge variant="yellow" label={`${preview.skipped.length} omitida(s)`} />}
            {preview.errors.length > 0 && <Badge variant="red" label={`${preview.errors.length} fila(s) con error`} />}
            {preview.newCategories.length > 0 && <Badge variant="blue" label={`Categorías nuevas: ${preview.newCategories.join(', ')}`} />}
          </div>

          {preview.errors.length > 0 && (
            <div className="card border border-error bg-error-tint text-error-ink space-y-1 text-sm font-body">
              <p className="font-semibold">Corrige estas filas en el Excel y vuelve a subirlo (las recetas con errores no se importan):</p>
              <ul className="list-disc pl-5">
                {preview.errors.map((e, i) => <li key={i}>Fila {e.row}: {e.message}</li>)}
              </ul>
            </div>
          )}

          {preview.skipped.length > 0 && (
            <div className="card border border-warning bg-warning-tint text-warning-ink space-y-1 text-sm font-body">
              <p className="font-semibold">Se omiten (no se sobrescriben):</p>
              <ul className="list-disc pl-5">
                {preview.skipped.map((s, i) => <li key={i}>{s.name}: {s.reason}</li>)}
              </ul>
            </div>
          )}

          {toCreate.length > 0 && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="text-left text-island-dark/70">
                    <th className="py-2 pr-3">Receta</th><th className="py-2 pr-3">Categoría</th><th className="py-2">Variantes</th>
                  </tr>
                </thead>
                <tbody>
                  {toCreate.map((r) => (
                    <tr key={r.name} className="border-t border-island-blue/20 align-top">
                      <td className="py-2 pr-3 font-medium text-island-dark">{r.name}</td>
                      <td className="py-2 pr-3 text-island-dark">{r.category}{r.isNewCategory && ' (nueva)'}</td>
                      <td className="py-2 text-island-dark">
                        {r.variants.map((v) => `${v.size} · ${formatCOP(v.salePrice)} · ${TAX_LABEL[v.taxType] ?? v.taxType}`).join('  |  ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={reset}>Cancelar</Button>
            <Button onClick={confirmImport} loading={busy} disabled={toCreate.length === 0}>
              Importar {toCreate.length} receta(s)
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="card space-y-3 font-body text-sm text-island-dark">
          <p className="text-base font-semibold">{result.created ?? 0} receta(s) creada(s)</p>
          {result.skipped.length > 0 && <p>{result.skipped.length} omitida(s) por existir ya.</p>}
          {(result.failed?.length ?? 0) > 0 && (
            <ul className="list-disc pl-5 text-error-ink">
              {result.failed!.map((f, i) => <li key={i}>{f.name}: {f.reason}</li>)}
            </ul>
          )}
          <div className="flex gap-3">
            <Link to="/admin/costos/recetas"><Button>Ver recetas</Button></Link>
            <Button variant="secondary" onClick={reset}>Importar otro archivo</Button>
          </div>
        </div>
      )}
    </div>
  );
}
