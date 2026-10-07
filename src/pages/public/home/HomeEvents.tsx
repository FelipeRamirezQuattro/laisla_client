import { Link } from "react-router-dom";
import type { Event } from "../../../types";
import { ProgressiveImage } from "./ProgressiveImage";
import { useScrollReveal } from "./useScrollReveal";
import {
  eventCtaPath,
  eventDateParts,
  eventDateTimeLabel,
  homeImages,
} from "./helpers";
import { InstagramIcon, WhatsAppIcon } from "../../../components/icons/SocialIcons";
import { contact, socialLinks } from "../../../utils/siteInfo";

type HomeEventsProps = {
  events: Event[];
  status: "loading" | "ready" | "error";
};

export function HomeEvents({ events, status }: HomeEventsProps) {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="li-events" id="eventos">
      <div ref={revealRef} className="li-reveal">
        <div className="li-events-head">
          <div>
            <p className="li-kicker">Cartelera de la isla</p>
            <h2 className="li-section-title">
              Esta quincena
              <br />
              pasa esto
            </h2>
          </div>
          <Link to="/reservar/eventos" className="li-text-link">
            Todo el calendario →
          </Link>
        </div>
        {status === "loading" ? (
          <div className="li-events-empty" aria-live="polite">
            <img src="/images/brand/icono-blanco.png" alt="" width="64" height="64" />
            <p>Cargando los próximos planes…</p>
          </div>
        ) : events.length > 0 ? (
          <div className="li-events-grid">
            {events.map((event, index) => {
              const { day, month } = eventDateParts(event);
              const fallback =
                homeImages.eventFallbacks[index % homeImages.eventFallbacks.length];
              return (
                <Link to={eventCtaPath(event)} className="li-event-card" key={event._id}>
                  <div className="li-event-photo li-duotone">
                    <ProgressiveImage
                      className="image-fill"
                      src={event.imageUrl || fallback.src}
                      alt={event.title || fallback.alt}
                      loading="lazy"
                    />
                    <span className="li-event-date">
                      <strong>{day}</strong>
                      <span>{month}</span>
                    </span>
                  </div>
                  <div className="li-event-body">
                    <span className="li-event-badge">Próximo plan</span>
                    <h3>{event.title}</h3>
                    <p>{eventDateTimeLabel(event)}</p>
                    {event.description && <p className="li-event-desc">{event.description}</p>}
                    <span className="li-event-action">Ver evento →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="li-events-empty">
            <img src="/images/brand/icono-blanco.png" alt="" width="64" height="64" />
            <div>
              <h3>{status === "error" ? "La cartelera está tomando aire" : "La próxima fecha está por llegar"}</h3>
              <p>
                {status === "error"
                  ? "No pudimos cargar los planes ahora. Escríbenos y te contamos qué viene."
                  : "Mientras anunciamos el siguiente plan, síguenos o pregúntanos por WhatsApp."}
              </p>
            </div>
            <div className="li-events-empty-actions">
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                <InstagramIcon size={18} /> Instagram
              </a>
              <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={18} /> WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
