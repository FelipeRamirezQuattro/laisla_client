import { useRef, useState } from "react";
import { ProgressiveImage } from "./ProgressiveImage";
import { useScrollReveal } from "./useScrollReveal";
import { homeImages } from "./helpers";

const reasons = [
  {
    tag: "Barra",
    title: "Café de origen",
    desc: "Café preparado al momento, métodos fríos para el calor de Ibagué y una barra que siempre tiene algo por recomendar.",
    img: homeImages.reasons[0],
  },
  {
    tag: "Mesas",
    title: "Isla de trabajo",
    desc: "Enchufe en cada mesa, WiFi que aguanta la videollamada y permiso oficial para quedarte cuatro horas.",
    img: homeImages.reasons[1],
  },
  {
    tag: "Planes",
    title: "Vida social",
    desc: "Cine bajo el cobertizo, catas guiadas, domingos de picnic y la cena donde nadie se conoce.",
    img: homeImages.reasons[2],
    extra: "li-reason-card-3",
  },
];

export function HomeReasons() {
  const revealRef = useScrollReveal<HTMLDivElement>();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeReason, setActiveReason] = useState(0);

  const scrollToReason = (index: number) => {
    const carousel = carouselRef.current;
    const card = carousel?.children[index] as HTMLElement | undefined;
    const firstCard = carousel?.firstElementChild as HTMLElement | null;

    if (!carousel || !card || !firstCard) return;

    carousel.scrollTo({
      left: card.offsetLeft - firstCard.offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const updateActiveReason = () => {
    const carousel = carouselRef.current;
    const cards = Array.from(carousel?.children ?? []) as HTMLElement[];
    const firstCard = cards[0];

    if (!carousel || !firstCard) return;

    const closestIndex = cards.reduce((closest, card, index) => {
      const cardDistance = Math.abs(card.offsetLeft - firstCard.offsetLeft - carousel.scrollLeft);
      const closestCard = cards[closest];
      const closestDistance = Math.abs(
        closestCard.offsetLeft - firstCard.offsetLeft - carousel.scrollLeft,
      );
      return cardDistance < closestDistance ? index : closest;
    }, 0);

    setActiveReason(closestIndex);
  };

  return (
    <section className="li-reasons li-pattern-band" id="razones">
      <div ref={revealRef} className="li-reveal">
        <div className="li-reasons-head">
          <div>
            <p className="li-kicker">Un lugar, tres maneras de estar</p>
            <h2 className="li-section-title">
              Ven por el café.
              <br />
              Quédate por el plan.
            </h2>
          </div>
          <p className="li-reasons-lead">
            Aquí puedes avanzar en lo tuyo, hacer una pausa o sumarte a un plan.
            Cada rincón tiene su propio ritmo.
          </p>
        </div>
        <div
          ref={carouselRef}
          className="li-reasons-grid"
          role="region"
          aria-label="Tres maneras de disfrutar La Isla"
          onScroll={updateActiveReason}
        >
          {reasons.map((reason, index) => (
            <article
              className={`li-reason-card ${reason.extra ?? ""}`}
              key={reason.title}
              aria-label={`${index + 1} de ${reasons.length}: ${reason.title}`}
            >
              <div className="li-reason-photo li-duotone">
                <ProgressiveImage
                  className="image-fill"
                  src={reason.img.src}
                  alt={reason.img.alt}
                  loading="lazy"
                />
              </div>
              <div className="li-reason-body">
                <p className="li-reason-tag">{reason.tag}</p>
                <h3>{reason.title}</h3>
                <p>{reason.desc}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="li-reasons-carousel-nav" aria-label="Navegación del carrusel">
          <button
            type="button"
            aria-label="Ver la tarjeta anterior"
            disabled={activeReason === 0}
            onClick={() => scrollToReason(activeReason - 1)}
          >
            ←
          </button>
          <span className="li-reasons-carousel-count" aria-live="polite">
            Desliza · <strong>{activeReason + 1}</strong> de {reasons.length}
          </span>
          <button
            type="button"
            aria-label="Ver la tarjeta siguiente"
            disabled={activeReason === reasons.length - 1}
            onClick={() => scrollToReason(activeReason + 1)}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
