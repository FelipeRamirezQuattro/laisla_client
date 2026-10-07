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
        <div className="li-reasons-grid">
          {reasons.map((reason) => (
            <article className={`li-reason-card ${reason.extra ?? ""}`} key={reason.title}>
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
      </div>
    </section>
  );
}
