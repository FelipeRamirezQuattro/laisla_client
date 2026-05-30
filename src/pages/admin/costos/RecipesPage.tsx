import { Plus } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { recipesApi } from '../../../api/costs';
import { Recipe, RecipeCategoryOption } from '../../../types';
import { formatCOPDecimal } from '../../../utils/formatCurrency';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';

export function RecipesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<RecipeCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const toast = useToast();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (catFilter) params.category = catFilter;
      const [recipesRes, categoriesRes] = await Promise.all([
        recipesApi.getAll(params),
        recipesApi.getCategories(),
      ]);
      setRecipes(recipesRes.data);
      setCategories(categoriesRes.data);
    } catch {
      toast.error('Error al cargar recetas');
    } finally {
      setLoading(false);
    }
  }, [catFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const catLabel = (category: string) => categories.find((x) => x.value === category)?.label ?? category;

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = categoryName.trim();
    if (!label) return;
    setCategorySaving(true);
    try {
      const res = await recipesApi.createCategory({ label });
      setCategories((prev) => [...prev, res.data].sort((a, b) => a.orden - b.orden));
      setCatFilter(res.data.value);
      setCategoryName('');
      setCategoryModalOpen(false);
      toast.success('Categoría creada');
      fetch();
    } catch {
      toast.error('Error al crear categoría');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la receta "${name}"?`)) return;
    try {
      await recipesApi.delete(id);
      toast.success('Receta eliminada');
      fetch();
    } catch {
      toast.error('Error al eliminar receta');
    }
  };

  const toggleProduct = async (recipe: Recipe) => {
    try {
      const next = !recipe.isProduct;
      const res = await recipesApi.update(recipe._id, { isProduct: next });
      setRecipes((prev) => prev.map((item) => item._id === recipe._id ? res.data : item));
      toast.success(next ? 'Receta disponible para pedidos' : 'Receta ocultada de pedidos');
    } catch {
      toast.error('Error al actualizar disponibilidad');
    }
  };

  const filtered = recipes.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeVariantCost = (variant: Recipe['variants'][number]) =>
    variant.costingMethod === 'full-cost' ? variant.totalCost : variant.directMaterialCost;

  const avgCost = (r: Recipe) => {
    if (!r.variants.length) return 0;
    return r.variants.reduce((s, v) => s + activeVariantCost(v), 0) / r.variants.length;
  };

  const salePriceValue = (variant: Recipe['variants'][number]) => variant.finalPrice ?? variant.salePrice;

  const salePriceLabel = (r: Recipe) => {
    const prices = r.variants
      .map(salePriceValue)
      .filter((price) => price > 0);
    if (!prices.length) return 'Sin precio';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? formatCOPDecimal(min)
      : `${formatCOPDecimal(min)} - ${formatCOPDecimal(max)}`;
  };

  const avgProfit = (r: Recipe) => {
    const pricedVariants = r.variants.filter((v) => v.salePriceWithoutTax > 0);
    if (!pricedVariants.length) return null;
    return pricedVariants.reduce((s, v) => s + (v.salePriceWithoutTax - activeVariantCost(v)), 0) / pricedVariants.length;
  };

  const avgMargin = (r: Recipe) => {
    const pricedVariants = r.variants.filter((v) => v.salePriceWithoutTax > 0);
    if (!pricedVariants.length) return null;
    return pricedVariants.reduce((s, v) => {
      const profit = v.salePriceWithoutTax - activeVariantCost(v);
      return s + profit / v.salePriceWithoutTax;
    }, 0) / pricedVariants.length;
  };

  const costingMethodLabel = (r: Recipe) => {
    const methods = new Set(r.variants.map((v) => v.costingMethod === 'full-cost' ? 'MOD + GIF' : 'Food cost'));
    return methods.size === 1 ? Array.from(methods)[0] : 'Mixto';
  };

  const formatPercent = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Recetas</h1>
          <p className="text-stone font-body text-sm">{filtered.length} recetas</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {isAdmin && (
            <Button variant="secondary" onClick={() => setCategoryModalOpen(true)} icon={<Plus size={15} />}>
              Nueva categoría
            </Button>
          )}
          <Link to="/admin/inventario/recetas/nueva">
            <Button icon={<Plus size={15} />}>Nueva receta</Button>
          </Link>
        </div>
      </div>

      <div className="card flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select
          options={[{ value: '', label: 'Todas las categorías' }, ...categories.map((c) => ({ value: c.value, label: c.label }))]}
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="sm:w-56"
        />
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead className="bg-surface-tint border-b border-rule">
              <tr>
                <th className="text-left px-4 py-3 text-stone font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Categoría</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Variantes</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Precio venta</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Costo prom.</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Utilidad prom.</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Margen prom.</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Costeo</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Producto</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filtered.map((r) => {
                const profit = avgProfit(r);
                const margin = avgMargin(r);
                return (
                  <tr key={r._id} className="hover:bg-surface-tint transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{r.name}</p>
                      {r.isSubRecipe && <span className="text-xs text-terracotta font-body">Sub-receta</span>}
                    </td>
                    <td className="px-4 py-3 text-stone">{catLabel(r.category)}</td>
                    <td className="px-4 py-3 text-center text-stone">
                      {r.variants.map((v) => v.size).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ink whitespace-nowrap">
                      {salePriceLabel(r)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-espresso whitespace-nowrap">
                      {formatCOPDecimal(avgCost(r))}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${profit !== null && profit < 0 ? 'text-error-ink' : 'text-ink'}`}>
                      {profit === null ? 'Pendiente' : formatCOPDecimal(profit)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone whitespace-nowrap">
                      {margin === null ? 'Pendiente' : formatPercent(margin)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge label={costingMethodLabel(r)} variant="gray" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge label={r.isProduct ? 'En pedidos' : 'Borrador'} variant={r.isProduct ? 'blue' : 'gray'} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge label={r.active ? 'Activa' : 'Inactiva'} variant={r.active ? 'green' : 'gray'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/inventario/recetas/${r._id}`}>
                          <Button variant="ghost" size="sm">Editar</Button>
                        </Link>
                        <Link to={`/admin/inventario/recetas/${r._id}/ficha`}>
                          <Button variant="ghost" size="sm">Ficha</Button>
                        </Link>
                        {!r.isSubRecipe && (
                          <Button variant="secondary" size="sm" onClick={() => toggleProduct(r)}>
                            {r.isProduct ? 'Ocultar' : 'Publicar'}
                          </Button>
                        )}
                        <Button variant="danger" size="sm" onClick={() => handleDelete(r._id, r.name)}>Eliminar</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-stone">No se encontraron recetas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="Nueva categoría de productos">
        <form onSubmit={createCategory} className="space-y-4">
          <Input
            label="Nombre"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Ej: Postres, Sanduches, Bebidas frías"
            autoFocus
          />
          <p className="text-xs font-body text-stone">
            Estas categorías son para productos/recetas. No modifican las categorías de insumos del inventario.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCategoryModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={categorySaving} disabled={!categoryName.trim()}>Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
