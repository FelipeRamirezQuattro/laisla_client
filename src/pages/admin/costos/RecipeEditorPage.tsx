import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, ExternalLink, Info, Trash2, X } from 'lucide-react';
import { recipesApi, disposablePacksApi, laborOverheadApi } from '../../../api/costs';
import { insumosInvApi } from '../../../api/inventario';
import {
  Recipe, RecipeCategory, RecipeVariant, RecipeIngredient,
  VariantSize, RecipeIngredientUnit, Insumo, DisposablePack,
  LaborAndOverheadParams, RecipeCategoryOption, MeasurementUnit, InsumoCategoria,
} from '../../../types';
import { formatCOPDecimal, formatPct } from '../../../utils/formatCurrency';
import { calcVariantCosts } from '../../../utils/costFormulas';
import { calcConvertedCost, MEASUREMENT_UNITS } from '../../../utils/measurementUnits';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';

const SIZES: VariantSize[] = ['6OZ', '8OZ', '12OZ', '16OZ', '20OZ', 'UND'];
const UNIT_OPTIONS = MEASUREMENT_UNITS.map((u) => ({ value: u.value, label: u.label }));

interface EditIngredient {
  ingredientRefId: string;
  ingredientType: 'raw' | 'recipe';
  quantity: number;
  unit: RecipeIngredientUnit;
  includePreparationTime: boolean;
}

interface EditVariant {
  size: VariantSize;
  ingredients: EditIngredient[];
  disposablePackId: string;
  salePrice: number;
  taxType: 'NONE' | 'IVA_19' | 'CONSUMO_8';
  taxRate: number;
  taxIncluded: boolean;
  costingMethod: 'food-cost' | 'full-cost';
  targetMargin: number;
  targetFoodCostPct: number;
}

type IngredientDrawerTarget =
  | { type: 'raw'; id: string }
  | { type: 'recipe'; id: string };

interface RawDrawerForm {
  nombre: string;
  unidad: MeasurementUnit;
  cantidadPresentacion: number;
  precioLista: number | '';
  nivelBueno: string;
  nivelRegular: string;
  nivelAgotado: string;
}

interface RecipeDrawerForm {
  name: string;
  category: RecipeCategory;
  isSubRecipe: boolean;
  isProduct: boolean;
  preparationTimeMinutes: number;
  active: boolean;
  variants: EditVariant[];
}

const emptyVariant = (): EditVariant => ({
  size: 'UND',
  ingredients: [],
  disposablePackId: '',
  salePrice: 0,
  taxType: 'IVA_19',
  taxRate: 0.19,
  taxIncluded: true,
  costingMethod: 'food-cost',
  targetMargin: 0.4,
  targetFoodCostPct: 0.3,
});

const TAX_OPTIONS: Array<{ value: EditVariant['taxType']; label: string; rate: number }> = [
  { value: 'NONE', label: 'Sin impuesto', rate: 0 },
  { value: 'CONSUMO_8', label: 'Impoconsumo 8%', rate: 0.08 },
  { value: 'IVA_19', label: 'IVA 19%', rate: 0.19 },
];

export function RecipeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = id === 'nueva';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<IngredientDrawerTarget | null>(null);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [rawForm, setRawForm] = useState<RawDrawerForm | null>(null);
  const [recipeForm, setRecipeForm] = useState<RecipeDrawerForm | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('CAFE_CALIENTE');
  const [isSubRecipe, setIsSubRecipe] = useState(false);
  const [isProduct, setIsProduct] = useState(false);
  const [preparationTimeMinutes, setPreparationTimeMinutes] = useState(0);
  const [active, setActive] = useState(true);
  const [variants, setVariants] = useState<EditVariant[]>([emptyVariant()]);
  const [activeTab, setActiveTab] = useState(0);

  // Reference data
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [insumoCategories, setInsumoCategories] = useState<InsumoCategoria[]>([]);
  const [subRecipes, setSubRecipes] = useState<Recipe[]>([]);
  const [packs, setPacks] = useState<DisposablePack[]>([]);
  const [params, setParams] = useState<LaborAndOverheadParams | null>(null);
  const [categories, setCategories] = useState<RecipeCategoryOption[]>([]);

  useEffect(() => {
    Promise.all([
      recipesApi.getCategories(),
      insumosInvApi.getAgrupados(),
      recipesApi.getAll({ isSubRecipe: 'true' }),
      disposablePacksApi.getAll(),
      laborOverheadApi.get(),
    ]).then(([catRes, insumosRes, srRes, pkRes, prRes]) => {
      setCategories(catRes.data);
      if (isNew && catRes.data[0]) setCategory(catRes.data[0].value);
      setInsumoCategories(insumosRes.data.map((g) => g.categoria));
      setInsumos(insumosRes.data.flatMap((g) => g.insumos));
      setSubRecipes(srRes.data);
      setPacks(pkRes.data);
      setParams(prRes.data);
    }).catch(() => toast.error('Error al cargar datos de referencia'));

    if (!isNew && id) {
      recipesApi.getOne(id).then((res) => {
        const r = res.data;
        setName(r.name);
        setCategory(r.category);
        setIsSubRecipe(r.isSubRecipe);
        setIsProduct(!!r.isProduct);
        setPreparationTimeMinutes(r.preparationTimeMinutes ?? 0);
        setActive(r.active);
        setVariants(r.variants.map((v) => ({
          size: v.size,
          ingredients: v.ingredients.map((i) => ({
            ingredientRefId: i.ingredientRefId,
            ingredientType: i.ingredientType,
            quantity: i.quantity,
            unit: i.unit,
            includePreparationTime: !!i.includePreparationTime,
          })),
          disposablePackId: v.disposablePackId ?? '',
          salePrice: v.salePrice,
          taxType: v.taxType ?? 'IVA_19',
          taxRate: v.taxRate ?? 0.19,
          taxIncluded: v.taxIncluded ?? true,
          costingMethod: v.costingMethod ?? 'food-cost',
          targetMargin: v.targetMargin ?? 0.4,
          targetFoodCostPct: v.targetFoodCostPct ?? 0.3,
        })));
      }).catch(() => {
        toast.error('Error al cargar receta');
        navigate('/admin/inventario/recetas');
      }).finally(() => setLoading(false));
    }
  }, [id, isNew]);

  useEffect(() => {
    if (!drawerTarget) {
      setRawForm(null);
      setRecipeForm(null);
      return;
    }

    if (drawerTarget.type === 'raw') {
      const insumo = insumos.find((i) => i._id === drawerTarget.id);
      setRawForm(insumo ? {
        nombre: insumo.nombre,
        unidad: insumo.unidad,
        cantidadPresentacion: insumo.cantidadPresentacion ?? 1,
        precioLista: insumo.precioLista ?? '',
        nivelBueno: insumo.nivelBueno ?? '',
        nivelRegular: insumo.nivelRegular ?? '',
        nivelAgotado: insumo.nivelAgotado ?? '',
      } : null);
      setRecipeForm(null);
      return;
    }

    const recipe = subRecipes.find((r) => r._id === drawerTarget.id);
    setRecipeForm(recipe ? {
      name: recipe.name,
      category: recipe.category,
      isSubRecipe: recipe.isSubRecipe,
      isProduct: !!recipe.isProduct,
      preparationTimeMinutes: recipe.preparationTimeMinutes ?? 0,
      active: recipe.active,
      variants: recipe.variants.map((variant) => ({
        size: variant.size,
        ingredients: variant.ingredients.map((ingredient) => ({
          ingredientRefId: ingredient.ingredientRefId,
          ingredientType: ingredient.ingredientType,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          includePreparationTime: !!ingredient.includePreparationTime,
        })),
        disposablePackId: variant.disposablePackId ?? '',
        salePrice: variant.salePrice,
        taxType: variant.taxType ?? 'IVA_19',
        taxRate: variant.taxRate ?? 0.19,
        taxIncluded: variant.taxIncluded ?? true,
        costingMethod: variant.costingMethod ?? 'food-cost',
        targetMargin: variant.targetMargin ?? 0.4,
        targetFoodCostPct: variant.targetFoodCostPct ?? 0.3,
      })),
    } : null);
    setRawForm(null);
  }, [drawerTarget, insumos, subRecipes]);

  useEffect(() => {
    if (!drawerTarget) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [drawerTarget]);

  const rmName = (rmId: string) => insumos.find((i) => i._id === rmId)?.nombre ?? '';
  const srName = (srId: string) => subRecipes.find((r) => r._id === srId)?.name ?? '';
  const insumoCategoryId = (insumo: Insumo) =>
    typeof insumo.categoriaId === 'string' ? insumo.categoriaId : insumo.categoriaId._id;
  const selectedInsumoCategoryId = (insumoId: string) => {
    const insumo = insumos.find((item) => item._id === insumoId);
    return insumo ? insumoCategoryId(insumo) : '';
  };
  const insumosByCategory = (categoryId: string) =>
    categoryId ? insumos.filter((item) => insumoCategoryId(item) === categoryId) : insumos;
  const ingredientCost = (ing: EditIngredient) => {
    const insumo = insumos.find((i) => i._id === ing.ingredientRefId);
    if (!insumo) return 0;
    return calcConvertedCost({
      quantity: ing.quantity,
      unit: ing.unit,
      totalPrice: insumo.precioLista,
      pricedQuantity: insumo.cantidadPresentacion ?? 1,
      pricedUnit: insumo.unidad,
    });
  };

  const ingredientUnitHint = (ing: EditIngredient) => {
    if (ing.ingredientType !== 'raw') return '';
    const insumo = insumos.find((i) => i._id === ing.ingredientRefId);
    if (!insumo || insumo.unidad !== 'PAQ') return '';
    const packageQuantity = insumo.cantidadPresentacion ?? 1;
    const unitCost = calcConvertedCost({
      quantity: 1,
      unit: 'UND',
      totalPrice: insumo.precioLista,
      pricedQuantity: packageQuantity,
      pricedUnit: insumo.unidad,
    });
    return `Paquete de ${packageQuantity} unidades. Usa UND para descontar unidades sueltas (${formatCOPDecimal(unitCost)} c/u).`;
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = categoryName.trim();
    if (!label) return;
    setCategorySaving(true);
    try {
      const res = await recipesApi.createCategory({ label });
      setCategories((prev) => [...prev, res.data].sort((a, b) => a.orden - b.orden));
      setCategory(res.data.value);
      setCategoryName('');
      setCategoryModalOpen(false);
      toast.success('Categoría creada');
    } catch {
      toast.error('Error al crear categoría');
    } finally {
      setCategorySaving(false);
    }
  };

  const updateVariant = (idx: number, patch: Partial<EditVariant>) =>
    setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, ...patch } : v));

  const addIngredient = (vIdx: number) =>
    updateVariant(vIdx, {
      ingredients: [
        ...variants[vIdx].ingredients,
        { ingredientRefId: insumos[0]?._id ?? '', ingredientType: 'raw', quantity: 1, unit: 'GR', includePreparationTime: false },
      ],
    });

  const removeIngredient = (vIdx: number, iIdx: number) =>
    updateVariant(vIdx, { ingredients: variants[vIdx].ingredients.filter((_, i) => i !== iIdx) });

  const updateIngredient = (vIdx: number, iIdx: number, patch: Partial<EditIngredient>) =>
    updateVariant(vIdx, {
      ingredients: variants[vIdx].ingredients.map((ing, i) => i === iIdx ? { ...ing, ...patch } : ing),
    });

  const addVariant = () => {
    setVariants((prev) => [...prev, emptyVariant()]);
    setActiveTab(variants.length);
  };

  const removeVariant = (idx: number) => {
    if (variants.length === 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== idx));
    setActiveTab(Math.max(0, activeTab - 1));
  };

  const subRecipeCost = (ing: EditIngredient) => {
    const subRecipe = subRecipes.find((recipe) => recipe._id === ing.ingredientRefId);
    return (subRecipe?.variants[0]?.totalCost ?? 0) * ing.quantity;
  };

  const recipePreparationTotal = (recipe: Recipe, visited = new Set<string>()): number => {
    if (visited.has(recipe._id)) return recipe.preparationTimeMinutes ?? 0;
    visited.add(recipe._id);

    const firstVariant = recipe.variants[0];
    if (!firstVariant) return recipe.preparationTimeMinutes ?? 0;

    return firstVariant.ingredients.reduce((total, ingredient) => {
      if (ingredient.ingredientType !== 'recipe' || !ingredient.includePreparationTime) return total;
      const subRecipe = subRecipes.find((item) => item._id === ingredient.ingredientRefId);
      if (!subRecipe) return total;
      return total + (ingredient.quantity || 1) * recipePreparationTotal(subRecipe, new Set(visited));
    }, recipe.preparationTimeMinutes ?? 0);
  };

  const variantPreparationTotal = (variant: EditVariant) =>
    variant.ingredients.reduce((total, ingredient) => {
      if (ingredient.ingredientType !== 'recipe' || !ingredient.includePreparationTime) return total;
      const subRecipe = subRecipes.find((item) => item._id === ingredient.ingredientRefId);
      if (!subRecipe) return total;
      return total + (ingredient.quantity || 1) * recipePreparationTotal(subRecipe);
    }, preparationTimeMinutes);

  const calcPreview = (v: EditVariant) => {
    if (!params) return null;
    const ingredientCosts = v.ingredients.map((ing) => {
      if (ing.ingredientType === 'raw') {
        return ingredientCost(ing);
      }
      return subRecipeCost(ing);
    });
    const pack = packs.find((p) => p._id === v.disposablePackId);
    const totalPreparationTime = variantPreparationTotal(v);
    return calcVariantCosts({
      ingredientCosts,
      disposablePackCost: pack?.totalCost ?? 0,
      laborPerItem: params.laborPerItem,
      overheadPerItem: params.overheadPerItem,
      preparationTimeMinutes: totalPreparationTime,
      laborCostPerMinute: (params.hourlyWage * params.numberOfWorkers) / 60,
      salePrice: v.salePrice,
      costingMethod: v.costingMethod,
      targetMargin: v.targetMargin || undefined,
      targetFoodCostPct: v.targetFoodCostPct || undefined,
      ivaRate: params.ivaRate,
      taxRate: v.taxRate,
      taxIncluded: v.taxIncluded,
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      const normalizedVariants = variants.map((variant) => ({
        ...variant,
        disposablePackId: variant.disposablePackId || undefined,
      })) as unknown as RecipeVariant[];
      const payload = {
        name: name.trim(),
        category,
        isSubRecipe,
        isProduct,
        preparationTimeMinutes,
        active,
        variants: normalizedVariants,
      } as Partial<Recipe>;
      if (isNew) {
        await recipesApi.create(payload);
        toast.success('Receta creada');
      } else if (id) {
        await recipesApi.update(id, payload);
        toast.success('Receta actualizada');
      }
      navigate('/admin/inventario/recetas');
    } catch {
      toast.error('Error al guardar receta');
    } finally {
      setSaving(false);
    }
  };

  const openIngredientDrawer = (ing: EditIngredient) => {
    if (!ing.ingredientRefId) return;
    setDrawerTarget({ type: ing.ingredientType, id: ing.ingredientRefId });
  };

  const saveDrawer = async () => {
    if (!drawerTarget) return;
    setDrawerSaving(true);
    try {
      if (drawerTarget.type === 'raw') {
        if (!rawForm?.nombre.trim()) {
          toast.error('El nombre del insumo es requerido');
          return;
        }
        const payload: Partial<Insumo> = {
          nombre: rawForm.nombre.trim(),
          unidad: rawForm.unidad,
          cantidadPresentacion: rawForm.cantidadPresentacion || 1,
          precioLista: rawForm.precioLista === '' ? undefined : Number(rawForm.precioLista),
          nivelBueno: rawForm.nivelBueno,
          nivelRegular: rawForm.nivelRegular,
          nivelAgotado: rawForm.nivelAgotado,
        };
        const res = await insumosInvApi.update(drawerTarget.id, payload);
        setInsumos((prev) => prev.map((item) => item._id === drawerTarget.id ? res.data : item));
        toast.success('Insumo actualizado');
        setDrawerTarget(null);
        return;
      }

      if (!recipeForm?.name.trim()) {
        toast.error('El nombre de la sub-receta es requerido');
        return;
      }
      const payload: Partial<Recipe> = {
        name: recipeForm.name.trim(),
        category: recipeForm.category,
        isSubRecipe: recipeForm.isSubRecipe,
        isProduct: recipeForm.isProduct,
        preparationTimeMinutes: recipeForm.preparationTimeMinutes,
        active: recipeForm.active,
        variants: recipeForm.variants.map((variant) => ({
          ...variant,
          disposablePackId: variant.disposablePackId || undefined,
        })) as unknown as RecipeVariant[],
      };
      const res = await recipesApi.update(drawerTarget.id, payload);
      setSubRecipes((prev) => prev.map((item) => item._id === drawerTarget.id ? res.data : item));
      toast.success('Sub-receta actualizada');
      setDrawerTarget(null);
    } catch {
      toast.error('Error al guardar cambios');
    } finally {
      setDrawerSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const v = variants[activeTab];
  const preview = v ? calcPreview(v) : null;
  const hasNetSalePrice = !!preview && preview.salePriceWithoutTax > 0;
  const totalPreparationTime = v ? variantPreparationTotal(v) : preparationTimeMinutes;
  const isFoodCostMethod = v?.costingMethod !== 'full-cost';
  const suggestedBasePrice = preview && v
    ? isFoodCostMethod
      ? v.targetFoodCostPct > 0 && v.targetFoodCostPct < 1
        ? preview.directMaterialCost / v.targetFoodCostPct
        : 0
      : v.targetMargin > 0 && v.targetMargin < 1
        ? preview.totalCost / (1 - v.targetMargin)
        : 0
    : 0;
  const suggestedTaxAmount = suggestedBasePrice * (v?.taxRate ?? 0);
  const suggestedFinalPrice = suggestedBasePrice + suggestedTaxAmount;
  const activeCostingLabel = isFoodCostMethod ? 'Food cost' : 'MOD + GIF';

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">
            {isNew ? 'Nueva receta' : `Editar: ${name}`}
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/admin/inventario/recetas')}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>Guardar receta</Button>
        </div>
      </div>

      <div className="card p-0">
        {v && (
          <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            {/* Left: variant config */}
            <div className="min-w-0 space-y-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
                <div>
                  <label className="text-sm font-medium text-ink font-body block mb-1">Nombre de la receta</label>
                  <input
                    className="input-base"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Latte de Vainilla"
                  />
                </div>
                <div className="space-y-2">
                  <Select
                    label="Categoría"
                    options={categories.map((c) => ({ value: c.value, label: c.label }))}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RecipeCategory)}
                  />
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="text-xs font-body text-terracotta hover:underline"
                  >
                    + Crear categoría de producto
                  </button>
                </div>
                <div className="space-y-3 lg:col-span-2">
                  <div className="max-w-xs">
                    <Input
                      label="Tiempo promedio de preparación (min)"
                      type="number"
                      min="0"
                      step="0.5"
                      value={preparationTimeMinutes}
                      onChange={(e) => setPreparationTimeMinutes(+e.target.value)}
                      hint="Tiempo base de esta receta, sin contar sub-recetas."
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-body text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSubRecipe}
                      onChange={(e) => {
                        setIsSubRecipe(e.target.checked);
                        if (e.target.checked) setIsProduct(false);
                      }}
                      className="rounded"
                    />
                    Es sub-receta (puede usarse como ingrediente)
                  </label>
                  <label className="flex items-center gap-2 text-sm font-body text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isProduct}
                      disabled={isSubRecipe}
                      onChange={(e) => setIsProduct(e.target.checked)}
                      className="rounded"
                    />
                    Disponible para pedidos
                  </label>
                  <label className="flex items-center gap-2 text-sm font-body text-ink cursor-pointer">
                    <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded" />
                    Receta activa
                  </label>
                </div>
              </div>

              <div className="flex items-center border-b border-rule gap-1 flex-wrap">
                {variants.map((vt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`px-4 py-2 text-sm font-body rounded-t-lg transition-colors ${
                      activeTab === idx
                        ? 'bg-white border border-b-white border-rule text-espresso font-medium -mb-px'
                        : 'text-stone hover:text-espresso'
                    }`}
                  >
                    {vt.size}
                  </button>
                ))}
                <button
                  onClick={addVariant}
                  className="px-3 py-2 text-sm font-body text-terracotta hover:opacity-80"
                >+ Variante</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-ink font-body block mb-1">Tamaño</label>
                  <select
                    className="input-base"
                    value={v.size}
                    onChange={(e) => updateVariant(activeTab, { size: e.target.value as VariantSize })}
                  >
                    {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink font-body block mb-1">Pack desechable</label>
                  <select
                    className="input-base"
                    value={v.disposablePackId}
                    onChange={(e) => updateVariant(activeTab, { disposablePackId: e.target.value })}
                  >
                    <option value="">Sin pack</option>
                    {packs.map((p) => <option key={p._id} value={p._id}>{p.name} ({formatCOPDecimal(p.totalCost)})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink font-body block mb-1">Método de costeo</label>
                  <select
                    className="input-base"
                    value={v.costingMethod}
                    onChange={(e) =>
                      updateVariant(activeTab, {
                        costingMethod: e.target.value as EditVariant['costingMethod'],
                      })
                    }
                  >
                    <option value="food-cost">Básico: food cost</option>
                    <option value="full-cost">Completo: MOD + GIF</option>
                  </select>
                </div>
                <Input
                  label="Precio de venta (COP)"
                  type="number"
                  value={v.salePrice}
                  onChange={(e) => updateVariant(activeTab, { salePrice: +e.target.value })}
                />
                <div>
                  <label className="text-sm font-medium text-ink font-body block mb-1">Impuesto</label>
                  <select
                    className="input-base"
                    value={v.taxType}
                    onChange={(e) => {
                      const option = TAX_OPTIONS.find((tax) => tax.value === e.target.value) ?? TAX_OPTIONS[0];
                      updateVariant(activeTab, { taxType: option.value, taxRate: option.rate });
                    }}
                  >
                    {TAX_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
	                <div className="flex items-end pb-3">
	                  <label className="flex items-center gap-2 text-sm font-body text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!v.taxIncluded}
                      disabled={v.taxRate === 0}
                      onChange={(e) => updateVariant(activeTab, { taxIncluded: !e.target.checked })}
                      className="rounded"
                    />
	                    El precio ingresado no incluye impuesto
	                  </label>
	                </div>
                {v.costingMethod === 'food-cost' ? (
                  <Input
                    label="Food cost objetivo (0.0 – 1.0)"
                    type="number"
                    step="0.01"
                    value={v.targetFoodCostPct}
                    onChange={(e) => updateVariant(activeTab, { targetFoodCostPct: +e.target.value })}
                  />
                ) : (
                  <Input
                    label="Margen objetivo (0.0 – 1.0)"
                    type="number"
                    step="0.01"
                    value={v.targetMargin}
                    onChange={(e) => updateVariant(activeTab, { targetMargin: +e.target.value })}
                  />
                )}
              </div>

              {variants.length > 1 && (
                <div className="flex justify-end">
                  <Button variant="danger" size="sm" onClick={() => removeVariant(activeTab)}>
                    Eliminar variante {v.size}
                  </Button>
                </div>
              )}
            </div>

            {/* Right: cost preview */}
            <div className="bg-surface-tint rounded-xl p-4 text-sm font-body h-fit">
              <p className="font-body font-semibold text-espresso mb-4">Vista previa de costos</p>
              {preview && params ? (
                <div className="space-y-4">
                  <CostPreviewSection
                    title={`Costo de producir · ${activeCostingLabel}`}
                    tooltip={
                      isFoodCostMethod
                        ? 'Usa solo materiales directos como costo base. MOD y GIF quedan fuera de este método.'
                        : 'Suma materiales directos, MOD y GIF antes de impuestos y utilidad.'
                    }
                  >
                    <Row
                      label="Materiales directos"
                      value={formatCOPDecimal(preview.directMaterialCost)}
                      tooltip="Ingredientes, sub-recetas y pack desechable seleccionado para esta variante."
                    />
                    {isFoodCostMethod ? (
                      <Row
                        label="Food cost objetivo"
                        value={formatPct(v.targetFoodCostPct)}
                        tooltip="Porcentaje objetivo del precio neto que ocuparán los materiales directos."
                      />
                    ) : (
                      <>
                        <Row
                          label="MOD"
                          value={formatCOPDecimal(preview.laborCost)}
                          tooltip={
                            totalPreparationTime > 0
                              ? `Mano de obra calculada con ${totalPreparationTime.toFixed(1)} min de preparación y ${formatCOPDecimal((params.hourlyWage * params.numberOfWorkers) / 60)} por minuto.`
                              : `Mano de obra directa por ítem. Viene de Parámetros MOD/GIF y hoy está en ${formatCOPDecimal(params.laborPerItem)} por producto.`
                          }
                        />
                        <Row
                          label="Tiempo preparación"
                          value={`${totalPreparationTime.toFixed(1)} min`}
                          tooltip="Tiempo base de esta receta más las sub-recetas marcadas para sumar tiempo."
                        />
                        <Row
                          label="GIF"
                          value={formatCOPDecimal(preview.overheadCost)}
                          tooltip={`Gastos indirectos por ítem. Viene de Parámetros MOD/GIF y hoy está en ${formatCOPDecimal(params.overheadPerItem)} por producto.`}
                        />
                      </>
                    )}
                    <div className="border-t border-rule pt-2 mt-2">
                      <Row
                        label={isFoodCostMethod ? 'Costo base' : 'Costo total'}
                        value={formatCOPDecimal(preview.totalCost)}
                        tooltip={
                          isFoodCostMethod
                            ? 'Materiales directos. Es la base para el precio sugerido por food cost.'
                            : 'Materiales directos + MOD + GIF. Es la base para calcular utilidad y precio sugerido.'
                        }
                        bold
                      />
                    </div>
                  </CostPreviewSection>

                  <CostPreviewSection
                    title="Precio e impuestos"
                    tooltip="Separa el precio que paga el cliente entre venta neta del negocio e impuesto."
                  >
                    {v.salePrice <= 0 && (
                      <p className="rounded-lg border border-warning bg-warning-tint px-3 py-2 text-xs text-warning-ink">
                        Ingresa un precio de venta para calcular impuesto, utilidad y margen.
                      </p>
                    )}
                    <Row
                      label={v.taxIncluded ? 'Precio final ingresado' : 'Precio base ingresado'}
                      value={formatCOPDecimal(v.salePrice)}
                      tooltip={
                        v.taxIncluded
                          ? 'Precio que pagará el cliente. El sistema descuenta el impuesto para calcular la venta neta.'
                          : 'Precio antes de impuesto. El sistema suma el impuesto para calcular el precio final al cliente.'
                      }
                    />
                    {v.taxRate > 0 && (
                      <>
                        <Row
                          label="Venta neta sin impuesto"
                          value={formatCOPDecimal(preview.salePriceWithoutTax)}
                          tooltip="Ingreso real del negocio antes de restar costos. Fórmula: precio final / (1 + tasa de impuesto)."
                        />
                        <Row
                          label={`${v.taxType === 'CONSUMO_8' ? 'Impoconsumo' : 'IVA'} (${(v.taxRate * 100).toFixed(0)}%)`}
                          value={formatCOPDecimal(preview.taxAmount)}
                          tooltip="Parte del precio que corresponde al impuesto configurado para esta variante."
                        />
                        <Row
                          label="Precio final al cliente"
                          value={formatCOPDecimal(preview.finalPrice)}
                          tooltip="Total que paga el cliente después de aplicar la configuración de impuesto."
                        />
                      </>
                    )}
                  </CostPreviewSection>

	                  <CostPreviewSection
	                    title="Rentabilidad"
	                    tooltip={
                        isFoodCostMethod
                          ? 'Muestra margen bruto sobre materiales directos. MOD y GIF no se descuentan en este método.'
                          : 'Muestra cuánto queda después de cubrir el costo total. El margen se calcula sobre la venta neta, no sobre el precio con impuesto.'
                      }
	                  >
                    <Row
                      label="Utilidad neta"
                      value={hasNetSalePrice ? formatCOPDecimal(preview.profitAmount) : 'Pendiente'}
                      tooltip="Venta neta sin impuesto menos costo total."
                    />
	                    <Row
	                      label={isFoodCostMethod ? 'Margen bruto sobre venta neta' : 'Margen sobre venta neta'}
	                      value={hasNetSalePrice ? formatPct(preview.grossMarginPct) : 'Pendiente'}
	                      tooltip={
                          isFoodCostMethod
                            ? 'Porcentaje de venta neta que queda después de cubrir materiales directos.'
                            : 'Porcentaje de la venta neta que queda como utilidad. Fórmula: utilidad neta / venta neta sin impuesto.'
                        }
	                    />
	                  </CostPreviewSection>

	                  {((isFoodCostMethod && v.targetFoodCostPct > 0) || (!isFoodCostMethod && v.targetMargin > 0)) && (
	                    <CostPreviewSection
	                      title="Precio sugerido"
	                      tooltip={
                          isFoodCostMethod
                            ? 'Calcula el precio necesario para alcanzar el food cost objetivo configurado.'
                            : 'Calcula el precio necesario para alcanzar el margen objetivo configurado en esta variante.'
                        }
	                    >
	                      <Row
	                        label="Precio sugerido base"
	                        value={formatCOPDecimal(suggestedBasePrice)}
	                        tooltip={
                            isFoodCostMethod
                              ? `Precio sin impuesto para que materiales directos sean ${(v.targetFoodCostPct * 100).toFixed(0)}% de la venta neta.`
                              : `Precio sin impuesto necesario para lograr ${(v.targetMargin * 100).toFixed(0)}% de margen sobre venta neta.`
                          }
	                      />
                      {v.taxRate > 0 && (
                        <>
                          <Row
                            label={`Impuesto sugerido (${(v.taxRate * 100).toFixed(0)}%)`}
                            value={formatCOPDecimal(suggestedTaxAmount)}
                            tooltip="Impuesto calculado sobre el precio sugerido base."
                          />
                          <Row
                            label="Precio sugerido final"
                            value={formatCOPDecimal(suggestedFinalPrice)}
                            tooltip="Precio al cliente después de sumar el impuesto al precio sugerido base."
                            bold
                          />
                        </>
                      )}
                      {v.taxRate === 0 && (
                        <Row
                          label="Precio sugerido final"
                          value={formatCOPDecimal(suggestedFinalPrice)}
                          tooltip="Precio al cliente para alcanzar el margen objetivo. No se suma impuesto porque la variante está configurada sin impuesto."
                          bold
                        />
                      )}
                    </CostPreviewSection>
                  )}
                </div>
              ) : (
                <p className="text-stone text-center py-4">Agrega ingredientes y precio de venta para ver el análisis.</p>
              )}
            </div>

            {/* Ingredients */}
            <div className="min-w-0 xl:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-ink font-body">Ingredientes</span>
                <Button variant="ghost" size="sm" onClick={() => addIngredient(activeTab)}>+ Agregar</Button>
              </div>
              <div className="hidden grid-cols-[7rem_10rem_minmax(16rem,1fr)_5rem_6rem_7rem_6rem_5rem_6rem] gap-2 px-1 text-xs font-body font-medium uppercase tracking-wide text-stone xl:grid">
                <span>Tipo</span>
                <span>Categoría</span>
                <span>Ingrediente</span>
                <span>Cant.</span>
                <span>Unidad</span>
                <span>Tiempo</span>
                <span className="text-right">Costo</span>
                <span></span>
                <span></span>
              </div>
              <div className="space-y-2">
                {v.ingredients.map((ing, iIdx) => (
                  <div key={iIdx} className="space-y-1">
                    <div className="grid grid-cols-1 gap-2 xl:grid-cols-[7rem_10rem_minmax(16rem,1fr)_5rem_6rem_7rem_6rem_5rem_6rem] xl:items-center">
                      <select
                        className="input-base text-sm"
                        value={ing.ingredientType}
                        onChange={(e) => updateIngredient(activeTab, iIdx, {
                          ingredientType: e.target.value as 'raw' | 'recipe',
                          ingredientRefId: e.target.value === 'raw'
                            ? (insumos[0]?._id ?? '')
                            : (subRecipes[0]?._id ?? ''),
                          includePreparationTime: false,
                        })}
                      >
                        <option value="raw">Insumo</option>
                        <option value="recipe">Sub-receta</option>
                      </select>
                      <select
                        className="input-base text-sm"
                        value={ing.ingredientType === 'raw' ? selectedInsumoCategoryId(ing.ingredientRefId) : ''}
                        disabled={ing.ingredientType !== 'raw'}
                        onChange={(e) => {
                          const categoryInsumos = insumosByCategory(e.target.value);
                          updateIngredient(activeTab, iIdx, { ingredientRefId: categoryInsumos[0]?._id ?? '' });
                        }}
                        aria-label="Categoría del insumo"
                      >
                        {ing.ingredientType === 'raw' ? (
                          insumoCategories.map((category) => (
                            <option key={category._id} value={category._id}>{category.nombre}</option>
                          ))
                        ) : (
                          <option value="">No aplica</option>
                        )}
                      </select>
                      <SearchableSelect
                        value={ing.ingredientRefId}
                        options={
                          ing.ingredientType === 'raw'
                            ? insumosByCategory(selectedInsumoCategoryId(ing.ingredientRefId)).map((item) => ({
                              value: item._id,
                              label: item.nombre,
                            }))
                            : subRecipes.map((recipe) => ({
                              value: recipe._id,
                              label: recipe.name,
                            }))
                        }
                        placeholder={ing.ingredientType === 'raw' ? 'Buscar insumo...' : 'Buscar sub-receta...'}
                        emptyLabel={ing.ingredientType === 'raw' ? 'Sin insumos en esta categoría' : 'Sin sub-recetas'}
                        onChange={(value) => updateIngredient(activeTab, iIdx, { ingredientRefId: value })}
                      />
                      <input
                        className="input-base text-sm"
                        type="number"
                        step="0.01"
                        min="0"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(activeTab, iIdx, { quantity: +e.target.value })}
                      />
                      <select
                        className="input-base text-sm"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(activeTab, iIdx, { unit: e.target.value as RecipeIngredientUnit })}
                      >
                        {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                      </select>
                      <label className={`flex h-9 items-center gap-2 rounded-lg px-2 text-xs font-body ${
                        ing.ingredientType === 'recipe' ? 'text-ink' : 'text-stone opacity-60'
                      }`}>
                        <input
                          type="checkbox"
                          checked={!!ing.includePreparationTime}
                          disabled={ing.ingredientType !== 'recipe'}
                          onChange={(e) => updateIngredient(activeTab, iIdx, { includePreparationTime: e.target.checked })}
                          className="rounded"
                        />
                        Sumar
                      </label>
                      <span className="text-xs text-stone text-right">
                        {formatCOPDecimal(
                          ing.ingredientType === 'raw'
                            ? ingredientCost(ing)
                            : subRecipeCost(ing)
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => openIngredientDrawer(ing)}
                        disabled={!ing.ingredientRefId}
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg px-2 text-xs font-body text-stone hover:bg-surface-tint hover:text-terracotta disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone"
                        aria-label={ing.ingredientType === 'raw' ? 'Editar insumo' : 'Editar sub-receta'}
                        title={ing.ingredientType === 'raw' ? 'Editar insumo' : 'Editar sub-receta'}
                      >
                        <Edit3 size={15} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeIngredient(activeTab, iIdx)}
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg px-2 text-xs font-body font-medium text-error-ink hover:bg-error-tint"
                        aria-label="Quitar ingrediente"
                        title="Quitar ingrediente"
                      >
                        <Trash2 size={15} />
                        <span>Quitar</span>
                      </button>
                    </div>
                    {ingredientUnitHint(ing) && (
                      <p className="text-xs font-body text-stone xl:ml-[calc(17rem+1rem)]">
                        {ingredientUnitHint(ing)}
                      </p>
                    )}
                  </div>
                ))}
                {v.ingredients.length === 0 && (
                  <p className="text-sm text-stone text-center py-4">Sin ingredientes. Agrega el primero.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
            Estas categorías clasifican recetas/productos. Son independientes de las categorías de insumos.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCategoryModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={categorySaving} disabled={!categoryName.trim()}>Crear</Button>
          </div>
        </form>
      </Modal>

      {drawerTarget && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-espresso bg-opacity-50 backdrop-blur-sm"
            onClick={() => setDrawerTarget(null)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-white px-6 py-4">
              <div>
                <p className="text-xs font-body uppercase tracking-wide text-stone">
                  {drawerTarget.type === 'raw' ? 'Insumo' : 'Sub-receta'}
                </p>
                <h2 className="font-body text-xl font-semibold text-espresso">
                  {drawerTarget.type === 'raw'
                    ? rawForm?.nombre || 'Editar insumo'
                    : recipeForm?.name || 'Editar sub-receta'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerTarget(null)}
                className="rounded-lg p-1 text-stone transition-colors hover:bg-surface-tint hover:text-espresso"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {drawerTarget.type === 'raw' && rawForm && (
                <>
                  <Input
                    label="Nombre del insumo"
                    value={rawForm.nombre}
                    onChange={(e) => setRawForm({ ...rawForm, nombre: e.target.value })}
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-3">
	                    <Input
	                      label={rawForm.unidad === 'PAQ' ? 'Unidades por paquete' : 'Cantidad de presentación'}
                      type="number"
                      min="0"
                      step="0.01"
                      value={rawForm.cantidadPresentacion}
                      onChange={(e) => setRawForm({ ...rawForm, cantidadPresentacion: +e.target.value })}
                    />
	                    <Select
	                      label="Unidad de presentación"
                      options={UNIT_OPTIONS}
                      value={rawForm.unidad}
                      onChange={(e) => setRawForm({ ...rawForm, unidad: e.target.value as MeasurementUnit })}
                    />
                  </div>
                  <Input
                    label="Precio de lista (COP)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={rawForm.precioLista}
                    onChange={(e) => setRawForm({ ...rawForm, precioLista: e.target.value === '' ? '' : +e.target.value })}
	                    hint="Este valor alimenta la vista previa de costos de la receta."
	                  />
                    {rawForm.unidad === 'PAQ' && (
                      <p className="text-xs font-body text-stone">
                        Para paquetes, escribe cuántas unidades trae el paquete. En la receta usa UND para costear unidades sueltas.
                      </p>
                    )}
                  <div className="rounded-xl bg-surface-tint p-4">
                    <p className="mb-3 text-sm font-medium text-ink font-body">Niveles de inventario</p>
                    <div className="space-y-3">
                      <Input
                        label="Bueno"
                        value={rawForm.nivelBueno}
                        onChange={(e) => setRawForm({ ...rawForm, nivelBueno: e.target.value })}
                        placeholder="Ej: 6+ bolsas"
                      />
                      <Input
                        label="Regular"
                        value={rawForm.nivelRegular}
                        onChange={(e) => setRawForm({ ...rawForm, nivelRegular: e.target.value })}
                        placeholder="Ej: 2-5 bolsas"
                      />
                      <Input
                        label="Agotado"
                        value={rawForm.nivelAgotado}
                        onChange={(e) => setRawForm({ ...rawForm, nivelAgotado: e.target.value })}
                        placeholder="Ej: 0-1 bolsas"
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-rule bg-white p-4 text-sm font-body">
                    <Row
                      label="Costo por unidad de presentación"
                      value={formatCOPDecimal(calcConvertedCost({
                        quantity: 1,
                        unit: rawForm.unidad,
                        totalPrice: rawForm.precioLista === '' ? 0 : Number(rawForm.precioLista),
                        pricedQuantity: rawForm.cantidadPresentacion || 1,
                        pricedUnit: rawForm.unidad,
                      }))}
                    />
                  </div>
                </>
              )}

              {drawerTarget.type === 'recipe' && recipeForm && (
                <>
                  <Input
                    label="Nombre de la sub-receta"
                    value={recipeForm.name}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    autoFocus
                  />
                  <Select
                    label="Categoría"
                    options={categories.map((c) => ({ value: c.value, label: c.label }))}
                    value={recipeForm.category}
                    onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value as RecipeCategory })}
                  />
                  <Input
                    label="Tiempo promedio de preparación (min)"
                    type="number"
                    min="0"
                    step="0.5"
                    value={recipeForm.preparationTimeMinutes}
                    onChange={(e) => setRecipeForm({ ...recipeForm, preparationTimeMinutes: +e.target.value })}
                    hint="Tiempo base de esta sub-receta. Las recetas que la usen decidirán si lo suman."
                  />
                  <div className="space-y-3 rounded-xl bg-surface-tint p-4">
                    <label className="flex items-center gap-2 text-sm font-body text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recipeForm.isSubRecipe}
                        onChange={(e) => setRecipeForm({
                          ...recipeForm,
                          isSubRecipe: e.target.checked,
                          isProduct: e.target.checked ? false : recipeForm.isProduct,
                        })}
                        className="rounded"
                      />
                      Disponible como sub-receta
                    </label>
                    <label className="flex items-center gap-2 text-sm font-body text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recipeForm.isProduct}
                        disabled={recipeForm.isSubRecipe}
                        onChange={(e) => setRecipeForm({ ...recipeForm, isProduct: e.target.checked })}
                        className="rounded"
                      />
                      Disponible para pedidos
                    </label>
                    <label className="flex items-center gap-2 text-sm font-body text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recipeForm.active}
                        onChange={(e) => setRecipeForm({ ...recipeForm, active: e.target.checked })}
                        className="rounded"
                      />
                      Activa
                    </label>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-ink font-body">Variantes</p>
                    {recipeForm.variants.map((variant, idx) => (
                      <div key={`${variant.size}-${idx}`} className="rounded-xl border border-rule p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            label="Tamaño"
                            options={SIZES.map((size) => ({ value: size, label: size }))}
                            value={variant.size}
                            onChange={(e) => setRecipeForm({
                              ...recipeForm,
                              variants: recipeForm.variants.map((item, itemIdx) =>
                                itemIdx === idx ? { ...item, size: e.target.value as VariantSize } : item
                              ),
                            })}
                          />
                          <Input
                            label="Precio venta"
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.salePrice}
                            onChange={(e) => setRecipeForm({
                              ...recipeForm,
                              variants: recipeForm.variants.map((item, itemIdx) =>
                                itemIdx === idx ? { ...item, salePrice: +e.target.value } : item
                              ),
                            })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => navigate(`/admin/inventario/recetas/${drawerTarget.id}`)}
                    className="w-full"
                  >
                    <ExternalLink size={16} />
                    Abrir editor completo
                  </Button>
                </>
              )}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-rule bg-white px-6 py-4">
              <Button variant="secondary" type="button" onClick={() => setDrawerTarget(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveDrawer} loading={drawerSaving}>
                Guardar cambios
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function CostPreviewSection({
  title,
  tooltip,
  children,
}: {
  title: string;
  tooltip: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-1.5 border-b border-rule pb-1.5">
        <p className="text-xs font-body font-semibold uppercase tracking-wide text-espresso">
          {title}
        </p>
        <HelpTooltip text={tooltip} />
      </div>
      {children}
    </section>
  );
}

function SearchableSelect({
  value,
  options,
  placeholder,
  emptyLabel,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  emptyLabel: string;
  onChange: (value: string) => void;
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';
  const [query, setQuery] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (!open) setQuery(selectedLabel);
  }, [open, selectedLabel]);

  return (
    <div className="relative">
      <input
        className="input-base text-sm"
        value={open ? query : selectedLabel}
        placeholder={placeholder}
        onFocus={() => {
          setQuery('');
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        aria-label={placeholder}
      />
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-30 max-h-56 overflow-y-auto rounded-lg border border-rule bg-white py-1 shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.slice(0, 60).map((option) => (
              <button
                key={option.value}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm font-body hover:bg-surface-tint ${
                  option.value === value ? 'text-terracotta font-medium' : 'text-ink'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm font-body text-stone">{emptyLabel}</p>
          )}
          {filteredOptions.length > 60 && (
            <p className="border-t border-rule px-3 py-2 text-xs font-body text-stone">
              Hay mas resultados. Escribe para afinar la busqueda.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  tooltip,
  bold,
}: {
  label: string;
  value: string;
  tooltip?: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 ${bold ? 'font-semibold text-espresso' : 'text-stone'}`}>
      <span className="flex min-w-0 items-center gap-1.5">
        <span>{label}</span>
        {tooltip && <HelpTooltip text={tooltip} />}
      </span>
      <span className={`shrink-0 text-right ${bold ? '' : 'text-ink'}`}>{value}</span>
    </div>
  );
}

function HelpTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
      <Info
        size={14}
        className="text-stone transition-colors group-hover:text-terracotta"
        aria-hidden="true"
      />
      <span className="pointer-events-none absolute left-1/2 top-5 z-20 hidden w-64 -translate-x-1/2 rounded-lg border border-rule bg-white px-3 py-2 text-left text-xs font-normal leading-snug text-ink shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}
