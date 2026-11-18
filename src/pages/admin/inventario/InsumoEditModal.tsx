import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { insumosInvApi } from "../../../api/inventario";
import { providersApi } from "../../../api/providers";
import { useToast } from "../../../hooks/useToast";
import { MEASUREMENT_UNITS } from "../../../utils/measurementUnits";
import type {
  Insumo,
  InsumoCategoria,
  MeasurementUnit,
  Provider,
  TipoVencimiento,
} from "../../../types";

interface Props {
  isOpen: boolean;
  /** Insumo a editar; `null` abre el modal en modo "crear". */
  insumo: Insumo | null;
  categorias: InsumoCategoria[];
  /** Categoría preseleccionada al crear. */
  defaultCategoriaId?: string;
  /** Nombre inicial al crear (p. ej. lo que se escribió en un buscador). */
  defaultNombre?: string;
  onClose: () => void;
  onSaved: (saved: Insumo) => void;
}

const idOf = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    return String((value as { _id: string })._id);
  }
  return String(value);
};

const TIPOS_VENCIMIENTO: { value: TipoVencimiento; label: string; hint: string }[] = [
  { value: "NINGUNO", label: "No vence", hint: "Sal, azúcar, desechables…" },
  { value: "FECHA", label: "Fecha de vencimiento", hint: "Cada compra trae su fecha (leche, lácteos…)" },
  { value: "VIDA_UTIL", label: "Vida útil en días", hint: "Dura N días desde la compra (aguacate, fruta…)" },
];

// Cadena vacía → null, para poder limpiar un campo opcional.
const toNumberOrNull = (value: string): number | null => {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

export function InsumoEditModal({ isOpen, insumo, categorias, defaultCategoriaId, defaultNombre, onClose, onSaved }: Props) {
  const creating = insumo === null;
  const toast = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [unidad, setUnidad] = useState<MeasurementUnit>("UND");
  const [cantidadPresentacion, setCantidadPresentacion] = useState("1");
  const [precioLista, setPrecioLista] = useState("");
  const [nivelBueno, setNivelBueno] = useState("");
  const [nivelRegular, setNivelRegular] = useState("");
  const [nivelAgotado, setNivelAgotado] = useState("");
  const [proveedorPrincipalId, setProveedorPrincipalId] = useState("");
  const [proveedorIds, setProveedorIds] = useState<string[]>([]);
  const [stockMinimo, setStockMinimo] = useState("");
  const [tipoVencimiento, setTipoVencimiento] = useState<TipoVencimiento>("NINGUNO");
  const [vidaUtilDias, setVidaUtilDias] = useState("");

  useEffect(() => {
    providersApi
      .getAll({ limit: 200 })
      .then((res) => setProviders(res.data.providers))
      .catch(() => toast.error("No se pudieron cargar los proveedores"));
  }, []);

  // Rehidrata el formulario cada vez que se abre (con otro insumo, o limpio al crear).
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    if (!insumo) {
      setNombre(defaultNombre ?? "");
      setCategoriaId(defaultCategoriaId ?? "");
      setUnidad("UND");
      setCantidadPresentacion("1");
      setPrecioLista("");
      setNivelBueno("");
      setNivelRegular("");
      setNivelAgotado("");
      setProveedorPrincipalId("");
      setProveedorIds([]);
      setStockMinimo("");
      setTipoVencimiento("NINGUNO");
      setVidaUtilDias("");
      return;
    }
    setNombre(insumo.nombre);
    setCategoriaId(idOf(insumo.categoriaId));
    setUnidad(insumo.unidad);
    setCantidadPresentacion(String(insumo.cantidadPresentacion ?? 1));
    setPrecioLista(insumo.precioLista != null ? String(insumo.precioLista) : "");
    setNivelBueno(insumo.nivelBueno ?? "");
    setNivelRegular(insumo.nivelRegular ?? "");
    setNivelAgotado(insumo.nivelAgotado ?? "");
    setProveedorPrincipalId(idOf(insumo.proveedorPrincipalId));
    setProveedorIds((insumo.proveedorIds ?? []).map(idOf));
    setStockMinimo(insumo.stockMinimo != null ? String(insumo.stockMinimo) : "");
    setTipoVencimiento(insumo.tipoVencimiento ?? "NINGUNO");
    setVidaUtilDias(insumo.vidaUtilDias != null ? String(insumo.vidaUtilDias) : "");
  }, [isOpen, insumo]);

  const toggleProveedor = (id: string) =>
    setProveedorIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cantidad = Number(cantidadPresentacion);
    const precio = toNumberOrNull(precioLista);
    const minimo = toNumberOrNull(stockMinimo);
    const dias = toNumberOrNull(vidaUtilDias);

    if (!nombre.trim()) return setError("El nombre es obligatorio");
    if (!categoriaId) return setError("Selecciona una categoría");
    if (!Number.isFinite(cantidad) || cantidad < 0.001) return setError("La cantidad por presentación debe ser mayor a 0");
    if (Number.isNaN(precio) || (precio !== null && precio < 0)) return setError("El precio de lista no es válido");
    if (Number.isNaN(minimo) || (minimo !== null && minimo < 0)) return setError("El stock mínimo no es válido");
    if (tipoVencimiento === "VIDA_UTIL" && (dias === null || Number.isNaN(dias) || dias < 1)) {
      return setError("Indica cuántos días dura el insumo (mínimo 1)");
    }

    // El proveedor principal siempre forma parte de la lista de proveedores.
    const proveedores = proveedorPrincipalId && !proveedorIds.includes(proveedorPrincipalId)
      ? [...proveedorIds, proveedorPrincipalId]
      : proveedorIds;

    setError("");
    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        categoriaId,
        unidad,
        cantidadPresentacion: cantidad,
        precioLista: precio,
        nivelBueno: nivelBueno.trim() || null,
        nivelRegular: nivelRegular.trim() || null,
        nivelAgotado: nivelAgotado.trim() || null,
        proveedorPrincipalId: proveedorPrincipalId || null,
        proveedorIds: proveedores,
        stockMinimo: minimo,
        tipoVencimiento,
        vidaUtilDias: tipoVencimiento === "VIDA_UTIL" ? dias : null,
      } as Partial<Insumo>;
      const res = insumo
        ? await insumosInvApi.update(insumo._id, payload)
        : await insumosInvApi.create(payload);
      toast.success(creating ? "Insumo creado" : "Insumo actualizado");
      onSaved(res.data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message ?? (creating ? "Error al crear el insumo" : "Error al guardar el insumo"));
    } finally {
      setSaving(false);
    }
  };

  const label = "text-sm font-medium text-island-dark font-body block mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={creating ? "Nuevo insumo" : "Editar insumo"} size="xl">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={label}>Nombre</label>
            <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className="input-base" />
          </div>
          <div>
            <label className={label}>Categoría</label>
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className="input-base">
              <option value="">Selecciona…</option>
              {categorias.map((c) => (
                <option key={c._id} value={c._id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Unidad</label>
            <select value={unidad} onChange={(e) => setUnidad(e.target.value as MeasurementUnit)} className="input-base">
              {MEASUREMENT_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Cantidad por presentación</label>
            <input type="number" step="any" min="0.001" value={cantidadPresentacion} onChange={(e) => setCantidadPresentacion(e.target.value)} className="input-base" />
          </div>
          <div>
            <label className={label}>Precio de lista (COP)</label>
            <input type="number" min="0" value={precioLista} onChange={(e) => setPrecioLista(e.target.value)} className="input-base" placeholder="Opcional" />
          </div>
        </div>

        <fieldset className="border border-island-blue/20 rounded-lg p-4">
          <legend className="px-2 text-sm font-semibold text-island-dark font-body">Niveles de inventario</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={label}>Bueno</label>
              <input value={nivelBueno} onChange={(e) => setNivelBueno(e.target.value)} className="input-base" />
            </div>
            <div>
              <label className={label}>Regular</label>
              <input value={nivelRegular} onChange={(e) => setNivelRegular(e.target.value)} className="input-base" />
            </div>
            <div>
              <label className={label}>Agotado</label>
              <input value={nivelAgotado} onChange={(e) => setNivelAgotado(e.target.value)} className="input-base" />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-island-blue/20 rounded-lg p-4 space-y-3">
          <legend className="px-2 text-sm font-semibold text-island-dark font-body">Alertas y vencimiento</legend>
          <div>
            <label className={label}>Stock mínimo ({unidad})</label>
            <input type="number" step="any" min="0" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} className="input-base" placeholder="Sin alerta si se deja vacío" />
            <p className="text-xs text-island-dark/60 mt-1">Cuando el stock baje de este valor se avisa a todos los usuarios.</p>
          </div>
          <div>
            <label className={label}>¿Cómo vence?</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TIPOS_VENCIMIENTO.map((t) => (
                <label
                  key={t.value}
                  className={`border rounded-lg p-3 cursor-pointer text-sm ${tipoVencimiento === t.value ? "border-island-dark bg-gray-100" : "border-island-blue/30"}`}
                >
                  <input
                    type="radio"
                    name="tipoVencimiento"
                    className="mr-2"
                    checked={tipoVencimiento === t.value}
                    onChange={() => setTipoVencimiento(t.value)}
                  />
                  <span className="font-medium">{t.label}</span>
                  <span className="block text-xs text-island-dark/60 mt-1">{t.hint}</span>
                </label>
              ))}
            </div>
          </div>
          {tipoVencimiento === "VIDA_UTIL" && (
            <div>
              <label className={label}>Días de vida útil</label>
              <input type="number" min="1" step="1" value={vidaUtilDias} onChange={(e) => setVidaUtilDias(e.target.value)} className="input-base" placeholder="Ej: 3" />
            </div>
          )}
        </fieldset>

        <fieldset className="border border-island-blue/20 rounded-lg p-4 space-y-3">
          <legend className="px-2 text-sm font-semibold text-island-dark font-body">Proveedores</legend>
          <div>
            <label className={label}>Proveedor principal</label>
            <select value={proveedorPrincipalId} onChange={(e) => setProveedorPrincipalId(e.target.value)} className="input-base">
              <option value="">Sin proveedor principal</option>
              {providers.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Otros proveedores</label>
            <div className="max-h-32 overflow-y-auto border border-island-blue/20 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {providers.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={proveedorIds.includes(p._id)} onChange={() => toggleProveedor(p._id)} />
                  {p.name}
                </label>
              ))}
              {providers.length === 0 && <span className="text-sm text-island-dark/60">No hay proveedores registrados.</span>}
            </div>
          </div>
        </fieldset>

        {error && <p role="alert" className="text-sm text-error-ink bg-error-tint rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "Guardando..." : creating ? "Crear insumo" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
