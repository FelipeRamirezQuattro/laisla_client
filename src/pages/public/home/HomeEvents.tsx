import { Link } from "react-router-dom";
import type { Event } from "../../../types";
import { ProgressiveImage } from "./ProgressiveImage";
import { useScrollReveal } from "./useScrollReveal";
import {
  eventCtaPath,
  eventDateParts,
  eventDateTimeLabel,
  eventPriceLabel,
  eventSpotsLeft,
  homeImages,
} from "./helpers";

type HomeEventsProps = {
  events: Event[];
};

export function HomeEvents({ events }: HomeEventsProps) {
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
        {events.length > 0 ? (
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
                    <span className="li-event-badge">
                      {event.pricePerPerson > 0
                        ? `${eventPriceLabel(event)} · ${eventSpotsLeft(event)} cupos`
                        : "Entrada libre"}
                    </span>
                    <h3>{event.title}</h3>
                    <p>{eventDateTimeLabel(event)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="li-empty-state">
            Los eventos publicados desde el administrador aparecerán aquí.
          </div>
        )}
      </div>
    </section>
  );
}
