import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScrollReveal } from "./useScrollReveal";
import { bookingHours, nextDayChips } from "./helpers";

export function HomeBooking() {
  const navigate = useNavigate();
  const revealRef = useScrollReveal<HTMLDivElement>();

  const [bookingDay, setBookingDay] = useState(0);
  const [bookingHour, setBookingHour] = useState(2);
  const [bookingPeople, setBookingPeople] = useState(2);

  const bookingDays = useMemo(() => nextDayChips(5), []);
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
            Elige día, hora y cuántos son. Te guardamos la mesa 15 minutos
            y, si vienen a trabajar, te sentamos cerca del enchufe.
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
            navigate("/reservar/mesa");
          }}
        >
          <p className="li-booking-form-title">Tu mesa en La Isla</p>
          <p className="li-booking-step-label">1 · Día</p>
          <div className="li-chip-row">
            {bookingDays.map((day, index) => (
              <button
                type="button"
                key={day.label}
                onClick={() => setBookingDay(index)}
                className={`li-chip-btn ${index === bookingDay ? "is-active" : ""}`}
              >
                {day.label}
              </button>
            ))}
          </div>
          <p className="li-booking-step-label">2 · Hora</p>
          <div className="li-chip-row">
            {bookingHours.map((hour, index) => (
              <button
                type="button"
                key={hour}
                onClick={() => setBookingHour(index)}
                className={`li-chip-btn ${index === bookingHour ? "is-active" : ""}`}
              >
                {hour}
              </button>
            ))}
          </div>
          <p className="li-booking-step-label">3 · Cuántos son</p>
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
            Continuar con la reserva →
          </button>
          <p className="li-booking-summary">
            {bookingSummary} · sin anticipo, confirmamos por WhatsApp.
          </p>
        </form>
      </div>
    </section>
  );
}
