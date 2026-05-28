import { Check, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ordersApi } from '../../api/orders';
import { tablesApi } from '../../api/tables';
import { recipesApi } from '../../api/costs';
import { CafeTable, Order, OrderItem, Recipe, RecipeCategoryOption, RecipeVariant } from '../../types';
import { formatCOP, formatCOPDecimal } from '../../utils/formatCurrency';
import { formatShortDate, todayLocal } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { OrderStatusBadge, TableStatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';

const tableBorder: Record<CafeTable['status'], string> = {
  available: 'border-l-success',
  occupied: 'border-l-error',
  reserved: 'border-l-warning',
};

const WALK_IN_ID = 'walk-in';
const walkInTable: CafeTable = {
  _id: WALK_IN_ID,
  name: 'Sin mesa / Mostrador',
  capacity: 1,
  zone: 'walk-in',
  status: 'available',
  createdAt: '',
};

function finalVariantPrice(variant: RecipeVariant) {
  return variant.finalPrice ?? variant.salePrice;
}

function itemTaxAmount(unitPrice: number, taxRate = 0) {
  if (taxRate <= 0) return 0;
  return unitPrice - unitPrice / (1 + taxRate);
}

function itemKey(item: OrderItem) {
  return `${item.productId}:${item.variantSize ?? ''}`;
}

function isOpenOrder(order: Order) {
  return !['delivered', 'billed', 'cancelled'].includes(order.status);
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<RecipeCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [editingOrderId, setEditingOrderId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, tablesRes, recipesRes, categoriesRes] = await Promise.all([
        ordersApi.getAll({ page: 1, limit: 50, dateFrom: selectedDate, dateTo: selectedDate }),
        tablesApi.getAll({ date: selectedDate }),
        recipesApi.getAll({ active: 'true', isSubRecipe: 'false', isProduct: 'true' }),
        recipesApi.getCategories(),
      ]);
      setOrders(ordersRes.data.orders);
      setTables(tablesRes.data);
      setRecipes(recipesRes.data);
      setCategories(categoriesRes.data);
      setSelectedCategory((current) =>
        current || categoriesRes.data.find((category) =>
          recipesRes.data.some((recipe) => recipe.category === category.value)
        )?.value || ''
      );
    } catch {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tableOptions = [walkInTable, ...tables];
  const selectedTable = tableOptions.find((table) => table._id === selectedTableId);
  const editingOrder = orders.find((order) => order._id === editingOrderId);
  const openOrders = orders.filter(isOpenOrder);
  const activeCategories = useMemo(
    () => categories.filter((category) => recipes.some((recipe) => recipe.category === category.value)),
    [categories, recipes]
  );
  const visibleRecipes = recipes.filter((recipe) => recipe.category === selectedCategory);

  const categoryLabel = (value: string) =>
    categories.find((category) => category.value === value)?.label ?? value.replace(/_/g, ' ');

  const tableIdOf = (table?: string | CafeTable | null) => typeof table === 'object' && table ? table._id : table || WALK_IN_ID;
  const tableName = (table?: string | CafeTable | null) =>
    !table
      ? 'Sin mesa / Mostrador'
      : typeof table === 'object'
        ? table.name
        : table === WALK_IN_ID
          ? 'Sin mesa / Mostrador'
          : tables.find((item) => item._id === table)?.name || table;

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const cartTax = cart.reduce((sum, item) => sum + item.quantity * (item.taxAmount ?? 0), 0);
  const cartNet = cartTotal - cartTax;

  const addRecipeVariant = (recipe: Recipe, variant: RecipeVariant) => {
    const unitPrice = finalVariantPrice(variant);
    if (unitPrice <= 0) {
      toast.error('Esta receta no tiene precio de venta');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === recipe._id && item.variantSize === variant.size);
      if (existing) {
        return prev.map((item) =>
          item.productId === recipe._id && item.variantSize === variant.size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: recipe._id,
          productName: `${recipe.name} ${variant.size}`,
          quantity: 1,
          unitPrice,
          productType: 'recipe',
          variantSize: variant.size,
          taxType: variant.taxType ?? 'NONE',
          taxRate: variant.taxRate ?? 0,
          taxAmount: itemTaxAmount(unitPrice, variant.taxRate ?? 0),
        },
      ];
    });
  };

  const changeQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => itemKey(item) === key ? { ...item, quantity: item.quantity + delta } : item)
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (key: string) => {
    setCart((prev) => prev.filter((item) => itemKey(item) !== key));
  };

  const resetOrderForm = () => {
    setSelectedTableId('');
    setCart([]);
    setEditingOrderId('');
    setConfirmOpen(false);
  };

  const startEditOrder = (order: Order) => {
    setEditingOrderId(order._id);
    setSelectedTableId(tableIdOf(order.tableId));
    setCart(order.items.map((item) => ({ ...item })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveOrder = async () => {
    if (!selectedTableId || cart.length === 0) {
      toast.error('Selecciona una mesa y al menos una receta');
      return;
    }
    setCreating(true);
    try {
      if (editingOrderId) {
        await ordersApi.update(editingOrderId, {
          tableId: selectedTableId === WALK_IN_ID ? null : selectedTableId,
          orderType: selectedTableId === WALK_IN_ID ? 'walk-in' : 'table',
          serviceDate: selectedDate,
          items: cart,
        });
        toast.success('Pedido actualizado');
      } else {
        await ordersApi.create({
          tableId: selectedTableId === WALK_IN_ID ? null : selectedTableId,
          orderType: selectedTableId === WALK_IN_ID ? 'walk-in' : 'table',
          serviceDate: selectedDate,
          items: cart,
        });
        toast.success('Pedido creado');
      }
      resetOrderForm();
      fetchData();
    } catch {
      toast.error(editingOrderId ? 'Error al actualizar pedido' : 'Error al crear pedido');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Pedidos</h1>
          <p className="text-stone font-body text-sm">
            {editingOrderId ? `Editando pedido de ${editingOrder ? tableName(editingOrder.tableId) : 'mesa'}` : 'Selección rápida por mesa, categoría y receta.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="card px-4 py-3 sm:w-56">
            <label className="text-xs text-stone font-body">Fecha del pedido</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value || todayLocal())}
              className="mt-1 w-full bg-transparent font-body font-semibold text-espresso outline-none"
            />
          </div>
        <div className="card px-4 py-3 flex items-center gap-3">
          <ShoppingCart size={18} className="text-terracotta" />
          <div>
            <p className="text-xs text-stone font-body">Pedido actual</p>
            <p className="font-body font-semibold text-espresso">{cart.length} producto(s) · {formatCOP(cartTotal)}</p>
          </div>
          <Button
            size="sm"
            disabled={!selectedTableId || cart.length === 0}
            onClick={() => setConfirmOpen(true)}
          >
            {editingOrderId ? 'Actualizar' : 'Confirmar'}
          </Button>
          {editingOrderId && (
            <Button variant="secondary" size="sm" onClick={resetOrderForm}>Cancelar edición</Button>
          )}
        </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-body text-lg font-semibold text-espresso">1. Mesa</h2>
          {selectedTable && (
            <span className="text-sm font-body text-stone">Seleccionada: <strong className="text-espresso">{selectedTable.name}</strong></span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {tableOptions.map((table) => {
            const isEditingCurrentTable = editingOrderId && editingOrder && table._id === tableIdOf(editingOrder.tableId);
            const disabled = table._id !== WALK_IN_ID && (table.status === 'occupied' || !!table.currentOrderId) && !isEditingCurrentTable;
            const selected = selectedTableId === table._id;
            return (
              <button
                key={table._id}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedTableId(table._id)}
                className={`bg-white border border-rule border-l-4 ${tableBorder[table.status]} rounded-xl p-4 text-left transition-all disabled:opacity-55 disabled:cursor-not-allowed ${
                  selected ? 'ring-2 ring-terracotta shadow-sm' : 'hover:border-rule-strong hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-body font-semibold text-espresso">{table.name}</span>
                  {selected && <Check size={16} className="text-terracotta" />}
                </div>
                <p className="text-xs text-stone font-body mt-1">{table._id === WALK_IN_ID ? 'Cliente sin mesa' : `${table.capacity} personas`}</p>
                <div className="mt-3"><TableStatusBadge status={table.status} /></div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid xl:grid-cols-[15rem_minmax(0,1fr)_22rem] gap-4 items-start">
        <div className="card p-3">
          <h2 className="font-body text-lg font-semibold text-espresso px-1 mb-3">2. Categoría</h2>
          <div className="space-y-2">
            {activeCategories.map((category) => {
              const count = recipes.filter((recipe) => recipe.category === category.value).length;
              const selected = selectedCategory === category.value;
              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setSelectedCategory(category.value)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition-all ${
                    selected
                      ? 'border-terracotta bg-surface-tint text-espresso'
                      : 'border-rule bg-white text-stone hover:border-rule-strong'
                  }`}
                >
                  <span className="block font-body font-semibold">{category.label}</span>
                  <span className="text-xs font-body opacity-75">{count} receta(s)</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-body text-lg font-semibold text-espresso">3. Recetas</h2>
              <p className="text-xs text-stone font-body">{categoryLabel(selectedCategory)}</p>
            </div>
            <span className="text-xs text-stone font-body">Click para agregar</span>
          </div>

          <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-3">
            {visibleRecipes.map((recipe) => (
              <div key={recipe._id} className="border border-rule rounded-xl bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-body font-semibold text-ink">{recipe.name}</h3>
                    <p className="text-xs text-stone font-body">{recipe.variants.length} variante(s)</p>
                  </div>
                  <span className="text-xs rounded-full bg-surface-tint px-2 py-1 text-espresso font-body">
                    {categoryLabel(recipe.category)}
                  </span>
                </div>
                <div className="mt-4 grid gap-2">
                  {recipe.variants.map((variant) => (
                    <button
                      key={variant.size}
                      type="button"
                      onClick={() => addRecipeVariant(recipe, variant)}
                      className="flex items-center justify-between rounded-lg border border-rule bg-paper px-3 py-2 text-left hover:border-terracotta hover:bg-surface-tint transition-colors"
                    >
                      <span className="font-body font-medium text-espresso">{variant.size}</span>
                      <span className="font-body text-sm text-ink">{formatCOP(finalVariantPrice(variant))}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {visibleRecipes.length === 0 && (
              <div className="border border-dashed border-rule rounded-xl p-6 text-center text-stone font-body sm:col-span-2">
                No hay recetas activas en esta categoría.
              </div>
            )}
          </div>
        </div>

        <aside className="card p-4 sticky top-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-body text-lg font-semibold text-espresso">Pedido</h2>
            {cart.length > 0 && (
              <button type="button" className="text-xs text-error-ink font-body" onClick={() => setCart([])}>
                Limpiar
              </button>
            )}
          </div>
          <div className="space-y-2">
            {!selectedTable && <p className="text-sm text-stone font-body">Selecciona una mesa para empezar.</p>}
            {cart.map((item) => {
              const key = itemKey(item);
              return (
              <div key={key} className="rounded-lg bg-surface-tint px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-body font-medium text-ink">{item.productName}</p>
                    <p className="text-xs text-stone font-body">{formatCOP(item.unitPrice)} c/u</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(key)}
                    className="text-error-ink hover:text-error"
                    aria-label="Eliminar producto"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => changeQty(key, -1)} className="h-7 w-7 rounded-md bg-white text-stone inline-flex items-center justify-center">
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-sm font-body text-espresso">{item.quantity}</span>
                    <button type="button" onClick={() => changeQty(key, 1)} className="h-7 w-7 rounded-md bg-white text-stone inline-flex items-center justify-center">
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-body font-semibold text-espresso">{formatCOP(item.quantity * item.unitPrice)}</span>
                </div>
              </div>
              );
            })}
          </div>
          <div className="border-t border-rule mt-4 pt-3 space-y-1 text-sm font-body">
            <div className="flex justify-between text-stone"><span>Base aprox.</span><span>{formatCOPDecimal(cartNet)}</span></div>
            <div className="flex justify-between text-stone"><span>Impuesto incluido</span><span>{formatCOPDecimal(cartTax)}</span></div>
            <div className="flex justify-between font-semibold text-espresso text-base"><span>Total</span><span>{formatCOP(cartTotal)}</span></div>
          </div>
          <Button className="w-full mt-4" disabled={!selectedTableId || cart.length === 0} onClick={() => setConfirmOpen(true)}>
            {editingOrderId ? 'Actualizar pedido' : 'Confirmar pedido'}
          </Button>
        </aside>
      </section>

      <section className="card p-0 overflow-hidden">
        <div className="px-4 py-3 bg-surface-tint border-b border-rule flex items-center justify-between">
          <div>
            <h2 className="font-body text-lg font-semibold text-espresso">Pedidos abiertos</h2>
            <p className="text-xs text-stone font-body">Edita pedidos vigentes si el cliente agrega productos o cambia de mesa.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="border-b border-rule">
              <tr>
                <th className="text-left px-4 py-3 text-stone font-medium">Mesa</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Items</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Total</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Fecha</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {openOrders.map((order) => (
                <tr key={order._id} className="hover:bg-surface-tint transition-colors">
                  <td className="px-4 py-3 font-medium text-espresso">{tableName(order.tableId)}</td>
                  <td className="px-4 py-3 text-stone">{order.items.length} ítem(s)</td>
                  <td className="px-4 py-3 text-right font-medium text-ink">{formatCOP(order.total)}</td>
                  <td className="px-4 py-3 text-center"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-stone">{formatShortDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="secondary" size="sm" onClick={() => startEditOrder(order)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
              {openOrders.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-stone">No hay pedidos abiertos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title={editingOrderId ? 'Actualizar pedido' : 'Confirmar pedido'} size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3 text-sm font-body">
            <div className="rounded-lg bg-surface-tint p-3">
              <p className="text-stone">Mesa</p>
              <p className="font-semibold text-espresso">{selectedTable?.name ?? 'Sin mesa'}</p>
            </div>
            <div className="rounded-lg bg-surface-tint p-3">
              <p className="text-stone">Total</p>
              <p className="font-semibold text-espresso">{formatCOP(cartTotal)}</p>
            </div>
          </div>
          <div className="border border-rule rounded-lg overflow-hidden">
            {cart.map((item) => (
              <div key={itemKey(item)} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-rule last:border-0 text-sm font-body">
                <span>{item.productName} x {item.quantity}</span>
                <span className="font-medium text-ink">{formatCOP(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Seguir editando</Button>
            <Button loading={creating} onClick={handleSaveOrder}>{editingOrderId ? 'Guardar cambios' : 'Crear pedido'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
