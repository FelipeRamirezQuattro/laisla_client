import { useScrollReveal } from "./useScrollReveal";

export function HomeIslena() {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="li-isleña li-pattern-band">
      <div ref={revealRef} className="li-reveal li-isleña-inner">
        <div className="li-isleña-copy">
          <p className="li-kicker">Ella es Coral</p>
          <h2 className="li-isleña-title">
            El alma de
            <br />
            <span>La Isla</span>
          </h2>
          <p className="li-isleña-desc">
            Curiosa, cercana y siempre lista para armar plan. Coral nos recuerda
            que una buena pausa también puede cambiarte el día.
          </p>
          <div className="li-isleña-facts">
            <div className="li-isleña-fact">
              <span>Lo que le gusta</span>
              <span>Juntar personas</span>
            </div>
            <div className="li-isleña-fact">
              <span>Su plan ideal</span>
              <span>Una tarde sin reloj</span>
            </div>
            <div className="li-isleña-fact">
              <span>Su filosofía</span>
              <span>Disfrutar el momento</span>
            </div>
          </div>
        </div>
        <img
          src="/images/brand/mascota-islena.png"
          alt="Coral, el personaje de La Isla"
          width="560"
          height="660"
          className="li-isleña-mascot"
        />
      </div>
    </section>
  );
}
