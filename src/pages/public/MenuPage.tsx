import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Coffee, ImageIcon } from "lucide-react";
import { publicMenuApi } from "../../api/publicMenu";
import type { Recipe, RecipeCategoryOption, RecipeVariant } from "../../types";
import { formatCOP } from "../../utils/formatCurrency";
import { PageLoader } from "../../components/ui/Spinner";

function publicPrice(variant: RecipeVariant) {
  return variant.finalPrice ?? variant.salePrice;
}

function recipePriceLabel(recipe: Recipe) {
  const prices = recipe.variants.map(publicPrice).filter((price) => price > 0);
  if (!prices.length) return "Consultar";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatCOP(min) : `${formatCOP(min)} - ${formatCOP(max)}`;
}

export function MenuPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<RecipeCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicMenuApi
      .get()
      .then((res) => {
        setRecipes(res.data.recipes);
        setCategories(res.data.categories);
      })
      .catch(() => {
        setRecipes([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const groupedMenu = useMemo(() => {
    return categories
      .filter((category) =>
        recipes.some((recipe) => recipe.category === category.value),
      )
      .map((category) => ({
        category,
        items: recipes.filter((recipe) => recipe.category === category.value),
      }));
  }, [recipes, categories]);

  if (loading) return <PageLoader />;

  return (
    <main className="public-menu-page">
      <style>{menuStyles}</style>

      <section className="menu-hero">
        <div>
          <h1>Menú</h1>
        </div>
      </section>

      {groupedMenu.length > 0 ? (
        <section className="menu-category-list">
          {groupedMenu.map(({ category, items }, index) => (
            <article className="menu-category" key={category.value}>
              <header>
                <span>N°{String(index + 1).padStart(2, "0")}</span>
                <h2>{category.label}</h2>
              </header>

              <div className="menu-product-grid">
                {items.map((recipe) => (
                  <div className="menu-product" key={recipe._id}>
                    <div className="menu-product-media">
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          loading="lazy"
                        />
                      ) : (
                        <ImageIcon size={28} />
                      )}
                    </div>
                    <div>
                      <h3>{recipe.name}</h3>
                      <p>
                        {recipe.description ||
                          `${recipe.variants.length} variante(s) disponibles`}
                      </p>
                      {recipe.variants.length > 1 && (
                        <div className="variant-list">
                          {recipe.variants.map((variant) => (
                            <span key={variant.size}>
                              {variant.size}: {formatCOP(publicPrice(variant))}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <strong>{recipePriceLabel(recipe)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="menu-empty">
          <Coffee size={34} />
          <h2>Carta en preparación</h2>
          <p>
            Los productos publicados desde el administrador aparecerán aquí.
          </p>
          <Link to="/">Volver al inicio</Link>
        </section>
      )}
    </main>
  );
}

const menuStyles = `
.public-menu-page {
  --menu-ink: #1F2A1B;
  --menu-muted: #6B7768;
  --menu-paper: #FFF9EC;
  --menu-rule: #E7DEC6;
  --menu-espresso: #43593B;
  --menu-terracotta: #E87A5D;
  background: var(--menu-paper);
  color: var(--menu-ink);
}
.menu-hero {
  display: grid;
  grid-template-columns: minmax(140px, .32fr) 1fr;
  gap: clamp(24px, 5vw, 72px);
  padding: clamp(54px, 8vw, 110px) clamp(20px, 6vw, 72px) clamp(34px, 5vw, 70px);
  border-bottom: 1px solid var(--menu-rule);
}
.menu-eyebrow {
  color: var(--menu-terracotta);
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 900;
  margin-top: 10px;
}
.menu-hero h1 {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: clamp(42px, 7vw, 92px);
  line-height: .92;
  color: var(--menu-espresso);
  margin: 0 0 18px;
}
.menu-hero p:last-child {
  max-width: 720px;
  color: var(--menu-muted);
  font-size: 18px;
  line-height: 1.55;
}
.menu-category-list {
  display: grid;
  gap: 28px;
  padding: clamp(30px, 5vw, 72px) clamp(20px, 6vw, 72px) clamp(62px, 8vw, 112px);
}
.menu-category {
  display: grid;
  grid-template-columns: minmax(150px, .24fr) 1fr;
  gap: 28px;
  border-top: 1px solid var(--menu-rule);
  padding-top: 26px;
}
.menu-category header span {
  color: var(--menu-terracotta);
  font: 12px ui-monospace, monospace;
}
.menu-category h2 {
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: clamp(30px, 4vw, 54px);
  line-height: 1;
  color: var(--menu-espresso);
  margin: 8px 0 0;
}
.menu-product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.menu-product {
  display: grid;
  grid-template-columns: 112px 1fr auto;
  gap: 16px;
  align-items: center;
  border: 1px solid var(--menu-rule);
  border-radius: 8px;
  background: white;
  padding: 14px;
}
.menu-product-media {
  width: 112px;
  height: 112px;
  border-radius: 8px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: #FBF3DE;
  color: var(--menu-muted);
}
.menu-product-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.menu-product h3 {
  color: var(--menu-ink);
  font-size: 18px;
  font-weight: 900;
  margin: 0 0 5px;
}
.menu-product p {
  color: var(--menu-muted);
  font-size: 13px;
  line-height: 1.45;
  margin: 0;
}
.menu-product strong {
  color: var(--menu-espresso);
  white-space: nowrap;
}
.variant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.variant-list span {
  border: 1px solid var(--menu-rule);
  border-radius: 999px;
  color: var(--menu-espresso);
  font-size: 11px;
  font-weight: 800;
  padding: 5px 8px;
}
.menu-empty {
  min-height: 420px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  text-align: center;
  padding: 48px 20px;
  color: var(--menu-muted);
}
.menu-empty h2 {
  font-family: "DM Sans", system-ui, sans-serif;
  color: var(--menu-espresso);
  font-size: 34px;
  margin: 0;
}
.menu-empty a {
  color: var(--menu-terracotta);
  font-weight: 900;
}
@media (max-width: 1080px) {
  .menu-category, .menu-hero { grid-template-columns: 1fr; }
  .menu-product-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .menu-product { grid-template-columns: 84px 1fr; }
  .menu-product-media { width: 84px; height: 84px; }
  .menu-product strong { grid-column: 2; }
}
`;
