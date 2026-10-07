import { Link } from "react-router-dom";
import type { Event } from "../../../types";
import { ProgressiveImage } from "./ProgressiveImage";
import { useScrollReveal } from "./useScrollReveal";
import { eventDateTimeLabel, homeImages } from "./helpers";

type HomeDinnerProps = {
  dinnerEvent: Event | null;
};

export function HomeDinner({ dinnerEvent }: HomeDinnerProps) {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="li-dinner" id="cena">
      <div ref={revealRef} className="li-reveal li-dinner-inner">
        <div className="li-dinner-head">
          <p className="li-pill">La experiencia de la casa</p>
          <h2 className="li-dinner-title">
            Una mesa.
            <br />
            Seis personas.
            <br />
            <span>Cero conocidos.</span>
          </h2>
          <p className="li-dinner-desc">
            Respondes un cuestionario breve. Nosotros armamos una mesa por
            afinidad y tú llegas a cenar sin saber los nombres de antemano.
          </p>
        </div>
        <div className="li-dinner-media">
          <div className="li-dinner-photo li-duotone">
            <ProgressiveImage
              className="image-fill"
              src={homeImages.cena.src}
              alt={homeImages.cena.alt}
              loading="lazy"
            />
            <span className="li-dinner-photo-tag">Mesa de 6 · cupos limitados</span>
          </div>
        </div>
        <div className="li-dinner-indicators" aria-label="Cómo funciona">
          <span><strong>6</strong> personas</span>
          <span><strong>Por</strong> afinidad</span>
          <span><strong>Cupos</strong> limitados</span>
        </div>
        <div className="li-dinner-action">
          <Link to="/reservar/cena-con-desconocidos" className="li-btn-primary">
            Contestar el cuestionario →
          </Link>
          <p className="li-dinner-meta">
            {dinnerEvent ? eventDateTimeLabel(dinnerEvent) : "Próxima fecha por anunciar"}
          </p>
        </div>
      </div>
    </section>
  );
}
