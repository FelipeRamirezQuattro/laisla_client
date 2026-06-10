import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { insumosInvApi } from "../../../api/inventario";
import { rawMaterialsApi } from "../../../api/costs";
import { useAuth } from "../../../hooks/useAuth";
import { useToast } from "../../../hooks/useToast";
import { PageLoader } from "../../../components/ui/Spinner";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { CascadeWarningModal } from "../../../components/costos/CascadeWarningModal";
import { formatCOPDecimal, formatNumber } from "../../../utils/formatCurrency";
import {
  formatMeasurementUnit,
  MEASUREMENT_UNITS,
} from "../../../utils/measurementUnits";
import type {
  CategoriaConInsumos,
  InsumoCategoria,
  Insumo,
  RawMaterial,
  RawMaterialCategory,
  MeasurementUnit,
} from "../../../types";

const COST_CATEGORIES: { value: RawMaterialCategory; label: string }[] = [
  { value: "LACTEOS", label: "Lácteos" },
  { value: "BASES_POLVO", label: "Bases en polvo" },
  { value: "JARABES_SALSAS", label: "Jarabes y salsas" },
  { value: "CONCENTRADOS", label: "Concentrados" },
  { value: "TE_INFUSIONES", label: "Té e infusiones" },
  { value: "CAFE", label: "Café" },
  { value: "AGUA", label: "Agua" },
  { value: "VASOS_CARTON", label: "Vasos de cartón" },
  { value: "VASOS_PLASTICO", label: "Vasos plástico" },
  { value: "EXTRAS", label: "Extras" },
  { value: "SUPLEMENTOS", label: "Suplementos" },
  { value: "AZUCAR", label: "Azúcar" },
  { value: "POLVOS", label: "Polvos" },
  { value: "FRUTAS_VERDURAS", label: "Frutas y verduras" },
  { value: "UNTABLES", label: "Untables" },
  { value: "HIELO", label: "Hielo" },
  { value: "MODIFICADORES", label: "Modificadores" },
  { value: "POLLO", label: "Pollo" },
  { value: "SYRUPS", label: "Syrups" },
  { value: "PERLAS", label: "Perlas" },
  { value: "MATERIALES_PICNIC", label: "Materiales picnic" },
  { value: "DECORACION", label: "Decoración" },
];

const UNIT_OPTIONS = MEASUREMENT_UNITS.map((u) => ({
  value: u.value,
  label: u.label,
}));

const costCategoryLabel = (c: RawMaterialCategory) =>
  COST_CATEGORIES.find((x) => x.value === c)?.label ?? c;

type InsumoSortKey =
  | "orden"
  | "nombre"
  | "cantidadPresentacion"
  | "unidad"
  | "nivelBueno"
  | "nivelRegular"
  | "nivelAgotado"
  | "precioLista"
  | "activo";

type SortDirection = "asc" | "desc";

interface InsumoSort {
  key: InsumoSortKey;
  direction: SortDirection;
}

const defaultInsumoSort: InsumoSort = { key: "orden", direction: "asc" };

function compareNullableValues(
  a: string | number | boolean | null | undefined,
  b: string | number | boolean | null | undefined,
) {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(b) - Number(a);

  return String(a).localeCompare(String(b), "es", {
    numeric: true,
    sensitivity: "base",
  });
}

function sortInsumos(insumos: Insumo[], sort: InsumoSort) {
  return [...insumos].sort((a, b) => {
    const result = compareNullableValues(a[sort.key], b[sort.key]);
    return sort.direction === "asc" ? result : -result;
  });
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  onSort,
  children,
}: {
  label: string;
  sortKey: InsumoSortKey;
  activeSort: InsumoSort;
  onSort: (key: InsumoSortKey) => void;
  children?: React.ReactNode;
}) {
  const active = activeSort.key === sortKey;
  const Icon = active
    ? activeSort.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="group inline-flex items-center gap-1.5 text-left uppercase tracking-wide transition-colors hover:text-espresso"
      aria-label={`Ordenar por ${label}`}
    >
      <span>{children ?? label}</span>
      <Icon
        size={13}
        className={active ? "text-espresso" : "text-stone/60 group-hover:text-espresso"}
      />
    </button>
  );
}

interface CostFormData {
  category: RawMaterialCategory;
  name: string;
  presentation: string;
  purchaseUnit: MeasurementUnit;
  quantityPerPresentation: number;
  totalPrice: number;
  supplier: string;
  notes: string;
  minStock: number;
}

function InlineCell({
  value,
  onSave,
  type = "text",
  disabled,
  mask,
}: {
  value: string;
  onSave: (v: string) => void;
  type?: string;
  disabled?: boolean;
  mask?: "currency";
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  const formatCurrencyMask = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    return digits ? `$${formatNumber(Number(digits))}` : "";
  };
  const displayValue = mask === "currency" ? formatCurrencyMask(value) : val;

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);
  useEffect(() => {
    setVal(mask === "currency" ? formatCurrencyMask(value) : value);
  }, [value, mask]);

  if (!editing || disabled) {
    return (
      <span
        onClick={() => !disabled && setEditing(true)}
        className={`block px-2 py-1 rounded text-sm font-body min-w-[60px] ${
          disabled ? "" : "hover:bg-surface-tint cursor-pointer"
        } ${val ? "text-ink" : "text-stone italic"}`}
      >
        {displayValue || "—"}
      </span>
    );
  }

  const saveValue = () => {
    setEditing(false);
    const nextValue = mask === "currency" ? val.replace(/\D/g, "") : val;
    if (nextValue !== value) onSave(nextValue);
  };

  return (
    <input
      ref={ref}
      type={mask === "currency" ? "text" : type}
      inputMode={mask === "currency" ? "numeric" : undefined}
      value={val}
      onChange={(e) =>
        setVal(
          mask === "currency"
            ? formatCurrencyMask(e.target.value)
            : e.target.value,
        )
      }
      onBlur={saveValue}
      onKeyDown={(e) => {
        if (e.key === "Enter") saveValue();
        if (e.key === "Escape") {
          setEditing(false);
          setVal(mask === "currency" ? formatCurrencyMask(value) : value);
        }
      }}
      className="input-base py-1 text-sm w-full"
    />
  );
}

export function CatalogoInsumosPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === "admin";

  const [grupos, setGrupos] = useState<CategoriaConInsumos[]>([]);
  const [categorias, setCategorias] = useState<InsumoCategoria[]>([]);
  const [view, setView] = useState<"insumos" | "categorias" | "costos">(
    "insumos",
  );
  const [activeCat, setActiveCat] = useState<string>("all");
  const [insumoSearch, setInsumoSearch] = useState("");
  const [insumoSort, setInsumoSort] = useState<InsumoSort>(defaultInsumoSort);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [costLoading, setCostLoading] = useState(true);
  const [newRow, setNewRow] = useState<{
    nombre: string;
    unidad: MeasurementUnit;
    cantidadPresentacion: number;
  } | null>(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<InsumoCategoria | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [costItems, setCostItems] = useState<RawMaterial[]>([]);
  const [costSearch, setCostSearch] = useState("");
  const [costCatFilter, setCostCatFilter] = useState("");
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<RawMaterial | null>(null);
  const [cascadeModal, setCascadeModal] = useState<{
    id: string;
    packs: number;
    recipes: number;
  } | null>(null);
  const [pendingCostData, setPendingCostData] = useState<CostFormData | null>(
    null,
  );
  const [cascadeLoading, setCascadeLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    register: registerCost,
    handleSubmit: handleCostSubmit,
    reset: resetCost,
    formState: { errors: costErrors, isSubmitting: costSubmitting },
  } = useForm<CostFormData>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, gRes] = await Promise.all([
        insumosInvApi.getCategorias(),
        insumosInvApi.getCatalog(),
      ]);
      setCategorias(catRes.data);
      setGrupos(gRes.data);
    } catch {
      toast.error("Error al cargar catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadCostItems = useCallback(async () => {
    setCostLoading(true);
    try {
      const params: Record<string, string> = {};
      if (costSearch) params.search = costSearch;
      if (costCatFilter) params.category = costCatFilter;
      const res = await rawMaterialsApi.getAll(params);
      setCostItems(res.data);
    } catch {
      toast.error("Error al cargar datos de costos");
    } finally {
      setCostLoading(false);
    }
  }, [costSearch, costCatFilter]);

  useEffect(() => {
    loadCostItems();
  }, [loadCostItems]);

  const save = async (id: string, field: keyof Insumo, value: string) => {
    try {
      await insumosInvApi.update(id, { [field]: value || null });
      setGrupos((prev) =>
        prev.map((g) => ({
          ...g,
          insumos: g.insumos.map((i) =>
            i._id === id ? { ...i, [field]: value } : i,
          ),
        })),
      );
    } catch {
      toast.error("Error al guardar");
    }
  };

  const toggleInsumo = async (id: string, activo: boolean) => {
    try {
      if (activo) await insumosInvApi.delete(id);
      else await insumosInvApi.reactivar(id);
      load();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryModal(true);
  };

  const openEditCategory = (cat: InsumoCategoria) => {
    setEditingCategory(cat);
    setCategoryName(cat.nombre);
    setCategoryModal(true);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = categoryName.trim();
    if (!nombre) return;

    setCategorySaving(true);
    try {
      if (editingCategory) {
        await insumosInvApi.updateCategoria(editingCategory._id, { nombre });
        toast.success("Categoría actualizada");
      } else {
        const res = await insumosInvApi.createCategoria({ nombre });
        setActiveCat(res.data._id);
        setView("insumos");
        toast.success("Categoría creada");
      }
      setCategoryModal(false);
      setEditingCategory(null);
      setCategoryName("");
      load();
    } catch {
      toast.error("Error al guardar categoría");
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (cat: InsumoCategoria) => {
    const count =
      grupos.find((g) => g.categoria._id === cat._id)?.insumos.length ?? 0;
    if (count > 0) {
      toast.error("No se puede eliminar una categoría con insumos");
      return;
    }
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;

    try {
      await insumosInvApi.deleteCategoria(cat._id);
      if (activeCat === cat._id) setActiveCat("all");
      load();
      toast.success("Categoría eliminada");
    } catch {
      toast.error("Error al eliminar categoría");
    }
  };

  const openCreateCostItem = () => {
    setEditingCost(null);
    resetCost({
      category: "CAFE",
      purchaseUnit: "KG",
      quantityPerPresentation: 1,
      totalPrice: 0,
      minStock: 0,
      supplier: "",
      notes: "",
    });
    setCostModalOpen(true);
  };

  const openEditCostItem = (item: RawMaterial) => {
    setEditingCost(item);
    resetCost({
      category: item.category,
      name: item.name,
      presentation: item.presentation,
      purchaseUnit: item.purchaseUnit,
      quantityPerPresentation: item.quantityPerPresentation,
      totalPrice: item.totalPrice,
      supplier: item.supplier,
      notes: item.notes,
      minStock: item.minStock,
    });
    setCostModalOpen(true);
  };

  const saveCostItem = async (data: CostFormData) => {
    if (editingCost) {
      try {
        const preview = await rawMaterialsApi.cascadePreview(editingCost._id);
        const { affectedPacks, affectedRecipes } = preview.data;
        if (affectedPacks > 0 || affectedRecipes > 0) {
          setPendingCostData(data);
          setCascadeModal({
            id: editingCost._id,
            packs: affectedPacks,
            recipes: affectedRecipes,
          });
          return;
        }
        await rawMaterialsApi.update(editingCost._id, data);
        toast.success("Datos de costo actualizados");
        setCostModalOpen(false);
        loadCostItems();
      } catch {
        toast.error("Error al actualizar datos de costo");
      }
    } else {
      try {
        await rawMaterialsApi.create(data);
        toast.success("Insumo de costo creado");
        setCostModalOpen(false);
        loadCostItems();
      } catch {
        toast.error("Error al crear insumo de costo");
      }
    }
  };

  const confirmCostCascade = async () => {
    if (!cascadeModal || !pendingCostData) return;
    setCascadeLoading(true);
    try {
      await rawMaterialsApi.update(cascadeModal.id, pendingCostData);
      toast.success("Datos actualizados y costos recalculados");
      setCostModalOpen(false);
      setCascadeModal(null);
      setPendingCostData(null);
      loadCostItems();
    } catch {
      toast.error("Error al guardar datos de costo");
    } finally {
      setCascadeLoading(false);
    }
  };

  const deleteCostItem = async (item: RawMaterial) => {
    if (
      !window.confirm(
        `¿Eliminar el insumo de costo "${item.name}"? Esta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      await rawMaterialsApi.delete(item._id);
      toast.success("Insumo de costo eliminado");
      loadCostItems();
    } catch {
      toast.error(
        "No se pudo eliminar. Revisa si está usado en recetas o packs.",
      );
    }
  };

  const deleteSelected = async () => {
    if (!window.confirm(`¿Desactivar ${selected.size} insumo(s)?`)) return;
    try {
      await Promise.all(
        Array.from(selected).map((id) => insumosInvApi.delete(id)),
      );
      setSelected(new Set());
      load();
      toast.success("Insumos desactivados");
    } catch {
      toast.error("Error al desactivar");
    }
  };

  const addInsumo = async () => {
    if (!newRow?.nombre.trim()) return;
    const catId = activeCat !== "all" ? activeCat : categorias[0]?._id;
    if (!catId) return;
    try {
      const res = await insumosInvApi.create({
        nombre: newRow.nombre.trim(),
        unidad: newRow.unidad,
        cantidadPresentacion: newRow.cantidadPresentacion || 1,
        categoriaId: catId,
      });
      setNewRow(null);
      setInsumoSort(defaultInsumoSort);
      setGrupos((prev) =>
        prev.map((grupo) =>
          grupo.categoria._id === catId
            ? { ...grupo, insumos: [res.data, ...grupo.insumos] }
            : grupo,
        ),
      );
      toast.success("Insumo creado");
    } catch {
      toast.error("Error al crear insumo");
    }
  };

  const exportCsv = () => {
    const rows = grupos.flatMap((g) =>
      g.insumos.map((i) =>
        [
          i.nombre,
          g.categoria.nombre,
          i.unidad,
          i.cantidadPresentacion ?? 1,
          i.nivelBueno ?? "",
          i.nivelRegular ?? "",
          i.nivelAgotado ?? "",
          i.precioLista ?? "",
        ].join(","),
      ),
    );
    const csv = [
      "nombre,categoria,unidad,cantidadPresentacion,nivelBueno,nivelRegular,nivelAgotado,precioLista",
      ...rows,
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "catalogo-insumos.csv";
    a.click();
  };

  const importCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").slice(1).filter(Boolean);
    const rows = lines.map((line) => {
      const [
        nombre,
        categoria,
        unidad,
        cantidadPresentacion,
        nivelBueno,
        nivelRegular,
        nivelAgotado,
        precioLista,
      ] = line.split(",");
      return {
        nombre,
        categoria,
        unidad,
        cantidadPresentacion: parseFloat(cantidadPresentacion) || 1,
        nivelBueno,
        nivelRegular,
        nivelAgotado,
        precioLista: parseFloat(precioLista) || undefined,
      };
    });
    try {
      const res = await insumosInvApi.importCsv(rows);
      toast.success(
        `Importados: ${res.data.created}, omitidos: ${res.data.skipped}`,
      );
      load();
    } catch {
      toast.error("Error al importar");
    }
    e.target.value = "";
  };

  const visibleGrupos = useMemo(() => {
    const normalizedSearch = insumoSearch.trim().toLowerCase();
    const filtered =
      activeCat === "all"
        ? grupos
        : grupos.filter((g) => g.categoria._id === activeCat);

    return filtered.map((grupo) => ({
      ...grupo,
      insumos: sortInsumos(
        grupo.insumos.filter((insumo) => {
          if (!normalizedSearch) return true;
          return [
            insumo.nombre,
            grupo.categoria.nombre,
            insumo.unidad,
            insumo.nivelBueno,
            insumo.nivelRegular,
            insumo.nivelAgotado,
            insumo.activo ? "activo" : "inactivo",
            String(insumo.precioLista ?? ""),
          ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
        }),
        insumoSort,
      ),
    })).filter((grupo) => grupo.insumos.length > 0 || !normalizedSearch);
  }, [activeCat, grupos, insumoSort, insumoSearch]);

  const toggleInsumoSort = (key: InsumoSortKey) => {
    setInsumoSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };
  const categoryCounts = Object.fromEntries(
    grupos.map((g) => [g.categoria._id, g.insumos.length]),
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">
            Catálogo de Insumos
          </h1>
          <p className="text-stone font-body text-sm mt-1">
            {grupos.flatMap((g) => g.insumos).length} insumos en total
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            {view === "insumos" && selected.size > 0 && (
              <button
                onClick={deleteSelected}
                className="btn-ghost text-error-ink flex items-center gap-2 text-sm"
              >
                <Trash2 size={15} /> Desactivar ({selected.size})
              </button>
            )}
            {view === "insumos" && (
              <>
                <button
                  onClick={exportCsv}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Download size={15} /> Exportar CSV
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Upload size={15} /> Importar CSV
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={importCsv}
                />
                <button
                  onClick={() =>
                    setNewRow({
                      nombre: "",
                      unidad: "UND",
                      cantidadPresentacion: 1,
                    })
                  }
                  disabled={activeCat === "all"}
                  title={
                    activeCat === "all"
                      ? "Selecciona una categoría para crear un insumo"
                      : undefined
                  }
                  className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <Plus size={15} /> Nuevo insumo
                </button>
              </>
            )}
            {view === "categorias" && (
              <button
                onClick={openCreateCategory}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={15} /> Nueva categoría
              </button>
            )}
            {view === "costos" && (
              <button
                onClick={openCreateCostItem}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={15} /> Nuevo costo
              </button>
            )}
          </div>
        )}
      </div>

      <div className="inline-flex rounded-lg border border-rule bg-white p-1 shadow-sm">
        <button
          onClick={() => setView("insumos")}
          className={`px-3 py-1.5 rounded-md text-sm font-body transition-all ${view === "insumos" ? "bg-espresso text-cream" : "text-espresso hover:bg-surface-tint"}`}
        >
          Insumos
        </button>
        <button
          onClick={() => setView("categorias")}
          className={`px-3 py-1.5 rounded-md text-sm font-body transition-all ${view === "categorias" ? "bg-espresso text-cream" : "text-espresso hover:bg-surface-tint"}`}
        >
          Categorías
        </button>
        <button
          onClick={() => setView("costos")}
          className={`px-3 py-1.5 rounded-md text-sm font-body transition-all ${view === "costos" ? "bg-espresso text-cream" : "text-espresso hover:bg-surface-tint"}`}
        >
          Costos
        </button>
      </div>

      {view === "insumos" && (
        <>
          <div className="card grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
            <Input
              placeholder="Buscar por insumo, categoría, unidad, nivel o estado..."
              value={insumoSearch}
              onChange={(e) => setInsumoSearch(e.target.value)}
            />
            <div className="rounded-lg border border-rule bg-surface-tint px-4 py-2 font-body text-sm text-stone">
              {visibleGrupos.reduce((sum, grupo) => sum + grupo.insumos.length, 0)} resultados
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCat("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-body transition-all ${activeCat === "all" ? "bg-espresso text-cream" : "bg-surface-tint text-espresso hover:bg-surface-tint"}`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setActiveCat(cat._id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-body transition-all ${activeCat === cat._id ? "bg-espresso text-cream" : "bg-surface-tint text-espresso hover:bg-surface-tint"}`}
              >
                {cat.nombre}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={openCreateCategory}
                className="px-3 py-1.5 rounded-lg text-sm font-body text-espresso border border-dashed border-espresso/30 hover:bg-surface-tint"
              >
                <Plus size={14} className="inline mr-1" /> Categoría
              </button>
            )}
          </div>

          {categorias.length === 0 && (
            <div className="rounded-xl border border-dashed border-rule bg-white p-6 text-center">
              <p className="font-body text-lg font-semibold text-espresso">
                No hay categorías todavía
              </p>
              <p className="font-body text-sm text-stone mt-1">
                Crea una categoría antes de agregar insumos al catálogo.
              </p>
              {isAdmin && (
                <button
                  onClick={openCreateCategory}
                  className="btn-primary mt-4"
                >
                  Crear primera categoría
                </button>
              )}
            </div>
          )}

          {visibleGrupos.map((grupo) => (
            <div
              key={grupo.categoria._id}
              className="rounded-xl overflow-hidden shadow-sm border border-rule"
            >
              <div className="px-4 py-3 font-body font-bold text-espresso text-sm tracking-wide bg-surface-tint border-b border-rule">
                {grupo.categoria.nombre}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="bg-surface-tint text-stone text-xs uppercase tracking-wide">
                      {isAdmin && <th className="px-3 py-2 w-8"></th>}
                      <th className="px-3 py-2 text-left">
                        <SortableHeader
                          label="Nombre"
                          sortKey="nombre"
                          activeSort={insumoSort}
                          onSort={toggleInsumoSort}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">
                        <SortableHeader
                          label="Cantidad por presentación"
                          sortKey="cantidadPresentacion"
                          activeSort={insumoSort}
                          onSort={toggleInsumoSort}
                        >
                          <span className="block">Cantidad por presentación</span>
                        </SortableHeader>
                      </th>
                      <th className="px-3 py-2 text-left">
                        <SortableHeader
                          label="Unidad de presentación"
                          sortKey="unidad"
                          activeSort={insumoSort}
                          onSort={toggleInsumoSort}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">
                        <SortableHeader
                          label="Nivel Bueno"
                          sortKey="nivelBueno"
                          activeSort={insumoSort}
                          onSort={toggleInsumoSort}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">
                        <SortableHeader
                          label="Nivel Regular"
                          sortKey="nivelRegular"
                          activeSort={insumoSort}
                          onSort={toggleInsumoSort}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">
                        <SortableHeader
                          label="Nivel Agotado"
                          sortKey="nivelAgotado"
                          activeSort={insumoSort}
                          onSort={toggleInsumoSort}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">
                        <SortableHeader
                          label="Costo por unidad"
                          sortKey="precioLista"
                          activeSort={insumoSort}
                          onSort={toggleInsumoSort}
                        >
                          <span>
                            <span className="block">Costo por unidad</span>
                            <span className="block text-[11px] font-normal normal-case text-stone">
                              COP / unidad
                            </span>
                          </span>
                        </SortableHeader>
                      </th>
                      <th className="px-3 py-2 text-left">
                        <SortableHeader
                          label="Estado"
                          sortKey="activo"
                          activeSort={insumoSort}
                          onSort={toggleInsumoSort}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {newRow && activeCat === grupo.categoria._id && (
                      <tr className="bg-success-tint">
                        {isAdmin && <td className="px-3 py-2" />}
                        <td className="px-3 py-2">
                          <input
                            autoFocus
                            value={newRow.nombre}
                            onChange={(e) =>
                              setNewRow(
                                (r) => r && { ...r, nombre: e.target.value },
                              )
                            }
                            onKeyDown={(e) => e.key === "Enter" && addInsumo()}
                            className="input-base py-1 text-sm"
                            placeholder="Nombre del insumo"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={newRow.cantidadPresentacion}
                            onChange={(e) =>
                              setNewRow(
                                (r) =>
                                  r && {
                                    ...r,
                                    cantidadPresentacion: +e.target.value,
                                  },
                              )
                            }
                            className="input-base py-1 text-sm w-32"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={newRow.unidad}
                            onChange={(e) =>
                              setNewRow(
                                (r) =>
                                  r && {
                                    ...r,
                                    unidad: e.target.value as MeasurementUnit,
                                  },
                              )
                            }
                            className="input-base py-1 text-sm w-36"
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td
                          colSpan={4}
                          className="px-3 py-2 text-xs text-stone italic"
                        >
                          Guarda y edita los niveles después
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={addInsumo}
                              className="btn-primary py-1 text-xs"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewRow(null)}
                              className="btn-ghost py-1 text-xs"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {grupo.insumos.map((insumo) => (
                      <tr
                        key={insumo._id}
                        className={`${!insumo.activo ? "opacity-40" : ""} hover:bg-surface-tint`}
                      >
                        {isAdmin && (
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selected.has(insumo._id)}
                              onChange={() => {
                                setSelected((prev) => {
                                  const next = new Set(prev);
                                  next.has(insumo._id)
                                    ? next.delete(insumo._id)
                                    : next.add(insumo._id);
                                  return next;
                                });
                              }}
                            />
                          </td>
                        )}
                        <td className="px-3 py-2 font-medium text-espresso">
                          <InlineCell
                            value={insumo.nombre}
                            onSave={(v) => save(insumo._id, "nombre", v)}
                            disabled={!isAdmin || !insumo.activo}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <InlineCell
                            value={String(insumo.cantidadPresentacion ?? 1)}
                            type="number"
                            onSave={(v) =>
                              save(insumo._id, "cantidadPresentacion", v)
                            }
                            disabled={!isAdmin || !insumo.activo}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={insumo.unidad}
                            onChange={(e) =>
                              save(insumo._id, "unidad", e.target.value)
                            }
                            disabled={!isAdmin || !insumo.activo}
                            className="input-base py-1 text-sm w-36 disabled:bg-transparent disabled:border-transparent disabled:px-0"
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <InlineCell
                            value={insumo.nivelBueno ?? ""}
                            onSave={(v) => save(insumo._id, "nivelBueno", v)}
                            disabled={!isAdmin || !insumo.activo}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <InlineCell
                            value={insumo.nivelRegular ?? ""}
                            onSave={(v) => save(insumo._id, "nivelRegular", v)}
                            disabled={!isAdmin || !insumo.activo}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <InlineCell
                            value={insumo.nivelAgotado ?? ""}
                            onSave={(v) => save(insumo._id, "nivelAgotado", v)}
                            disabled={!isAdmin || !insumo.activo}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <InlineCell
                            value={insumo.precioLista?.toString() ?? ""}
                            mask="currency"
                            onSave={(v) => save(insumo._id, "precioLista", v)}
                            disabled={!isAdmin || !insumo.activo}
                          />
                        </td>
                        <td className="px-3 py-2">
                          {isAdmin && (
                            <button
                              onClick={() =>
                                toggleInsumo(insumo._id, insumo.activo)
                              }
                              className={`text-xs px-2 py-1 rounded-lg font-medium ${insumo.activo ? "bg-error-tint text-error-ink hover:bg-error-tint" : "bg-success-tint text-success hover:bg-success-tint"}`}
                            >
                              {insumo.activo ? "Desactivar" : "Reactivar"}
                            </button>
                          )}
                          {!isAdmin && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${insumo.activo ? "bg-success-tint text-success-ink" : "bg-rule text-stone"}`}
                            >
                              {insumo.activo ? "Activo" : "Inactivo"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {visibleGrupos.length === 0 && (
            <div className="card text-center text-stone">
              No se encontraron insumos.
            </div>
          )}
        </>
      )}

      {view === "categorias" && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead className="bg-surface-tint border-b border-rule">
              <tr>
                <th className="text-left px-4 py-3 text-stone font-medium">
                  Categoría
                </th>
                <th className="text-right px-4 py-3 text-stone font-medium">
                  Insumos
                </th>
                {isAdmin && (
                  <th className="text-right px-4 py-3 text-stone font-medium">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {categorias.map((cat) => {
                const count = categoryCounts[cat._id] ?? 0;
                return (
                  <tr
                    key={cat._id}
                    className="hover:bg-surface-tint transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-espresso">
                      {cat.nombre}
                    </td>
                    <td className="px-4 py-3 text-right text-stone">{count}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditCategory(cat)}
                            className="btn-ghost py-1 text-xs flex items-center gap-1"
                          >
                            <Pencil size={13} /> Editar
                          </button>
                          <button
                            onClick={() => deleteCategory(cat)}
                            disabled={count > 0}
                            title={
                              count > 0
                                ? "Primero mueve o desactiva los insumos de esta categoría"
                                : undefined
                            }
                            className="text-xs px-2 py-1 rounded-lg font-medium bg-error-tint text-error-ink hover:bg-error-tint disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {categorias.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 3 : 2}
                    className="text-center py-10 text-stone"
                  >
                    No hay categorías.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === "costos" && (
        <div className="space-y-4">
          <div className="card grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
            <Input
              placeholder="Buscar por nombre, proveedor o presentación..."
              value={costSearch}
              onChange={(e) => setCostSearch(e.target.value)}
            />
            <Select
              options={[
                { value: "", label: "Todas las categorías" },
                ...COST_CATEGORIES,
              ]}
              value={costCatFilter}
              onChange={(e) => setCostCatFilter(e.target.value)}
            />
          </div>

          {costLoading ? (
            <PageLoader />
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm font-body">
                <thead className="bg-surface-tint border-b border-rule">
                  <tr>
                    <th className="text-left px-4 py-3 text-stone font-medium">
                      Nombre
                    </th>
                    <th className="text-left px-4 py-3 text-stone font-medium">
                      Categoría
                    </th>
                    <th className="text-left px-4 py-3 text-stone font-medium">
                      Presentación
                    </th>
                    <th className="text-right px-4 py-3 text-stone font-medium">
                      Precio total
                    </th>
                    <th className="text-right px-4 py-3 text-stone font-medium">
                      Precio/unidad
                    </th>
                    <th className="text-left px-4 py-3 text-stone font-medium">
                      Proveedor
                    </th>
                    {isAdmin && (
                      <th className="text-right px-4 py-3 text-stone font-medium">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {costItems.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-surface-tint transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-ink">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-stone">
                        {costCategoryLabel(item.category)}
                      </td>
                      <td className="px-4 py-3 text-stone">
                        {item.quantityPerPresentation}{" "}
                        {formatMeasurementUnit(item.purchaseUnit)} -{" "}
                        {item.presentation}
                      </td>
                      <td className="px-4 py-3 text-right text-ink">
                        {formatCOPDecimal(item.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-espresso font-medium">
                        {formatCOPDecimal(item.pricePerUnit)}
                      </td>
                      <td className="px-4 py-3 text-stone">{item.supplier}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditCostItem(item)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => deleteCostItem(item)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {costItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={isAdmin ? 7 : 6}
                        className="text-center py-10 text-stone"
                      >
                        No se encontraron datos de costo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={categoryModal}
        onClose={() => setCategoryModal(false)}
        title={editingCategory ? "Editar categoría" : "Nueva categoría"}
      >
        <form onSubmit={saveCategory} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink font-body block mb-1">
              Nombre
            </label>
            <input
              autoFocus
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="input-base"
              placeholder="Ej: Barra, Cocina, Caja"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCategoryModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={categorySaving || !categoryName.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {categorySaving
                ? "Guardando..."
                : editingCategory
                  ? "Actualizar"
                  : "Crear"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={costModalOpen}
        onClose={() => setCostModalOpen(false)}
        title={editingCost ? "Editar datos de costo" : "Nuevo insumo de costo"}
        size="lg"
      >
        <form onSubmit={handleCostSubmit(saveCostItem)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Categoría"
              options={COST_CATEGORIES}
              error={costErrors.category?.message}
              {...registerCost("category", { required: true })}
            />
            <Select
              label="Unidad de compra"
              options={UNIT_OPTIONS}
              error={costErrors.purchaseUnit?.message}
              {...registerCost("purchaseUnit", { required: true })}
            />
          </div>
          <Input
            label="Nombre del insumo"
            error={costErrors.name?.message}
            {...registerCost("name", { required: "Requerido" })}
          />
          <Input
            label="Presentación (ej: Bolsa 1KG)"
            error={costErrors.presentation?.message}
            {...registerCost("presentation", { required: "Requerido" })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cantidad por presentación"
              type="number"
              step="0.001"
              error={costErrors.quantityPerPresentation?.message}
              {...registerCost("quantityPerPresentation", {
                required: true,
                valueAsNumber: true,
                min: 0.001,
              })}
            />
            <Input
              label="Precio total (COP)"
              type="number"
              step="0.01"
              error={costErrors.totalPrice?.message}
              {...registerCost("totalPrice", {
                required: true,
                valueAsNumber: true,
                min: 0,
              })}
            />
          </div>
          <Input label="Proveedor" {...registerCost("supplier")} />
          <Input
            label="Stock mínimo"
            type="number"
            {...registerCost("minStock", { valueAsNumber: true })}
          />
          <div>
            <label className="text-sm font-medium text-ink font-body block mb-1">
              Notas
            </label>
            <textarea
              className="input-base h-16 resize-none"
              {...registerCost("notes")}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setCostModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={costSubmitting}>
              {editingCost ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>

      <CascadeWarningModal
        isOpen={!!cascadeModal}
        affectedPacks={cascadeModal?.packs ?? 0}
        affectedRecipes={cascadeModal?.recipes ?? 0}
        loading={cascadeLoading}
        onConfirm={confirmCostCascade}
        onCancel={() => {
          setCascadeModal(null);
          setPendingCostData(null);
        }}
      />
    </div>
  );
}
