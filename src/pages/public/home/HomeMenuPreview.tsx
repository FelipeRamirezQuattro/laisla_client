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
  status: "loading" | "ready" | "error";
};

export function HomeMenuPreview({ menuItems, status }: HomeMenuPreviewProps) {
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
          {status === "loading" ? (
            <div className="li-empty-state" aria-live="polite">Cargando la carta…</div>
          ) : menuItems.length > 0 ? (
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
              {status === "error"
                ? "No pudimos cargar la carta. Puedes verla completa o escribirnos para conocer lo disponible."
                : "Estamos actualizando la selección de hoy. Mira la carta completa para ver todo lo disponible."}
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
            <p className="li-kicker">Café en barra</p>
            <p className="li-menu-roast-title">Pregunta por el grano de hoy</p>
            <p>
              En la barra te contamos su origen, notas y el método que mejor le
              queda. La disponibilidad cambia con cada lote.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
