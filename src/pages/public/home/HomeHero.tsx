import { Link } from "react-router-dom";
import { ProgressiveImage } from "./ProgressiveImage";
import { WaveDivider } from "./WaveDivider";
import { useScrollReveal } from "./useScrollReveal";
import { homeImages } from "./helpers";

export function HomeHero() {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="li-hero">
      <div
        className="li-hero-bg"
        style={{ backgroundImage: "url(/images/home/visita.jpg)" }}
        aria-hidden="true"
      />
      <div className="li-hero-overlay" aria-hidden="true" />
      <div className="li-hero-inner li-reveal" ref={revealRef}>
        <div className="li-hero-copy">
          <h1 className="li-hero-title">
            Baja el
            <br />
            volumen
            <br />
            <span>de la ciudad</span>
          </h1>
          <p className="li-hero-desc">
            Café de especialidad, mesas largas, patio con sombra y planes
            para conocer gente. Una isla de tres cuadras en pleno barrio
            Belén.
          </p>
          <div className="li-hero-actions">
            <Link to="/reservar/mesa" className="li-btn-primary">
              Reservar mesa →
            </Link>
            <Link to="/reservar/cena-con-desconocidos" className="li-btn-ghost">
              Cena con desconocidos
            </Link>
          </div>
          <div className="li-hero-stats">
            <div>
              <strong>1pm–9pm</strong>
              <span>Lun a sáb</span>
            </div>
            <div>
              <strong>4h</strong>
              <span>Mesa sin culpa</span>
            </div>
            <div>
              <strong>Tolima</strong>
              <span>Grano de origen</span>
            </div>
          </div>
        </div>
        <div className="li-hero-media">
          <div className="li-hero-blob" aria-hidden="true" />
          <div className="li-hero-photo li-duotone">
            <ProgressiveImage
              className="image-fill"
              src={homeImages.hero.src}
              alt={homeImages.hero.alt}
              loading="eager"
            />
          </div>
        </div>
      </div>
      <WaveDivider color="var(--li-sand-light)" />
    </section>
  );
}
