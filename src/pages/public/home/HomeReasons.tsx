import { ProgressiveImage } from "./ProgressiveImage";
import { useScrollReveal } from "./useScrollReveal";
import { homeImages } from "./helpers";

const reasons = [
  {
    n: "N.º 01",
    tag: "Barra",
    title: "Café de origen",
    desc: "Grano del Tolima, tostión de la semana escrita en la pizarra y métodos fríos para el calor de Ibagué.",
    img: homeImages.reasons[0],
  },
  {
    n: "N.º 02",
    tag: "Mesas",
    title: "Isla de trabajo",
    desc: "Enchufe en cada mesa, WiFi que aguanta la videollamada y permiso oficial para quedarte cuatro horas.",
    img: homeImages.reasons[1],
  },
  {
    n: "N.º 03",
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
            <p className="li-kicker">Tres razones · una isla</p>
            <h2 className="li-section-title">
              Aquí el reloj
              <br />
              se queda afuera
            </h2>
          </div>
          <p className="li-reasons-lead">
            No somos un café para llevar. Somos el sitio donde te sientas,
            sacas el portátil o no, y de repente son las seis.
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
                <span className="li-reason-badge">{reason.n}</span>
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
