import { ShoppingCart } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { tablesApi } from '../../api/tables';
import { recipesApi } from '../../api/costs';
import { CafeTable, Order, OrderItem, Recipe, RecipeCategoryOption, RecipeVariant } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { todayLocal } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { TableSelector, TableSummary } from '../../components/orders/TableStep';
import { RecipeStep } from '../../components/orders/RecipeStep';
import { CartPanel, itemKey } from '../../components/orders/CartPanel';

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

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<RecipeCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [wizardStep, setWizardStep] = useState<'table' | 'recipe'>('table');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [selectedCategory, setSelectedCategory] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
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
  const activeCategories = useMemo(
    () => categories.filter((category) => recipes.some((recipe) => recipe.category === category.value)),
    [categories, recipes]
  );

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

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setWizardStep('recipe');
  };

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
    setWizardStep('table');
    setRecipeSearch('');
  };

  const startEditOrder = (order: Order) => {
    setEditingOrderId(order._id);
    setSelectedTableId(tableIdOf(order.tableId));
    setCart(order.items.map((item) => ({ ...item })));
    setWizardStep('recipe');
    setRecipeSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reached via "Editar" on Pedidos activos (?edit=<orderId>) — once that
  // order shows up in the day's fetched list, drop straight into editing it.
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || editingOrderId) return;
    const order = orders.find((o) => o._id === editId);
    if (order) {
      startEditOrder(order);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('edit');
        return next;
      }, { replace: true });
    }
  }, [searchParams, orders, editingOrderId]);

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
          <h1 className="font-body text-2xl font-bold text-island-dark">Pedidos</h1>
          <p className="text-island-dark/70 font-body text-sm">
            {editingOrderId
              ? `Editando pedido de ${editingOrder ? tableName(editingOrder.tableId) : 'mesa'}`
              : 'Elige la mesa y luego busca o filtra las recetas para agregar.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="card px-4 py-3 sm:w-56">
            <label className="text-xs text-island-dark/70 font-body">Fecha del pedido</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value || todayLocal())}
              className="mt-1 w-full bg-transparent font-body font-semibold text-island-dark outline-none"
            />
          </div>
          <div className="card px-4 py-3 flex items-center gap-3">
            <ShoppingCart size={18} className="text-island-blue" />
            <div>
              <p className="text-xs text-island-dark/70 font-body">Pedido actual</p>
              <p className="font-body font-semibold text-island-dark">{cart.length} producto(s) · {formatCOP(cartTotal)}</p>
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

      {wizardStep === 'table' ? (
        <section className="space-y-3">
          <h2 className="font-body text-lg font-semibold text-island-dark">1. Mesa</h2>
          <TableSelector
            tableOptions={tableOptions}
            selectedTableId={selectedTableId}
            editingOrder={editingOrder}
            walkInId={WALK_IN_ID}
            tableIdOf={tableIdOf}
            onSelect={handleSelectTable}
          />
        </section>
      ) : (
        <section className="grid xl:grid-cols-[minmax(0,1fr)_22rem] gap-4 items-start">
          <div className="space-y-4">
            <TableSummary table={selectedTable} onChange={() => setWizardStep('table')} />
            <RecipeStep
              recipes={recipes}
              activeCategories={activeCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              search={recipeSearch}
              onSearchChange={setRecipeSearch}
              categoryLabel={categoryLabel}
              onAddVariant={addRecipeVariant}
            />
          </div>
          <CartPanel
            cart={cart}
            cartTotal={cartTotal}
            cartTax={cartTax}
            cartNet={cartNet}
            hasTable={!!selectedTable}
            editingOrderId={editingOrderId}
            onClear={() => setCart([])}
            onChangeQty={changeQty}
            onRemoveItem={removeItem}
            onConfirm={() => setConfirmOpen(true)}
            disabled={!selectedTableId || cart.length === 0}
          />
        </section>
      )}

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title={editingOrderId ? 'Actualizar pedido' : 'Confirmar pedido'} size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3 text-sm font-body">
            <div className="rounded-lg bg-gray-100 p-3">
              <p className="text-island-dark/70">Mesa</p>
              <p className="font-semibold text-island-dark">{selectedTable?.name ?? 'Sin mesa'}</p>
            </div>
            <div className="rounded-lg bg-gray-100 p-3">
              <p className="text-island-dark/70">Total</p>
              <p className="font-semibold text-island-dark">{formatCOP(cartTotal)}</p>
            </div>
          </div>
          <div className="border border-island-blue/20 rounded-lg overflow-hidden">
            {cart.map((item) => (
              <div key={itemKey(item)} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-island-blue/20 last:border-0 text-sm font-body">
                <span>{item.productName} x {item.quantity}</span>
                <span className="font-medium text-island-dark">{formatCOP(item.quantity * item.unitPrice)}</span>
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
