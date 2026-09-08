import { Link } from "react-router-dom";
import { ProgressiveImage } from "./ProgressiveImage";
import { useScrollReveal } from "./useScrollReveal";
import { homeImages } from "./helpers";

export type MenuPreviewItem = {
  id: string;
  name: string;
  desc: string;
  price: string;
};

type HomeMenuPreviewProps = {
  menuItems: MenuPreviewItem[];
};

export function HomeMenuPreview({ menuItems }: HomeMenuPreviewProps) {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="li-menu" id="carta">
      <div ref={revealRef} className="li-reveal li-menu-grid">
        <div>
          <p className="li-kicker">Carta corta a propósito</p>
          <h2 className="li-section-title">
            Lo que se pide
            <br />
            dos veces
          </h2>
          {menuItems.length > 0 ? (
            <div className="li-menu-list">
              {menuItems.map((item) => (
                <div className="li-menu-row" key={item.id}>
                  <span className="li-menu-row-name">{item.name}</span>
                  <span className="li-menu-row-desc">{item.desc}</span>
                  <strong className="li-menu-row-price">{item.price}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="li-empty-state">
              La carta pública aparecerá aquí cuando haya productos activos
              publicados desde el administrador.
            </div>
          )}
          <Link to="/menu" className="li-text-link">
            Ver la carta completa →
          </Link>
        </div>
        <div className="li-menu-aside">
          <div className="li-menu-feature-photo li-duotone">
            <ProgressiveImage
              className="image-fill"
              src={homeImages.menuFeature.src}
              alt={homeImages.menuFeature.alt}
              loading="lazy"
            />
          </div>
          <div className="li-menu-roast">
            <p className="li-kicker">Tostión de la semana</p>
            <p className="li-menu-roast-title">
              Finca La Palma
              <br />· Anaime
            </p>
            <p>Notas de panela, mandarina y almendra. Se acaba el domingo.</p>
          </div>
          <div className="li-menu-picnic-photo li-duotone">
            <ProgressiveImage
              className="image-fill"
              src={homeImages.menuPicnic.src}
              alt={homeImages.menuPicnic.alt}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
