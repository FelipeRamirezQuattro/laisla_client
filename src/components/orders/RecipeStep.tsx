import { Search } from 'lucide-react';
import { Recipe, RecipeCategoryOption, RecipeVariant } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';

function finalVariantPrice(variant: RecipeVariant) {
  return variant.finalPrice ?? variant.salePrice;
}

interface RecipeStepProps {
  recipes: Recipe[];
  activeCategories: RecipeCategoryOption[];
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  categoryLabel: (value: string) => string;
  onAddVariant: (recipe: Recipe, variant: RecipeVariant) => void;
}

export function RecipeStep({
  recipes,
  activeCategories,
  selectedCategory,
  onSelectCategory,
  search,
  onSearchChange,
  categoryLabel,
  onAddVariant,
}: RecipeStepProps) {
  const isSearching = search.trim().length > 0;
  const visibleRecipes = isSearching
    ? recipes.filter((recipe) => recipe.name.toLowerCase().includes(search.trim().toLowerCase()))
    : recipes.filter((recipe) => recipe.category === selectedCategory);

  return (
    <div className="card p-4">
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-island-dark/40" />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar receta por nombre..."
          className="w-full rounded-lg border border-island-blue/20 pl-9 pr-3 py-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-island-blue"
        />
      </div>

      {!isSearching && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeCategories.map((category) => {
            const count = recipes.filter((recipe) => recipe.category === category.value).length;
            const selected = selectedCategory === category.value;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => onSelectCategory(category.value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-body transition-all ${
                  selected
                    ? 'border-island-blue bg-island-dark text-white'
                    : 'border-island-blue/20 bg-white text-island-dark/70 hover:border-island-blue/40'
                }`}
              >
                {category.label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-3">
        {visibleRecipes.map((recipe) => (
          <div key={recipe._id} className="border border-island-blue/20 rounded-xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-body font-semibold text-island-dark">{recipe.name}</h3>
                <p className="text-xs text-island-dark/70 font-body">{recipe.variants.length} presentación(es)</p>
              </div>
              <span className="text-xs rounded-full bg-gray-100 px-2 py-1 text-island-dark font-body">
                {categoryLabel(recipe.category)}
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              {recipe.variants.map((variant) => (
                <button
                  key={variant.size}
                  type="button"
                  onClick={() => onAddVariant(recipe, variant)}
                  className="flex items-center justify-between rounded-lg border border-island-blue/20 bg-white px-3 py-2 text-left hover:border-island-dark hover:bg-gray-100 transition-colors"
                >
                  <span className="font-body font-medium text-island-dark">{variant.size}</span>
                  <span className="font-body text-sm text-island-dark">{formatCOP(finalVariantPrice(variant))}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {visibleRecipes.length === 0 && (
          <div className="border border-dashed border-island-blue/20 rounded-xl p-6 text-center text-island-dark/70 font-body sm:col-span-2 2xl:col-span-3">
            {isSearching ? 'No se encontraron recetas con ese nombre.' : 'No hay recetas activas en esta categoría.'}
          </div>
        )}
      </div>
    </div>
  );
}
