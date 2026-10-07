import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useScrollReveal } from "./useScrollReveal";
import { bookingHours, nextOpenDayChips } from "./helpers";

export function HomeBooking() {
  const navigate = useNavigate();
  const revealRef = useScrollReveal<HTMLDivElement>();

  const [bookingDay, setBookingDay] = useState(0);
  const [bookingHour, setBookingHour] = useState(2);
  const [bookingPeople, setBookingPeople] = useState(2);

  const bookingDays = useMemo(() => nextOpenDayChips(5), []);
  const bookingSummary = `${bookingDays[bookingDay].label} · ${bookingHours[bookingHour]} · ${
    bookingPeople === 1 ? "1 persona" : `${bookingPeople} personas`
  }`;

  return (
    <section className="li-booking" id="reserva">
      <div className="li-booking-sunrays" aria-hidden="true" />
      <div ref={revealRef} className="li-reveal li-booking-inner">
        <div className="li-booking-copy">
          <p className="li-kicker">Reserva de mesa</p>
          <h2 className="li-section-title li-booking-title">
            Aparta tu
            <br />
            pedazo de
            <br />
            sombra
          </h2>
          <p className="li-booking-desc">
            Elige el día, la hora y el número de personas. Nosotros nos
            encargamos del resto.
          </p>
          <div className="li-booking-tags">
            <span>Patio con sombra</span>
            <span>Mesa larga</span>
            <span>Barra</span>
          </div>
        </div>
        <form
          className="li-booking-form"
          onSubmit={(event) => {
            event.preventDefault();
            const params = new URLSearchParams({
              date: bookingDays[bookingDay].value,
              timeSlot: bookingHours[bookingHour],
              partySize: String(bookingPeople),
            });
            navigate(`/reservar/mesa?${params.toString()}`);
          }}
        >
          <p className="li-booking-form-title">Tu mesa en La Isla</p>
          <p className="li-booking-help">Elige tu preferencia. Confirmaremos la disponibilidad contigo.</p>
          <p className="li-booking-step-label" id="booking-day-label">Día</p>
          <div className="li-chip-row li-day-grid" role="radiogroup" aria-labelledby="booking-day-label">
            {bookingDays.map((day, index) => (
              <button
                type="button"
                key={day.label}
                onClick={() => setBookingDay(index)}
                className={`li-chip-btn ${index === bookingDay ? "is-active" : ""}`}
                role="radio"
                aria-checked={index === bookingDay}
              >
                {index === bookingDay && <Check size={15} aria-hidden="true" />}
                {day.label}
              </button>
            ))}
          </div>
          <p className="li-booking-step-label" id="booking-hour-label">Hora</p>
          <div className="li-chip-row li-hour-grid" role="radiogroup" aria-labelledby="booking-hour-label">
            {bookingHours.map((hour, index) => (
              <button
                type="button"
                key={hour}
                onClick={() => setBookingHour(index)}
                className={`li-chip-btn ${index === bookingHour ? "is-active" : ""}`}
                role="radio"
                aria-checked={index === bookingHour}
              >
                {index === bookingHour && <Check size={15} aria-hidden="true" />}
                {hour}
              </button>
            ))}
          </div>
          <p className="li-booking-step-label">Cuántas personas</p>
          <div className="li-people-row">
            <button
              type="button"
              className="li-people-btn"
              onClick={() => setBookingPeople((p) => Math.max(1, p - 1))}
              aria-label="Menos personas"
            >
              −
            </button>
            <strong className="li-people-count">
              {bookingPeople === 1 ? "1 persona" : `${bookingPeople} personas`}
            </strong>
            <button
              type="button"
              className="li-people-btn"
              onClick={() => setBookingPeople((p) => Math.min(12, p + 1))}
              aria-label="Más personas"
            >
              +
            </button>
          </div>
          <button type="submit" className="li-booking-submit">
            Reservar mesa para {bookingPeople} →
          </button>
          <p className="li-booking-summary">{bookingSummary}</p>
        </form>
      </div>
    </section>
  );
}
