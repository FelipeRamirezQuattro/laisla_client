import { Clock, MapPin, Phone } from "lucide-react";
import { useScrollReveal } from "./useScrollReveal";
import { contact } from "../../../utils/siteInfo";

const ADDRESS = "Cra 4C # 41-25, Barrio La Macarena Parte Baja, Ibagué, Tolima";
const encodedAddress = encodeURIComponent(ADDRESS);
const mapEmbedSrc = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

export function HomeLocation() {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="li-location li-pattern-band" id="visita">
      <div ref={revealRef} className="li-reveal li-location-inner">
        <div className="li-location-copy">
          <p className="li-kicker">Visítanos</p>
          <h2 className="li-section-title">Dónde encontrarnos</h2>
          <div className="li-location-detail">
            <MapPin size={22} strokeWidth={2} />
            <span>
              Cra 4C # 41-25
              <br />
              Barrio La Macarena Parte Baja · Ibagué, Tolima
            </span>
          </div>
          <div className="li-location-detail">
            <Clock size={22} strokeWidth={2} />
            <span>Lunes a sábado · 1:00 pm – 9:00 pm</span>
          </div>
          <div className="li-location-detail">
            <Phone size={22} strokeWidth={2} />
            <a href={contact.phoneHref}>{contact.phone}</a>
          </div>
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="li-btn-primary"
          >
            Cómo llegar →
          </a>
        </div>
        <div className="li-location-map">
          <iframe
            src={mapEmbedSrc}
            title="Ubicación de La Isla · Café Picnic"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
