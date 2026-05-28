import { ExternalLink, ImageOff, Pencil } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { recipesApi } from "../../api/costs";
import {
  Recipe,
  RecipeCategory,
  RecipeCategoryOption,
  RecipeVariant,
} from "../../types";
import { formatCOP } from "../../utils/formatCurrency";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/Spinner";

type MenuForm = {
  description: string;
  imageUrl: string;
  category: RecipeCategory;
  isProduct: boolean;
  active: boolean;
  prices: Record<string, number>;
};

function variantKey(variant: RecipeVariant, index: number) {
  return `${variant.size}-${index}`;
}

function variantPrice(variant: RecipeVariant) {
  return variant.finalPrice ?? variant.salePrice;
}

function priceLabel(recipe: Recipe) {
  const prices = recipe.variants.map(variantPrice).filter((price) => price > 0);
  if (!prices.length) return "Sin precio";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatCOP(min) : `${formatCOP(min)} - ${formatCOP(max)}`;
}

export function ProductsPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<RecipeCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [form, setForm] = useState<MenuForm | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [recipesRes, categoriesRes] = await Promise.all([
        recipesApi.getAll({ isSubRecipe: "false", active: "true" }),
        recipesApi.getCategories(),
      ]);
      setRecipes(recipesRes.data);
      setCategories(categoriesRes.data);
    } catch {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categoryLabel = (value: string) =>
    categories.find((category) => category.value === value)?.label ??
    value.replace(/_/g, " ");

  const filtered = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch =
        !search || recipe.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !categoryFilter || recipe.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [recipes, search, categoryFilter]);

  const openEdit = (recipe: Recipe) => {
    setEditing(recipe);
    setForm({
      description: recipe.description ?? "",
      imageUrl: recipe.imageUrl ?? "",
      category: recipe.category,
      isProduct: !!recipe.isProduct,
      active: recipe.active,
      prices: recipe.variants.reduce<Record<string, number>>(
        (acc, variant, index) => {
          acc[variantKey(variant, index)] = variant.salePrice;
          return acc;
        },
        {},
      ),
    });
  };

  const updatePrice = (key: string, value: number) => {
    setForm((current) =>
      current
        ? { ...current, prices: { ...current.prices, [key]: value } }
        : current,
    );
  };

  const handleSave = async () => {
    if (!editing || !form) return;
    setSaving(true);
    try {
      const variants = editing.variants.map((variant, index) => ({
        ...variant,
        salePrice: form.prices[variantKey(variant, index)] ?? variant.salePrice,
      }));
      const res = await recipesApi.update(editing._id, {
        description: form.description,
        imageUrl: form.imageUrl,
        category: form.category,
        isProduct: form.isProduct,
        active: form.active,
        variants,
      });
      setRecipes((prev) =>
        prev.map((item) => (item._id === editing._id ? res.data : item)),
      );
      toast.success("Producto actualizado");
      setEditing(null);
      setForm(null);
    } catch {
      toast.error("Error al actualizar producto");
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = async (recipe: Recipe) => {
    try {
      const res = await recipesApi.update(recipe._id, {
        isProduct: !recipe.isProduct,
      });
      setRecipes((prev) =>
        prev.map((item) => (item._id === recipe._id ? res.data : item)),
      );
      toast.success(
        !recipe.isProduct
          ? "Producto visible en pedidos"
          : "Producto oculto de pedidos",
      );
    } catch {
      toast.error("Error al cambiar estado del producto");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">
            Productos
          </h1>
        </div>
        <Link to="/admin/inventario/recetas/nueva">
          <Button>Nueva receta</Button>
        </Link>
      </div>

      <div className="card grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          options={[
            { value: "", label: "Todas las categorías" },
            ...categories.map((category) => ({
              value: category.value,
              label: category.label,
            })),
          ]}
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((recipe) => (
            <article
              key={recipe._id}
              className="bg-white border border-rule rounded-xl overflow-hidden shadow-sm"
            >
              <div className="aspect-[16/9] bg-surface-tint border-b border-rule overflow-hidden">
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-stone gap-2">
                    <ImageOff size={26} />
                    <span className="text-xs font-body">Sin imagen</span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-body text-xl font-semibold text-espresso">
                      {recipe.name}
                    </h2>
                    <p className="text-sm text-stone font-body">
                      {categoryLabel(recipe.category)}
                    </p>
                  </div>
                  <Badge
                    label={recipe.isProduct ? "En menú" : "Borrador"}
                    variant={recipe.isProduct ? "green" : "gray"}
                  />
                </div>

                <p className="text-sm text-stone font-body min-h-[2.75rem]">
                  {recipe.description || "Sin descripción pública."}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm font-body">
                  <div className="rounded-lg bg-surface-tint px-3 py-2">
                    <span className="block text-xs text-stone">Precio</span>
                    <strong className="text-espresso">
                      {priceLabel(recipe)}
                    </strong>
                  </div>
                  <div className="rounded-lg bg-surface-tint px-3 py-2">
                    <span className="block text-xs text-stone">
                      Variantes
                    </span>
                    <strong className="text-espresso">
                      {recipe.variants.length}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleProduct(recipe)}
                  >
                    {recipe.isProduct ? "Ocultar del menú" : "Publicar"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Pencil size={14} />}
                    onClick={() => openEdit(recipe)}
                  >
                    Editar menú
                  </Button>
                  <Link to={`/admin/inventario/recetas/${recipe._id}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<ExternalLink size={14} />}
                    >
                      Receta
                    </Button>
                  </Link>
                </div>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="card lg:col-span-2 xl:col-span-3 text-center text-stone">
              No se encontraron recetas/productos.
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={!!editing && !!form}
        onClose={() => {
          setEditing(null);
          setForm(null);
        }}
        title={editing ? `Editar menú: ${editing.name}` : "Editar menú"}
        size="lg"
      >
        {editing && form && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink font-body block mb-1">
                Descripción pública
              </label>
              <textarea
                className="input-base h-24 resize-none"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Descripción corta para carta, pedidos y experiencia pública."
              />
            </div>

            <Input
              label="URL de imagen"
              value={form.imageUrl}
              onChange={(event) =>
                setForm({ ...form, imageUrl: event.target.value })
              }
              placeholder="https://..."
            />

            <Select
              label="Categoría"
              options={categories.map((category) => ({
                value: category.value,
                label: category.label,
              }))}
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value as RecipeCategory,
                })
              }
            />

            <div className="rounded-xl bg-surface-tint p-4 space-y-3">
              <p className="text-sm font-medium text-ink font-body">
                Precios por variante
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {editing.variants.map((variant, index) => {
                  const key = variantKey(variant, index);
                  return (
                    <Input
                      key={key}
                      label={`Precio ${variant.size}`}
                      type="number"
                      value={form.prices[key] ?? 0}
                      onChange={(event) =>
                        updatePrice(key, Number(event.target.value))
                      }
                    />
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 rounded-xl border border-rule p-4">
              <label className="flex items-center gap-2 text-sm font-body text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isProduct}
                  onChange={(event) =>
                    setForm({ ...form, isProduct: event.target.checked })
                  }
                  className="rounded"
                />
                Visible en menú y pedidos
              </label>
              <label className="flex items-center gap-2 text-sm font-body text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm({ ...form, active: event.target.checked })
                  }
                  className="rounded"
                />
                Receta activa
              </label>
            </div>

            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Link to={`/admin/inventario/recetas/${editing._id}`}>
                <Button variant="secondary" icon={<ExternalLink size={15} />}>
                  Editar receta completa
                </Button>
              </Link>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="button" loading={saving} onClick={handleSave}>
                  Guardar producto
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
