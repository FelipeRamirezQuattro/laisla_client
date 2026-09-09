import { Link } from "react-router-dom";
import {
  Check,
  Heart,
  MessageCircle,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { Event } from "../../../types";
import { ProgressiveImage } from "./ProgressiveImage";
import { useScrollReveal } from "./useScrollReveal";
import {
  dinnerFeatures,
  eventDateTimeLabel,
  eventPriceLabel,
  homeImages,
} from "./helpers";

type HomeDinnerProps = {
  dinnerEvent: Event | null;
};

const cardFeatures = [
  { icon: UtensilsCrossed, label: "3 tiempos" },
  { icon: Heart, label: "Algoritmo" },
  { icon: Users, label: "6 personas" },
];

export function HomeDinner({ dinnerEvent }: HomeDinnerProps) {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="li-dinner" id="cena">
      <div ref={revealRef} className="li-reveal li-dinner-inner">
        <div className="li-dinner-card-wrap">
          <div className="li-dinner-card">
            <div className="li-dinner-card-head">
              <span className="li-dinner-avatar">
                <img src="/images/brand/icono-color.png" alt="" />
              </span>
              <span>
                <strong>laislacafepicnic</strong>
                <span>Ibagué</span>
              </span>
            </div>
            <div className="li-dinner-photo li-duotone">
              <ProgressiveImage
                className="image-fill"
                src={homeImages.cena.src}
                alt={homeImages.cena.alt}
                loading="lazy"
              />
              <span className="li-dinner-photo-tag">Mesa 07 · 7:30 pm</span>
              <span className="li-dinner-photo-filter">sin filtro</span>
            </div>
            <div className="li-dinner-card-icons" aria-hidden="true">
              <Heart size={22} strokeWidth={2} />
              <MessageCircle size={22} strokeWidth={2} />
              <span className="li-dinner-card-stat">
                1.248 personas guardaron esta mesa
              </span>
            </div>
            <p className="li-dinner-caption">
              Seis desconocidos, tres tiempos y cero apellidos.{" "}
              <span>#CenaConDesconocidos #ModoIsla</span>
            </p>
            <div className="li-dinner-card-features">
              {cardFeatures.map(({ icon: Icon, label }) => (
                <div key={label}>
                  <span>
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="li-dinner-copy">
          <p className="li-pill">La experiencia de la casa</p>
          <h2 className="li-dinner-title">
            No sabes
            <br />
            con quién
            <br />
            <span>vas a cenar</span>
          </h2>
          <p className="li-dinner-desc">
            Seis sillas, una mesa larga y ningún nombre por adelantado.
            Contestas un cuestionario de compatibilidad, nosotros armamos el
            grupo y tú apareces a las 7:30 pm sin saber nada más.
          </p>
          <ul className="li-dinner-features">
            {dinnerFeatures.map((feature) => (
              <li key={feature}>
                <span className="li-check" aria-hidden="true">
                  <Check size={15} strokeWidth={3} />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="li-hero-actions">
            <Link
              to="/reservar/cena-con-desconocidos"
              className="li-btn-primary"
            >
              Contestar el cuestionario →
            </Link>
          </div>
          <p className="li-dinner-meta">
            {dinnerEvent
              ? `${eventDateTimeLabel(dinnerEvent)} · ${eventPriceLabel(dinnerEvent)}`
              : "Último jueves de cada mes · $65.000 con tres tiempos"}
          </p>
        </div>
      </div>
    </section>
  );
}
