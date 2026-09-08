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
          <p className="menu-kicker">Nuestro Menú</p>
          <h1>Menú</h1>
        </div>
      </section>
      <div className="menu-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path
            d="M0 18C240 5 470 30 720 27 970 25 1210 6 1440 14V60H0Z"
            fill="#FEF9E7"
          />
        </svg>
      </div>

      {groupedMenu.length > 0 ? (
        <section className="menu-category-list">
          {groupedMenu.map(({ category, items }, index) => (
            <article className="menu-category" key={category.value}>
              <header>
                <span className="menu-category-badge">
                  N.º {String(index + 1).padStart(2, "0")}
                </span>
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
          <span className="menu-empty-icon">
            <Coffee size={30} strokeWidth={2} />
          </span>
          <h2>Carta en preparación</h2>
          <p>
            Los productos publicados desde el administrador aparecerán aquí.
          </p>
          <Link to="/" className="menu-empty-cta">
            Volver al inicio →
          </Link>
        </section>
      )}
    </main>
  );
}

const menuStyles = `
.public-menu-page {
  --menu-blue: #2043A9;
  --menu-yellow: #FCA613;
  --menu-dark: #101A3A;
  --menu-muted: rgba(16,26,58,.72);
  --menu-sand: #FBF6E2;
  --menu-sand-light: #FEF9E7;
  --menu-rule: rgba(16,26,58,.2);
  font-family: "Nunito", system-ui, sans-serif;
  background: var(--menu-sand);
  color: var(--menu-dark);
}
.menu-hero {
  padding: clamp(54px, 8vw, 96px) clamp(20px, 6vw, 72px) clamp(40px, 6vw, 64px);
  background: var(--menu-blue);
}
.menu-kicker {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .24em;
  text-transform: uppercase;
  color: var(--menu-yellow);
}
.menu-hero h1 {
  font-family: "Caprasimo", cursive;
  font-weight: 400;
  font-size: clamp(52px, 8vw, 100px);
  line-height: .92;
  color: #fff;
  margin: 0;
}
.menu-wave { line-height: 0; }
.menu-wave svg { display: block; width: 100%; height: 44px; }
.menu-category-list {
  display: grid;
  gap: 12px;
  padding: clamp(20px, 5vw, 48px) clamp(20px, 6vw, 72px) clamp(62px, 8vw, 112px);
  max-width: 1240px;
  margin: 0 auto;
}
.menu-category {
  display: grid;
  grid-template-columns: minmax(150px, .24fr) 1fr;
  gap: 28px;
  padding: 40px 0;
  border-bottom: 2px dashed var(--menu-rule);
}
.menu-category:last-child { border-bottom: 0; }
.menu-category-badge {
  display: inline-flex;
  align-self: start;
  background: var(--menu-yellow);
  color: var(--menu-blue);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
  padding: 7px 14px;
  border-radius: 999px;
}
.menu-category h2 {
  font-family: "Caprasimo", cursive;
  font-weight: 400;
  font-size: clamp(32px, 4vw, 50px);
  line-height: 1;
  color: var(--menu-blue);
  margin: 12px 0 0;
}
.menu-product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.menu-product {
  display: grid;
  grid-template-columns: 96px 1fr auto;
  gap: 16px;
  align-items: center;
  border: 2px solid var(--menu-blue);
  border-radius: 20px;
  background: var(--menu-sand-light);
  padding: 14px;
  transition: transform .2s ease;
}
.menu-product:hover { transform: translateY(-2px); }
.menu-product-media {
  width: 96px;
  height: 96px;
  border-radius: 14px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--menu-blue);
  color: var(--menu-sand);
}
.menu-product-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(.25) sepia(.15) hue-rotate(178deg) saturate(1.4);
}
.menu-product h3 {
  font-family: "Caprasimo", cursive;
  font-weight: 400;
  color: var(--menu-dark);
  font-size: 21px;
  margin: 0 0 5px;
}
.menu-product p {
  color: var(--menu-muted);
  font-size: 14px;
  line-height: 1.45;
  margin: 0;
}
.menu-product strong {
  font-family: "Caprasimo", cursive;
  font-weight: 400;
  font-size: 19px;
  color: var(--menu-blue);
  white-space: nowrap;
}
.variant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.variant-list span {
  border: 2px solid var(--menu-blue);
  border-radius: 999px;
  color: var(--menu-blue);
  font-size: 11px;
  font-weight: 800;
  padding: 5px 10px;
}
.menu-empty {
  min-height: 420px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 14px;
  text-align: center;
  padding: 48px 20px;
  color: var(--menu-muted);
}
.menu-empty-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--menu-sand-light);
  color: var(--menu-blue);
  border: 2px solid var(--menu-blue);
}
.menu-empty h2 {
  font-family: "Caprasimo", cursive;
  font-weight: 400;
  color: var(--menu-dark);
  font-size: 32px;
  margin: 0;
}
.menu-empty-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  background: var(--menu-yellow);
  color: var(--menu-blue);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 14px 24px;
  border-radius: 999px;
  text-decoration: none;
  transition: transform .2s ease;
}
.menu-empty-cta:hover { transform: translateY(-2px); }
@media (max-width: 1080px) {
  .menu-category { grid-template-columns: 1fr; }
  .menu-product-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .menu-product { grid-template-columns: 72px 1fr; }
  .menu-product-media { width: 72px; height: 72px; }
  .menu-product strong { grid-column: 2; }
}
`;
