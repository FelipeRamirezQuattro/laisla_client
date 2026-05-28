import { Plus, X } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { disposablePacksApi } from '../../../api/costs';
import { insumosInvApi } from '../../../api/inventario';
import { CategoriaConInsumos, DisposablePack, Insumo, InsumoCategoria, RecipeIngredientUnit } from '../../../types';
import { formatCOPDecimal } from '../../../utils/formatCurrency';
import { calcConvertedCost, formatMeasurementUnit, MEASUREMENT_UNITS } from '../../../utils/measurementUnits';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { PageLoader } from '../../../components/ui/Spinner';

const UNIT_OPTIONS = MEASUREMENT_UNITS.map((u) => ({ value: u.value, label: u.label }));

interface PackItem {
  rawMaterialId: string;
  quantity: number;
  unit: RecipeIngredientUnit;
}

export function DisposablePacksPage() {
  const [packs, setPacks] = useState<DisposablePack[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [categorias, setCategorias] = useState<InsumoCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DisposablePack | null>(null);
  const [packName, setPackName] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [items, setItems] = useState<PackItem[]>([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [packsRes, insumosRes] = await Promise.all([
        disposablePacksApi.getAll(),
        insumosInvApi.getAgrupados(),
      ]);
      setPacks(packsRes.data);
      const grupos = insumosRes.data as CategoriaConInsumos[];
      setCategorias(grupos.map((g) => g.categoria));
      setInsumos(grupos.flatMap((g) => g.insumos));
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!modalOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const categoryIdOf = (insumo: Insumo) =>
    typeof insumo.categoriaId === 'string' ? insumo.categoriaId : insumo.categoriaId._id;
  const categoryName = (id: string) => categorias.find((c) => c._id === id)?.nombre ?? 'Sin categoría';
  const filteredInsumos = categoryFilter
    ? insumos.filter((i) => categoryIdOf(i) === categoryFilter)
    : insumos;
  const fallbackInsumoId = filteredInsumos[0]?._id ?? insumos[0]?._id ?? '';
  const rm = (id: string) => insumos.find((i) => i._id === id);
  const rmName = (id: string) => rm(id)?.nombre ?? id;
  const itemCost = (item: PackItem) => {
    const insumo = rm(item.rawMaterialId);
    if (!insumo) return 0;
    return calcConvertedCost({
      quantity: item.quantity,
      unit: item.unit,
      totalPrice: insumo.precioLista,
      pricedQuantity: insumo.cantidadPresentacion ?? 1,
      pricedUnit: insumo.unidad,
    });
  };
  const itemUnitCost = (item: PackItem) => item.quantity > 0 ? itemCost(item) / item.quantity : 0;
  const packPreviewCost = items.reduce((sum, item) => sum + itemCost(item), 0);
  const packageHint = (item: PackItem) => {
    const insumo = rm(item.rawMaterialId);
    if (!insumo || insumo.unidad !== 'PAQ') return '';
    const unitCost = calcConvertedCost({
      quantity: 1,
      unit: 'UND',
      totalPrice: insumo.precioLista,
      pricedQuantity: insumo.cantidadPresentacion ?? 1,
      pricedUnit: insumo.unidad,
    });
    return `Paquete de ${insumo.cantidadPresentacion ?? 1} unidades. Costo por unidad: ${formatCOPDecimal(unitCost)}.`;
  };

  const openCreate = () => {
    setEditing(null);
    setPackName('');
    setCategoryFilter(categorias[0]?._id ?? '');
    setItems([{ rawMaterialId: categorias[0] ? insumos.find((i) => categoryIdOf(i) === categorias[0]._id)?._id ?? '' : insumos[0]?._id ?? '', quantity: 1, unit: 'UND' }]);
    setModalOpen(true);
  };

  const openEdit = (p: DisposablePack) => {
    setEditing(p);
    setPackName(p.name);
    const firstInsumo = insumos.find((i) => i._id === p.items[0]?.rawMaterialId);
    setCategoryFilter(firstInsumo ? categoryIdOf(firstInsumo) : '');
    setItems(p.items.map((i) => ({ rawMaterialId: i.rawMaterialId, quantity: i.quantity, unit: i.unit })));
    setModalOpen(true);
  };

  const addItem = () => setItems((prev) => [...prev, { rawMaterialId: fallbackInsumoId, quantity: 1, unit: 'UND' }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof PackItem, value: string | number) =>
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  const updateCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    const nextInsumos = value ? insumos.filter((i) => categoryIdOf(i) === value) : insumos;
    setItems((prev) => prev.map((item) => (
      nextInsumos.some((i) => i._id === item.rawMaterialId)
        ? item
        : { ...item, rawMaterialId: nextInsumos[0]?._id ?? '' }
    )));
  };

  const handleSave = async () => {
    if (!packName.trim()) { toast.error('El nombre es requerido'); return; }
    if (items.length === 0) { toast.error('Agrega al menos un ítem'); return; }
    setSaving(true);
    try {
      const payload = { name: packName.trim(), items } as Partial<DisposablePack>;
      if (editing) {
        await disposablePacksApi.update(editing._id, payload);
        toast.success('Pack actualizado');
      } else {
        await disposablePacksApi.create(payload);
        toast.success('Pack creado');
      }
      setModalOpen(false);
      fetch();
    } catch {
      toast.error('Error al guardar pack');
    } finally {
      setSaving(false);
    }
  };

  const closeDrawer = () => setModalOpen(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Packs Desechables</h1>
          <p className="text-stone font-body text-sm">{packs.length} packs configurados</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />}>Nuevo pack</Button>
      </div>

      {loading ? <PageLoader /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((p) => (
            <div key={p._id} className="card">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-body text-base font-semibold text-espresso">{p.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Editar</Button>
              </div>
              <ul className="space-y-1 mb-3">
                {p.items.map((item, i) => (
                  <li key={i} className="text-sm text-stone">
                    <div className="flex justify-between gap-3">
                      <span>{rmName(item.rawMaterialId)}</span>
                      <span>{item.quantity} {formatMeasurementUnit(item.unit)}</span>
                    </div>
                    <div className="mt-0.5 flex justify-between gap-3 text-xs text-stone">
                      <span>{formatCOPDecimal(item.cost)} línea</span>
                      <span>{formatCOPDecimal(item.quantity > 0 ? item.cost / item.quantity : 0)} c/u usada</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-rule pt-2 flex justify-between items-center">
                <span className="text-xs text-stone font-body">Costo total</span>
                <span className="font-medium text-espresso">{formatCOPDecimal(p.totalCost)}</span>
              </div>
            </div>
          ))}
          {packs.length === 0 && (
            <div className="col-span-3 text-center py-12 text-stone font-body">
              No hay packs configurados. Crea el primero.
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-espresso bg-opacity-50"
            onClick={closeDrawer}
            aria-label="Cerrar editor de pack"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-rule px-6 py-5">
              <div>
                <p className="text-xs font-body uppercase tracking-wide text-stone">Packs desechables</p>
                <h2 className="font-body text-xl font-semibold text-espresso">
                  {editing ? 'Editar pack' : 'Nuevo pack'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-lg p-1 text-stone transition-colors hover:bg-surface-tint hover:text-espresso"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-ink font-body block mb-1">Nombre del pack</label>
                    <input
                      className="input-base"
                      value={packName}
                      onChange={(e) => setPackName(e.target.value)}
                      placeholder="Ej: Pack Café Estándar"
                    />
                  </div>

                  <Select
                    label="Categoría de insumos del pack"
                    options={[
                      { value: '', label: 'Todas las categorías' },
                      ...categorias.map((c) => ({ value: c._id, label: c.nombre })),
                    ]}
                    value={categoryFilter}
                    onChange={(e) => updateCategoryFilter(e.target.value)}
                  />

                  <div className="rounded-lg border border-rule bg-surface-tint px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-body text-stone">Costo estimado</span>
                    <span className="font-body text-lg font-semibold text-espresso">{formatCOPDecimal(packPreviewCost)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-ink font-body">Ítems del pack</label>
                    <Button variant="ghost" size="sm" onClick={addItem}>+ Agregar ítem</Button>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-rule bg-white p-4">
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_6rem_7rem_2rem] sm:items-center">
                          <select
                            className="input-base text-sm"
                            value={item.rawMaterialId}
                            onChange={(e) => updateItem(idx, 'rawMaterialId', e.target.value)}
                          >
                            {filteredInsumos.map((i) => (
                              <option key={i._id} value={i._id}>{i.nombre}</option>
                            ))}
                          </select>
                          <input
                            className="input-base text-sm"
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                          <select
                            className="input-base text-sm"
                            value={item.unit}
                            onChange={(e) => updateItem(idx, 'unit', e.target.value as RecipeIngredientUnit)}
                          >
                            {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-error-ink hover:bg-error-tint"
                            aria-label="Eliminar insumo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs font-body text-stone sm:grid-cols-3">
                          <span>Categoría: {rm(item.rawMaterialId) ? categoryName(categoryIdOf(rm(item.rawMaterialId)!)) : '-'}</span>
                          <span>{formatCOPDecimal(itemUnitCost(item))} c/u usada</span>
                          <span className="font-medium text-espresso sm:text-right">{formatCOPDecimal(itemCost(item))} línea</span>
                        </div>
                        {packageHint(item) && (
                          <p className="mt-2 text-xs font-body text-stone">{packageHint(item)}</p>
                        )}
                      </div>
                    ))}
                    {filteredInsumos.length === 0 && (
                      <p className="rounded-lg border border-dashed border-rule p-4 text-center text-sm font-body text-stone">
                        No hay insumos activos en esta categoría.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-rule bg-white px-6 py-4">
              <div>
                <p className="text-xs font-body text-stone">Costo estimado del pack</p>
                <p className="font-body text-lg font-semibold text-espresso">{formatCOPDecimal(packPreviewCost)}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={closeDrawer}>Cancelar</Button>
                <Button onClick={handleSave} loading={saving}>{editing ? 'Actualizar' : 'Crear'}</Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
