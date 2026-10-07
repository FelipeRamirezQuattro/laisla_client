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
          <p className="li-kicker li-kicker-on-blue">Café picnic · La Macarena</p>
          <h1 className="li-hero-title">
            Vivir
            <br />
            {" "}<span>sin afán.</span>
          </h1>
          <p className="li-hero-desc">
            Un lugar para tomar café, compartir la mesa y dejar que el día vaya
            a otro ritmo.
          </p>
          <div className="li-hero-actions">
            <Link to="/reservar/mesa" className="li-btn-primary">
              Reservar mesa →
            </Link>
            <Link to="/menu" className="li-btn-ghost">
              Ver la carta
            </Link>
          </div>
          <div className="li-hero-stats">
            <div>
              <span>Horario</span>
              <strong>1 pm–9 pm</strong>
            </div>
            <div>
              <span>Estamos en</span>
              <strong>La Macarena</strong>
            </div>
            <div>
              <span>El plan</span>
              <strong>Café, picnic y buenos planes</strong>
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
              fetchPriority="high"
            />
          </div>
        </div>
      </div>
      <WaveDivider color="var(--li-sand-light)" />
    </section>
  );
}
