import { ProgressiveImage } from "./ProgressiveImage";
import { useScrollReveal } from "./useScrollReveal";
import { homeImages } from "./helpers";

export function HomeIslena() {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="li-isleña li-pattern-band">
      <div ref={revealRef} className="li-reveal li-isleña-inner">
        <div className="li-isleña-copy">
          <p className="li-kicker">Te presentamos a La Isleña</p>
          <p className="li-isleña-title">
            Sin prisa,
            <br />
            <span>sin ruido</span>
          </p>
          <p className="li-isleña-desc">
            Llega en chanclas, se queda hasta que se acabe la conversación.
            Si la ves pasar, ya entendiste el plan.
          </p>
          <div className="li-isleña-thumbs">
            {homeImages.isleña.map((img, index) => (
              <div
                className="li-isleña-thumb li-duotone"
                style={{ transform: `rotate(${index % 2 ? 2 : -2}deg)` }}
                key={img.src}
              >
                <ProgressiveImage
                  className="image-fill"
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="li-isleña-facts">
          <div className="li-isleña-fact">
            <span>Su pedido</span>
            <span>Latte con canela</span>
          </div>
          <div className="li-isleña-fact">
            <span>Su mesa</span>
            <span>La del rincón</span>
          </div>
          <div className="li-isleña-fact">
            <span>Se reconoce por</span>
            <span>Las chanclas</span>
          </div>
        </div>
        <img
          src="/images/brand/mascota-islena.png"
          alt="La Isleña, el personaje de La Isla"
          className="li-isleña-mascot"
        />
      </div>
    </section>
  );
}
