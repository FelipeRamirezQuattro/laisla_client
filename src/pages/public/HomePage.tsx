import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ImgHTMLAttributes } from "react";
import { publicApi } from "../../api/public";
import { publicMenuApi } from "../../api/publicMenu";
import type { Event, Recipe, RecipeVariant } from "../../types";

const homeImages = {
  hero: {
    src: "/images/home/hero-barista.jpg",
    alt: "Barista preparando cafe en La Isla",
  },
  reasons: [
    { src: "/images/home/space-maquina.jpg", alt: "Maquina de espresso" },
    { src: "/images/home/space-mesa.jpg", alt: "Mesa para trabajar" },
    { src: "/images/home/space-mesera.jpg", alt: "Mesera sirviendo cafe" },
  ],
  menuFeature: {
    src: "/images/home/hero-cappuccino.jpg",
    alt: "Cappuccino con torta",
  },
  menuPicnic: {
    src: "/images/home/picnic.jpg",
    alt: "Picnic kit de La Isla",
  },
  isleña: [
    { src: "/images/home/space-mesera.jpg", alt: "Mesera de La Isla" },
    { src: "/images/home/visita.jpg", alt: "El patio de La Isla" },
  ],
  cena: {
    src: "/images/home/cena.jpg",
    alt: "Mesa larga en la cena con desconocidos",
  },
  eventFallbacks: [
    { src: "/images/home/picnic.jpg", alt: "Evento en La Isla" },
    { src: "/images/home/space-maquina.jpg", alt: "Evento en La Isla" },
    { src: "/images/home/visita.jpg", alt: "Evento en La Isla" },
  ],
};

const dinnerFeatures = [
  "Menu de tres tiempos sorpresa, cocinado esa noche.",
  "Cuestionario de compatibilidad para armar la mesa.",
  "Los nombres se revelan en la mesa, no antes.",
];

const bookingHours = ["10:00", "12:30", "15:00", "17:30", "20:00"];

function publicPrice(variant: RecipeVariant) {
  return variant.finalPrice ?? variant.salePrice;
}

function recipePriceLabel(recipe: Recipe) {
  const prices = recipe.variants.map(publicPrice).filter((price) => price > 0);
  if (!prices.length) return "Consultar";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const format = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value);
  return min === max ? format(min) : `${format(min)} - ${format(max)}`;
}

function eventDateParts(event: Event) {
  const date = new Date(event.date);
  const day = new Intl.DateTimeFormat("es-CO", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    month: "short",
  })
    .format(date)
    .replace(".", "");
  return { day, month };
}

function eventDateTimeLabel(event: Event) {
  const date = new Date(event.date);
  const dateLabel = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
  return `${dateLabel} · ${event.time}`;
}

function eventPriceLabel(event: Event) {
  if (event.pricePerPerson <= 0) return "Entrada libre";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(event.pricePerPerson);
}

function eventSpotsLeft(event: Event) {
  return Math.max(event.maxCapacity - event.currentRegistrations, 0);
}

function eventCtaPath(event: Event) {
  return event.type === "dinner-with-strangers"
    ? "/reservar/cena-con-desconocidos"
    : `/reservar/eventos/${event._id}`;
}

function nextDayChips(count: number) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const weekday = new Intl.DateTimeFormat("es-CO", { weekday: "short" })
      .format(date)
      .replace(".", "");
    const label = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()}`;
    days.push({ label, date });
  }
  return days;
}

export function HomePage() {
  const navigate = useNavigate();
  const [menuRecipes, setMenuRecipes] = useState<Recipe[]>([]);
  const [publicEvents, setPublicEvents] = useState<Event[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const [bookingDay, setBookingDay] = useState(0);
  const [bookingHour, setBookingHour] = useState(2);
  const [bookingPeople, setBookingPeople] = useState(2);

  useEffect(() => {
    publicMenuApi
      .get()
      .then((res) => setMenuRecipes(res.data.recipes))
      .catch(() => setMenuRecipes([]));
  }, []);

  useEffect(() => {
    publicApi
      .getEvents()
      .then((res) => setPublicEvents(res.data))
      .catch(() => setPublicEvents([]));
  }, []);

  const menuItems = useMemo(
    () =>
      menuRecipes.slice(0, 6).map((recipe) => ({
        id: recipe._id,
        name: recipe.name,
        desc:
          recipe.description ||
          `${recipe.variants.length} variante(s) disponibles en barra`,
        price: recipePriceLabel(recipe),
      })),
    [menuRecipes],
  );

  const calendarEvents = publicEvents
    .filter((event) => event.type !== "dinner-with-strangers")
    .slice(0, 3);
  const dinnerEvent =
    publicEvents.find((event) => event.type === "dinner-with-strangers") ??
    null;

  const bookingDays = useMemo(() => nextDayChips(5), []);
  const bookingSummary = `${bookingDays[bookingDay].label} · ${bookingHours[bookingHour]} · ${
    bookingPeople === 1 ? "1 persona" : `${bookingPeople} personas`
  }`;

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterStatus("loading");
    setNewsletterMessage("");

    try {
      await publicApi.subscribeNewsletter({ email: newsletterEmail });
      setNewsletterStatus("success");
      setNewsletterMessage("Listo. Te apuntamos al boletín mensual.");
      setNewsletterEmail("");
    } catch {
      setNewsletterStatus("error");
      setNewsletterMessage(
        "No pudimos registrar el correo. Inténtalo de nuevo.",
      );
    }
  };

  return (
    <div className="li-home">
      <style>{homeStyles}</style>

      <header className="li-header">
        <Link to="/" className="li-brand">
          <img
            src="/images/brand/wordmark-original-trim.png"
            alt="La Isla · Café Picnic"
            className="li-brand-mark"
          />
        </Link>
        <nav className="li-nav">
          <a href="#razones">Espacio</a>
          <Link to="/menu">Carta</Link>
          <a href="#eventos">Eventos</a>
          <a href="#cena">La cena</a>
          <a href="#visita">Visita</a>
        </nav>
        <Link to="/reservar/mesa" className="li-header-cta">
          Reservar mesa <span>→</span>
        </Link>
      </header>

      <main>
        <section className="li-hero">
          <div className="li-hero-sunrays" aria-hidden="true" />
          <div className="li-hero-inner">
            <div className="li-hero-copy">
              <p className="li-pill">04°26′N · 75°14′W · Ibagué</p>
              <h1 className="li-hero-title">
                Baja el
                <br />
                volumen
                <br />
                <span>de la ciudad</span>
              </h1>
              <p className="li-hero-desc">
                Café de especialidad, mesas largas, patio con sombra y planes
                para conocer gente. Una isla de tres cuadras en pleno barrio
                Belén.
              </p>
              <div className="li-hero-actions">
                <Link to="/reservar/mesa" className="li-btn-primary">
                  Reservar mesa →
                </Link>
                <Link
                  to="/reservar/cena-con-desconocidos"
                  className="li-btn-ghost"
                >
                  Cena con desconocidos
                </Link>
              </div>
              <div className="li-hero-stats">
                <div>
                  <strong>9am–11pm</strong>
                  <span>Vie y sáb</span>
                </div>
                <div>
                  <strong>4h</strong>
                  <span>Mesa sin culpa</span>
                </div>
                <div>
                  <strong>Tolima</strong>
                  <span>Grano de origen</span>
                </div>
              </div>
            </div>
            <div className="li-hero-media">
              <div className="li-hero-blob" aria-hidden="true" />
              <div className="li-hero-photo">
                <ProgressiveImage
                  className="image-fill"
                  src={homeImages.hero.src}
                  alt={homeImages.hero.alt}
                  loading="eager"
                />
              </div>
            </div>
          </div>
          <div className="li-scallop" aria-hidden="true">
            <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path d="M0 30C240 8 470 50 720 46 970 42 1210 10 1440 24V100H0Z" fill="#F5E6D3" />
            </svg>
          </div>
        </section>

        <section className="li-reasons" id="razones">
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
            {[
              { n: "N.º 01", tag: "Barra", title: "Café de origen", desc: "Grano del Tolima, tostión de la semana escrita en la pizarra y métodos fríos para el calor de Ibagué.", img: homeImages.reasons[0] },
              { n: "N.º 02", tag: "Mesas", title: "Isla de trabajo", desc: "Enchufe en cada mesa, WiFi que aguanta la videollamada y permiso oficial para quedarte cuatro horas.", img: homeImages.reasons[1] },
              { n: "N.º 03", tag: "Planes", title: "Vida social", desc: "Cine bajo el cobertizo, catas guiadas, domingos de picnic y la cena donde nadie se conoce.", img: homeImages.reasons[2], extra: "li-reason-card-3" },
            ].map((reason) => (
              <article className={`li-reason-card ${reason.extra ?? ""}`} key={reason.title}>
                <div className="li-reason-photo">
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
        </section>

        <section className="li-menu" id="carta">
          <div className="li-menu-grid">
            <div>
              <p className="li-kicker">Carta corta a propósito</p>
              <h2 className="li-section-title">
                Lo que se pide
                <br />
                dos veces
              </h2>
              {menuItems.length > 0 ? (
                <div className="li-menu-list">
                  {menuItems.map((item) => (
                    <div className="li-menu-row" key={item.id}>
                      <span className="li-menu-row-name">{item.name}</span>
                      <span className="li-menu-row-desc">{item.desc}</span>
                      <strong className="li-menu-row-price">{item.price}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="li-empty-state">
                  La carta pública aparecerá aquí cuando haya productos activos
                  publicados desde el administrador.
                </div>
              )}
              <Link to="/menu" className="li-text-link">
                Ver la carta completa →
              </Link>
            </div>
            <div className="li-menu-aside">
              <div className="li-menu-feature-photo">
                <ProgressiveImage
                  className="image-fill"
                  src={homeImages.menuFeature.src}
                  alt={homeImages.menuFeature.alt}
                  loading="lazy"
                />
              </div>
              <div className="li-menu-roast">
                <p className="li-kicker">Tostión de la semana</p>
                <p className="li-menu-roast-title">
                  Finca La Palma
                  <br />· Anaime
                </p>
                <p>
                  Notas de panela, mandarina y almendra. Se acaba el domingo.
                </p>
              </div>
              <div className="li-menu-picnic-photo">
                <ProgressiveImage
                  className="image-fill"
                  src={homeImages.menuPicnic.src}
                  alt={homeImages.menuPicnic.alt}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="li-events" id="eventos">
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
          {calendarEvents.length > 0 ? (
            <div className="li-events-grid">
              {calendarEvents.map((event, index) => {
                const { day, month } = eventDateParts(event);
                const fallback =
                  homeImages.eventFallbacks[index % homeImages.eventFallbacks.length];
                return (
                  <Link
                    to={eventCtaPath(event)}
                    className="li-event-card"
                    key={event._id}
                  >
                    <div className="li-event-photo">
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
        </section>

        <section className="li-isleña">
          <div className="li-isleña-inner">
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
                    className="li-isleña-thumb"
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

        <section className="li-dinner" id="cena">
          <div className="li-dinner-inner">
            <div className="li-dinner-card-wrap">
              <div className="li-dinner-card">
                <div className="li-dinner-card-head">
                  <span className="li-dinner-avatar">
                    <img src="/images/brand/icono-color.png" alt="" />
                  </span>
                  <span>
                    <strong>laisla.cafe</strong>
                    <span>Ibagué · Barrio Belén</span>
                  </span>
                </div>
                <div className="li-dinner-photo">
                  <ProgressiveImage
                    className="image-fill"
                    src={homeImages.cena.src}
                    alt={homeImages.cena.alt}
                    loading="lazy"
                  />
                  <span className="li-dinner-photo-tag">Mesa 07 · 7:30 pm</span>
                  <span className="li-dinner-photo-filter">sin filtro</span>
                </div>
                <div className="li-dinner-card-icons" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M12 20.5C6 16.6 2.8 13.6 2.8 10.2A4.6 4.6 0 0112 7.9a4.6 4.6 0 019.2 2.3c0 3.4-3.2 6.4-9.2 10.3z" fill="#2B3FBE" /></svg>
                  <svg viewBox="0 0 24 24"><path d="M21 12.2c0 4.2-4 7.6-9 7.6-1 0-2-.1-2.9-.4L4 21l1.3-3.5A7 7 0 013 12.2c0-4.2 4-7.6 9-7.6s9 3.4 9 7.6z" stroke="#1A2480" strokeWidth="1.8" fill="none" strokeLinejoin="round" /></svg>
                  <span className="li-dinner-card-stat">1.248 personas guardaron esta mesa</span>
                </div>
                <p className="li-dinner-caption">
                  Seis desconocidos, tres tiempos y cero apellidos.{" "}
                  <span>#CenaConDesconocidos #ModoIsla</span>
                </p>
                <div className="li-dinner-card-features">
                  <div>
                    <span>👥</span>
                    <span>3 tiempos</span>
                  </div>
                  <div>
                    <span>❤</span>
                    <span>Algoritmo</span>
                  </div>
                  <div>
                    <span>◎</span>
                    <span>6 personas</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="li-dinner-copy">
              <p className="li-pill">La experiencia de la casa</p>
              <h2 className="li-dinner-title">
                No sabes
                <br />
                con quién
                <br />
                <span>vas a cenar</span>
              </h2>
              <p className="li-dinner-desc">
                Seis sillas, una mesa larga y ningún nombre por adelantado.
                Contestas un cuestionario de compatibilidad, nosotros armamos
                el grupo y tú apareces a las 7:30 pm sin saber nada más.
              </p>
              <ul className="li-dinner-features">
                {dinnerFeatures.map((feature) => (
                  <li key={feature}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="11" fill="#F5A623" />
                      <path d="M7 12.4l3.3 3.2L17 9" stroke="#1A2480" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="li-hero-actions">
                <Link
                  to="/reservar/cena-con-desconocidos"
                  className="li-btn-primary"
                >
                  Contestar el cuestionario →
                </Link>
              </div>
              <p className="li-dinner-meta">
                {dinnerEvent
                  ? `${eventDateTimeLabel(dinnerEvent)} · ${eventPriceLabel(dinnerEvent)}`
                  : "Último jueves de cada mes · $65.000 con tres tiempos"}
              </p>
            </div>
          </div>
        </section>

        <section className="li-booking" id="reserva">
          <div className="li-booking-sunrays" aria-hidden="true" />
          <div className="li-booking-inner">
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
                  {bookingPeople === 1
                    ? "1 persona"
                    : `${bookingPeople} personas`}
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
      </main>

      <footer className="li-footer" id="visita">
        <div className="li-footer-grid">
          <div>
            <img
              src="/images/brand/logo-principal-blanco.png"
              alt="La Isla · Café Picnic"
              className="li-footer-logo"
            />
            <p className="li-footer-desc">
              Café picnic en el corazón de Ibagué. Una pausa en medio del ruido,
              de 9 de la mañana hasta que se acabe la conversación.
            </p>
          </div>
          <nav className="li-footer-col">
            <p className="li-footer-col-title">La isla</p>
            <a href="#razones">El espacio</a>
            <Link to="/menu">La carta</Link>
            <a href="#eventos">Eventos</a>
            <Link to="/reservar/cena-con-desconocidos">
              Cena con desconocidos
            </Link>
          </nav>
          <div className="li-footer-col">
            <p className="li-footer-col-title">Visítanos</p>
            <span>
              Carrera 5 N.º 28-14
              <br />
              Barrio Belén · Ibagué
            </span>
            <span>Lun–Jue 9:00–21:00</span>
            <span>Vie–Sáb 9:00–23:00</span>
            <span>Dom 10:00–19:00</span>
          </div>
          <div className="li-footer-col">
            <p className="li-footer-col-title">Boletín · 1 vez al mes</p>
            <form
              className="li-newsletter-form"
              onSubmit={handleNewsletterSubmit}
            >
              <input
                type="email"
                placeholder="tu@correo.com"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                disabled={newsletterStatus === "loading"}
                required
              />
              <button type="submit" disabled={newsletterStatus === "loading"}>
                {newsletterStatus === "loading" ? "Enviando" : "Apuntarme"}
              </button>
            </form>
            {newsletterMessage && (
              <span className="li-newsletter-message">{newsletterMessage}</span>
            )}
            <span>hola@laisla.cafe · +57 300 000 0000 · @laisla.cafe</span>
          </div>
        </div>
        <div className="li-footer-bottom">
          <span>© {new Date().getFullYear()} La Isla · Café Picnic</span>
          <span>Hecho en Ibagué, Tolima</span>
        </div>
      </footer>
    </div>
  );
}

type ProgressiveImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
};

function ProgressiveImage({
  src,
  alt,
  className = "",
  loading = "lazy",
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const revealFrame = useRef<number>();

  useEffect(() => {
    setLoaded(false);
    return () => {
      if (revealFrame.current) window.cancelAnimationFrame(revealFrame.current);
    };
  }, [src]);

  function revealImage() {
    if (revealFrame.current) window.cancelAnimationFrame(revealFrame.current);
    revealFrame.current = window.requestAnimationFrame(() => {
      revealFrame.current = window.requestAnimationFrame(() => setLoaded(true));
    });
  }

  return (
    <span
      className={`progressive-image ${loaded ? "is-loaded" : ""} ${className}`}
      aria-busy={!loaded}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={revealImage}
      />
    </span>
  );
}

const homeStyles = `
.li-home {
  --li-blue: #2B3FBE;
  --li-dark: #1A2480;
  --li-yellow: #F5A623;
  --li-sand: #F5E6D3;
  --li-muted: rgba(26,36,128,.75);
  --li-rule: rgba(26,36,128,.2);
  font-family: "Nunito", system-ui, sans-serif;
  color: var(--li-dark);
  background: #FFFFFF;
}
.li-home a { text-decoration: none; }
.li-home h1, .li-home h2, .li-home h3, .li-home strong.li-display {
  font-family: "Caveat Brush", cursive;
  font-weight: 400;
  margin: 0;
}

/* — header — */
.li-header { position: sticky; top: 0; z-index: 30; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 24px; padding: 14px clamp(18px, 4vw, 48px); background: var(--li-sand); border-bottom: 1px solid rgba(26,36,128,.28); }
.li-brand { display: flex; align-items: center; }
.li-brand-mark { height: 44px; width: auto; display: block; }
.li-nav { display: flex; justify-content: center; gap: 28px; font-size: 14px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--li-dark); }
.li-nav a { color: var(--li-dark); }
.li-nav a:hover { color: var(--li-blue); }
.li-header-cta { display: inline-flex; align-items: center; gap: 9px; background: var(--li-blue); color: #fff; font-size: 14px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; padding: 13px 22px; border-radius: 999px; border: 1.5px solid rgba(26,36,128,.4); white-space: nowrap; }
.li-header-cta:hover { background: var(--li-dark); }

/* — shared — */
.li-kicker { margin: 0 0 14px; font-size: 13px; font-weight: 800; letter-spacing: .24em; text-transform: uppercase; color: var(--li-blue); font-family: "Nunito", sans-serif; }
.li-pill { display: inline-flex; align-items: center; margin: 0 0 26px; background: var(--li-yellow); color: var(--li-dark); font-size: 13px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; padding: 8px 14px; border-radius: 999px; font-family: "Nunito", sans-serif; }
.li-section-title { font-size: clamp(40px, 4.8vw, 64px); line-height: .95; letter-spacing: -.01em; }
.li-text-link { display: inline-flex; color: var(--li-dark); font-size: 14.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; border-bottom: 2px solid var(--li-yellow); padding-bottom: 5px; margin-top: 26px; font-family: "Nunito", sans-serif; }
.li-empty-state { border: 1px dashed var(--li-rule); border-radius: 8px; background: rgba(255,255,255,.5); color: var(--li-muted); padding: 22px; font-weight: 700; margin-top: 30px; }
.li-hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 34px; }
.li-btn-primary, .li-btn-ghost { display: inline-flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 17px 26px; border-radius: 999px; border: 2px solid transparent; font-family: "Nunito", sans-serif; }
.li-btn-primary { background: var(--li-yellow); color: var(--li-dark); }
.li-btn-primary:hover { background: #fff; }
.li-btn-ghost { border-color: rgba(245,230,211,.6); color: var(--li-sand); }
.li-btn-ghost:hover { border-color: var(--li-yellow); color: var(--li-yellow); }

/* — hero — */
.li-hero { position: relative; overflow: hidden; background: var(--li-blue); padding: clamp(46px, 6vw, 74px) clamp(20px, 5vw, 48px) clamp(64px, 9vw, 108px); scroll-margin-top: 90px; }
.li-hero-sunrays { position: absolute; left: 50%; top: -42%; width: 2400px; height: 2400px; transform: translateX(-50%); background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(26,36,128,.55) 0deg 5.2deg, rgba(26,36,128,0) 5.2deg 12deg); opacity: .9; pointer-events: none; }
.li-hero-inner { position: relative; display: grid; grid-template-columns: minmax(0,1fr) minmax(340px, 46%); gap: clamp(28px, 4vw, 56px); align-items: center; }
.li-hero-title { color: #fff; font-size: clamp(52px, 7.4vw, 104px); line-height: .9; margin-bottom: 10px; text-wrap: balance; }
.li-hero-title span { color: var(--li-yellow); }
.li-hero-desc { max-width: 470px; margin: 26px 0 0; font-size: 19px; line-height: 1.5; color: rgba(245,230,211,.92); }
.li-hero-stats { display: flex; gap: 26px; margin-top: 44px; padding-top: 24px; border-top: 2px solid rgba(245,230,211,.28); flex-wrap: wrap; }
.li-hero-stats strong { display: block; font-family: "Caveat Brush", cursive; font-weight: 400; font-size: 34px; color: var(--li-yellow); }
.li-hero-stats span { font-size: 13.5px; letter-spacing: .12em; text-transform: uppercase; color: rgba(245,230,211,.7); }
.li-hero-media { position: relative; padding: 10px 0; }
.li-hero-blob { position: absolute; left: 34px; top: 26px; width: 82%; height: 82%; border-radius: 58% 42% 47% 53% / 52% 48% 52% 48%; background: rgba(245,166,35,.85); }
.li-hero-photo { position: relative; height: clamp(320px, 42vw, 512px); width: clamp(320px, 42vw, 512px); max-width: 100%; margin: 0 auto; border-radius: 52% 48% 44% 56% / 50% 56% 44% 50%; overflow: hidden; border: 4px solid var(--li-sand); background: var(--li-dark); }
.li-scallop { position: absolute; left: 0; right: 0; bottom: -1px; height: 96px; line-height: 0; pointer-events: none; }
.li-scallop svg { display: block; width: 100%; height: 100%; }

/* — progressive image — */
.progressive-image { position: relative; display: block; overflow: hidden; isolation: isolate; background: linear-gradient(135deg, #F0E5D3 0%, #FFFFFF 44%, #E5D5BE 100%); }
.progressive-image::before { content: ""; position: absolute; inset: 0; z-index: 1; background: linear-gradient(110deg, rgba(255,255,255,0) 20%, rgba(255,255,255,.62) 46%, rgba(255,255,255,0) 72%); transform: translateX(-120%); animation: imageWash 1.35s ease-in-out infinite; opacity: 1; transition: opacity .55s ease .2s; pointer-events: none; }
.progressive-image::after { content: ""; position: absolute; inset: 0; z-index: 2; background: radial-gradient(circle at 28% 18%, rgba(245,166,35,.28), transparent 34%), linear-gradient(180deg, rgba(26,36,128,.05), rgba(26,36,128,.14)); opacity: 1; transition: opacity .85s ease .18s; pointer-events: none; }
.progressive-image img { display: block; width: 100%; height: 100%; object-fit: cover; opacity: 0; transform: scale(1.055); filter: saturate(.9) blur(22px); }
.progressive-image.is-loaded::before { opacity: 0; animation-play-state: paused; }
.progressive-image.is-loaded::after { opacity: 0; }
.progressive-image.is-loaded img { animation: imageReveal 1.25s cubic-bezier(.16,1,.3,1) both; }
.image-fill { position: absolute; inset: 0; width: 100%; height: 100%; }
@keyframes imageWash { to { transform: translateX(120%); } }
@keyframes imageReveal {
  0% { opacity: 0; transform: scale(1.055); filter: saturate(.9) blur(22px); }
  58% { opacity: .92; filter: saturate(.9) blur(5px); }
  100% { opacity: 1; transform: scale(1); filter: saturate(.9) blur(0); }
}

/* — reasons — */
.li-reasons { background: var(--li-sand); padding: clamp(56px, 8vw, 96px) clamp(20px, 5vw, 48px); }
.li-reasons-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; margin-bottom: 44px; }
.li-reasons-lead { max-width: 340px; margin: 0; font-size: 17px; line-height: 1.6; color: var(--li-muted); }
.li-reasons-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 22px; }
.li-reason-card { position: relative; background: var(--li-sand); border: 1.5px solid rgba(43,63,190,.55); border-radius: 18px; overflow: hidden; }
.li-reason-photo { position: relative; height: 210px; background: var(--li-blue); }
.li-reason-badge { position: absolute; left: 16px; top: 16px; background: var(--li-yellow); border: 2px solid #fff; color: var(--li-dark); font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; padding: 7px 14px; border-radius: 999px; font-family: "Nunito", sans-serif; }
.li-reason-body { padding: 22px 24px 28px; }
.li-reason-tag { margin: 0 0 8px; font-size: 13px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--li-blue); font-family: "Nunito", sans-serif; }
.li-reason-card h3 { font-size: 33px; line-height: 1; margin: 0 0 12px; }
.li-reason-card p { margin: 0; font-size: 16.5px; line-height: 1.6; color: var(--li-muted); }

/* — menu — */
.li-menu { background: #fff; padding: clamp(56px, 8vw, 96px) clamp(20px, 5vw, 48px); }
.li-menu-grid { display: grid; grid-template-columns: minmax(0,1fr) 400px; gap: 56px; align-items: start; }
.li-menu-list { margin-top: 34px; border-top: 1px solid rgba(26,36,128,.28); max-width: 760px; }
.li-menu-row { display: flex; align-items: baseline; gap: 16px; padding: 19px 0; border-bottom: 1px solid var(--li-rule); }
.li-menu-row-name { font-family: "Caveat Brush", cursive; font-weight: 400; font-size: 25px; color: var(--li-dark); white-space: nowrap; }
.li-menu-row-desc { flex: 1; font-size: 15.5px; color: var(--li-muted); }
.li-menu-row-price { font-family: "Caveat Brush", cursive; font-weight: 400; font-size: 24px; color: var(--li-blue); white-space: nowrap; }
.li-menu-aside { display: grid; gap: 18px; }
.li-menu-feature-photo { position: relative; height: 210px; border-radius: 22px 22px 0 0; overflow: hidden; border: 1.5px solid rgba(26,36,128,.35); border-bottom: 0; background: var(--li-blue); margin-bottom: -18px; }
.li-menu-roast { background: var(--li-yellow); border: 1.5px solid rgba(26,36,128,.35); border-radius: 0 0 22px 22px; padding: 22px 24px; }
.li-menu-roast-title { margin: 0; font-family: "Caveat Brush", cursive; font-weight: 400; font-size: 28px; line-height: 1; color: var(--li-dark); }
.li-menu-roast p:last-child { margin: 12px 0 0; font-size: 16px; line-height: 1.55; color: rgba(26,36,128,.8); }
.li-menu-picnic-photo { position: relative; height: 170px; border-radius: 20px; overflow: hidden; background: var(--li-blue); }

/* — events — */
.li-events { background: var(--li-sand); padding: clamp(56px, 8vw, 96px) clamp(20px, 5vw, 48px); border-top: 1px solid rgba(26,36,128,.28); scroll-margin-top: 90px; }
.li-events-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; margin-bottom: 40px; }
.li-events-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 22px; }
.li-event-card { display: block; background: #fff; color: var(--li-dark); border: 1.5px solid rgba(43,63,190,.5); border-radius: 20px; overflow: hidden; }
.li-event-photo { position: relative; height: 170px; background: var(--li-blue); }
.li-event-date { position: absolute; left: 16px; top: 16px; display: flex; align-items: baseline; gap: 6px; background: var(--li-yellow); border: 2px solid #fff; color: var(--li-dark); padding: 6px 13px; border-radius: 999px; }
.li-event-date strong { font-family: "Caveat Brush", cursive; font-weight: 400; font-size: 24px; line-height: 1; }
.li-event-date span { font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; font-family: "Nunito", sans-serif; }
.li-event-body { padding: 20px 22px 24px; }
.li-event-badge { display: inline-block; background: var(--li-sand); border: 1px solid rgba(26,36,128,.4); color: var(--li-dark); font-size: 11.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; font-family: "Nunito", sans-serif; }
.li-event-body h3 { font-size: 29px; line-height: 1; margin: 14px 0 8px; }
.li-event-body p { margin: 0; font-size: 15.5px; line-height: 1.5; color: var(--li-muted); }

/* — la isleña — */
.li-isleña { position: relative; overflow: hidden; background: var(--li-sand); border-top: 1px solid rgba(26,36,128,.28); padding: clamp(40px, 6vw, 56px) clamp(20px, 5vw, 48px) 0; }
.li-isleña-inner { display: grid; grid-template-columns: minmax(0,1fr) minmax(150px,200px) 390px; gap: 32px; align-items: end; max-width: 1240px; margin: 0 auto; min-height: 340px; }
.li-isleña-copy { padding-bottom: clamp(40px, 6vw, 64px); max-width: 620px; }
.li-isleña-title { margin: 0; font-family: "Caveat Brush", cursive; font-weight: 400; font-size: clamp(48px, 5.8vw, 78px); line-height: .92; color: var(--li-dark); }
.li-isleña-title span { color: var(--li-blue); }
.li-isleña-desc { margin: 18px 0 0; max-width: 420px; font-size: 18px; line-height: 1.6; color: var(--li-muted); }
.li-isleña-thumbs { display: flex; gap: 16px; margin-top: 26px; }
.li-isleña-thumb { position: relative; width: 170px; height: 130px; border-radius: 18px; overflow: hidden; }
.li-isleña-facts { display: flex; flex-direction: column; gap: 22px; padding: 6px 0 6px 24px; margin-bottom: clamp(40px, 6vw, 64px); border-left: 2px dashed rgba(26,36,128,.35); align-self: center; }
.li-isleña-fact span { display: block; }
.li-isleña-fact span:first-child { font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--li-blue); font-family: "Nunito", sans-serif; margin-bottom: 5px; }
.li-isleña-fact span:last-child { font-family: "Caveat Brush", cursive; font-weight: 400; font-size: 23px; line-height: 1.1; color: var(--li-dark); }
.li-isleña-mascot { display: block; width: 100%; height: auto; margin-bottom: -14px; align-self: end; }

/* — dinner — */
.li-dinner { position: relative; overflow: hidden; background: var(--li-dark); padding: clamp(56px, 8vw, 100px) clamp(20px, 5vw, 48px); scroll-margin-top: 90px; }
.li-dinner-inner { position: relative; display: grid; grid-template-columns: minmax(0,.95fr) minmax(0,1.05fr); gap: 56px; align-items: center; max-width: 1240px; margin: 0 auto; }
.li-dinner-title { color: #fff; font-size: clamp(44px, 5.8vw, 90px); line-height: .9; }
.li-dinner-title span { color: var(--li-yellow); }
.li-dinner-desc { max-width: 470px; margin: 26px 0 0; font-size: 19px; line-height: 1.55; color: rgba(245,230,211,.9); }
.li-dinner-features { display: grid; gap: 14px; margin: 30px 0 0; padding: 0; list-style: none; max-width: 470px; }
.li-dinner-features li { display: flex; gap: 12px; align-items: flex-start; }
.li-dinner-features svg { flex: none; width: 22px; height: 22px; margin-top: 2px; }
.li-dinner-features span:last-child { font-size: 18px; line-height: 1.5; color: rgba(245,230,211,.9); }
.li-dinner-meta { margin: 22px 0 0; font-size: 14px; letter-spacing: .12em; text-transform: uppercase; color: rgba(245,230,211,.55); }
.li-dinner-card-wrap { position: relative; padding: 16px 16px 16px 0; }
.li-dinner-card-wrap::before { content: ""; position: absolute; left: 16px; top: 16px; right: 0; bottom: 0; border-radius: 30px; background: rgba(245,166,35,.9); }
.li-dinner-card { position: relative; background: var(--li-sand); border-radius: 30px; overflow: hidden; }
.li-dinner-card-head { display: flex; align-items: center; gap: 11px; padding: 14px 16px; }
.li-dinner-avatar { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: #fff; border: 1.5px solid rgba(26,36,128,.25); overflow: hidden; flex: none; }
.li-dinner-avatar img { width: 22px; height: 22px; object-fit: contain; }
.li-dinner-card-head strong { display: block; font-size: 15px; font-weight: 800; color: var(--li-dark); font-family: "Nunito", sans-serif; }
.li-dinner-card-head span span { display: block; font-size: 13px; color: rgba(26,36,128,.6); font-family: "Nunito", sans-serif; }
.li-dinner-photo { position: relative; height: 420px; }
.li-dinner-photo-tag { position: absolute; left: 14px; top: 14px; background: rgba(26,36,128,.85); color: var(--li-sand); font-size: 12px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; padding: 6px 11px; border-radius: 999px; font-family: "Nunito", sans-serif; }
.li-dinner-photo-filter { position: absolute; right: 14px; bottom: 14px; background: var(--li-yellow); color: var(--li-dark); font-family: "Caveat Brush", cursive; font-size: 21px; padding: 5px 13px 3px; border-radius: 999px; transform: rotate(-3deg); }
.li-dinner-card-icons { display: flex; align-items: center; gap: 16px; padding: 13px 16px 0; color: var(--li-dark); }
.li-dinner-card-icons svg { width: 23px; height: 23px; }
.li-dinner-card-stat { flex: 1; text-align: right; font-size: 14.5px; font-weight: 800; color: rgba(26,36,128,.7); font-family: "Nunito", sans-serif; }
.li-dinner-caption { margin: 8px 16px 0; padding-bottom: 16px; font-size: 15.5px; line-height: 1.5; color: rgba(26,36,128,.7); font-family: "Nunito", sans-serif; }
.li-dinner-caption span { color: var(--li-blue); font-weight: 700; }
.li-dinner-card-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 16px; border-top: 1px dashed rgba(26,36,128,.28); background: #fff; }
.li-dinner-card-features div { display: grid; justify-items: center; gap: 7px; }
.li-dinner-card-features div span:first-child { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: rgba(43,63,190,.12); color: var(--li-blue); font-size: 18px; }
.li-dinner-card-features div span:last-child { font-size: 12.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--li-blue); font-family: "Nunito", sans-serif; }

/* — booking — */
.li-booking { position: relative; overflow: hidden; background: var(--li-yellow); padding: clamp(56px, 8vw, 96px) clamp(20px, 5vw, 48px); scroll-margin-top: 90px; }
.li-booking-sunrays { position: absolute; left: 50%; top: -70%; width: 1900px; height: 1900px; transform: translateX(-50%); background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,.3) 0deg 4.4deg, rgba(255,255,255,0) 4.4deg 11deg); pointer-events: none; }
.li-booking-inner { position: relative; display: grid; grid-template-columns: minmax(0,.95fr) 520px; gap: 56px; align-items: center; max-width: 1240px; margin: 0 auto; }
.li-booking-title { line-height: .9; }
.li-booking-desc { max-width: 420px; margin: 0; font-size: 18.5px; line-height: 1.55; color: rgba(26,36,128,.82); }
.li-booking-tags { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
.li-booking-tags span { background: #fff; border: 1.5px solid var(--li-dark); font-size: 13px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; padding: 8px 12px; border-radius: 999px; font-family: "Nunito", sans-serif; }
.li-booking-form { position: relative; z-index: 2; background: #fff; border: 1.5px solid rgba(26,36,128,.35); border-radius: 28px; padding: 32px; }
.li-booking-form-title { margin: 0 0 22px; font-family: "Caveat Brush", cursive; font-weight: 400; font-size: 28px; color: var(--li-dark); }
.li-booking-step-label { margin: 0 0 10px; font-size: 13px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; color: var(--li-blue); font-family: "Nunito", sans-serif; }
.li-chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
.li-chip-btn { flex: 1; min-width: 76px; padding: 12px 8px; border: 1.5px solid rgba(26,36,128,.4); border-radius: 999px; cursor: pointer; background: #fff; color: var(--li-dark); font-family: "Nunito", sans-serif; font-size: 14px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; }
.li-chip-btn.is-active { background: var(--li-blue); color: #fff; border-color: var(--li-blue); }
.li-people-row { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.li-people-btn { width: 46px; height: 46px; border: 1.5px solid rgba(26,36,128,.4); border-radius: 999px; background: var(--li-sand); color: var(--li-dark); font-size: 24px; font-weight: 800; cursor: pointer; }
.li-people-btn:hover { background: var(--li-yellow); }
.li-people-count { font-family: "Caveat Brush", cursive; font-weight: 400; font-size: 36px; min-width: 150px; text-align: center; }
.li-booking-submit { width: 100%; padding: 19px; border: 1.5px solid rgba(26,36,128,.4); border-radius: 999px; background: var(--li-blue); color: #fff; font-family: "Nunito", sans-serif; font-size: 16px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; }
.li-booking-submit:hover { background: var(--li-dark); }
.li-booking-summary { margin: 14px 0 0; font-size: 14.5px; line-height: 1.5; color: rgba(26,36,128,.65); }

/* — footer — */
.li-footer { background: var(--li-dark); padding: 64px clamp(20px, 5vw, 48px) 40px; color: var(--li-sand); scroll-margin-top: 20px; }
.li-footer-grid { display: grid; grid-template-columns: 1.3fr .8fr .8fr .9fr; gap: 40px; }
.li-footer-logo { height: 88px; width: auto; display: block; margin-bottom: 18px; }
.li-footer-desc { margin: 0; max-width: 280px; font-size: 16px; line-height: 1.6; color: rgba(245,230,211,.78); }
.li-footer-col { display: grid; gap: 12px; align-content: start; }
.li-footer-col-title { margin: 0 0 6px; font-size: 13px; font-weight: 800; letter-spacing: .22em; text-transform: uppercase; color: var(--li-yellow); font-family: "Nunito", sans-serif; }
.li-footer-col a, .li-footer-col span { font-size: 16px; color: rgba(245,230,211,.85); line-height: 1.5; }
.li-footer-col a:hover { color: var(--li-yellow); }
.li-newsletter-form { display: flex; border: 1.5px solid rgba(245,230,211,.7); border-radius: 999px; overflow: hidden; }
.li-newsletter-form input { flex: 1; min-width: 0; border: 0; background: transparent; padding: 13px 14px; color: var(--li-sand); font-family: "Nunito", sans-serif; font-size: 16px; outline: none; }
.li-newsletter-form input::placeholder { color: rgba(245,230,211,.55); }
.li-newsletter-form button { flex: none; white-space: nowrap; border: 0; border-left: 1.5px solid rgba(245,230,211,.7); background: var(--li-yellow); color: var(--li-dark); padding: 0 16px; font-family: "Nunito", sans-serif; font-size: 14px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
.li-newsletter-form button:hover { background: #fff; }
.li-newsletter-form button:disabled { opacity: .68; cursor: wait; }
.li-newsletter-message { font-size: 15px; color: var(--li-yellow); }
.li-footer-bottom { display: flex; justify-content: space-between; gap: 24px; margin-top: 44px; padding-top: 20px; border-top: 1px solid rgba(245,230,211,.28); font-size: 13.5px; letter-spacing: .16em; text-transform: uppercase; color: rgba(245,230,211,.6); font-family: "Nunito", sans-serif; }

/* — responsive: tablet — */
@media (max-width: 980px) {
  .li-nav { display: none; }
  .li-hero-inner, .li-dinner-inner, .li-booking-inner { grid-template-columns: 1fr; }
  .li-dinner-inner { grid-template-columns: 1fr; }
  .li-dinner-card-wrap { order: 2; }
  .li-booking-form { max-width: 520px; }
  .li-menu-grid { grid-template-columns: 1fr; }
  .li-menu-aside { max-width: 420px; }
  .li-reasons-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .li-reason-card-3 { grid-column: 1 / -1; }
  .li-events-grid { grid-template-columns: 1fr; }
  .li-isleña-inner { grid-template-columns: 1fr; }
  .li-isleña-facts { flex-direction: row; flex-wrap: wrap; gap: 20px 32px; padding: 20px 0 0; margin: 8px 0 0; border-left: 0; border-top: 2px dashed rgba(26,36,128,.35); align-self: auto; }
  .li-isleña-mascot { width: 220px; margin-left: auto; }
  .li-footer-grid { grid-template-columns: 1fr 1fr; }
}

/* — responsive: mobile — */
@media (max-width: 640px) {
  .li-header { padding: 12px 18px; }
  .li-brand-mark { height: 32px; }
  .li-header-cta { padding: 10px 14px; font-size: 13px; }
  .li-header-cta span { display: none; }
  .li-hero { padding: 34px 18px 58px; }
  .li-hero-title { font-size: 54px; }
  .li-hero-desc { font-size: 17px; }
  .li-hero-actions { flex-direction: column; }
  .li-hero-actions a { width: 100%; text-align: center; }
  .li-hero-stats { display: flex; }
  .li-hero-photo { height: 300px; width: 300px; margin-top: 12px; }
  .li-scallop { height: 44px; }
  .li-reasons-head { flex-direction: column; align-items: flex-start; gap: 16px; }
  .li-reasons-lead { display: none; }
  .li-reasons-grid { grid-template-columns: 1fr; }
  .li-menu-row { flex-wrap: wrap; }
  .li-menu-row-desc { flex: 1 1 100%; order: 3; }
  .li-events-grid { grid-template-columns: 1fr; }
  .li-isleña-thumbs { display: none; }
  .li-isleña-facts { gap: 16px 24px; }
  .li-isleña-fact span:last-child { font-size: 20px; }
  .li-isleña-mascot { width: 180px; }
  .li-dinner-photo { height: 240px; }
  .li-dinner-card-features { display: none; }
  .li-dinner-caption { display: none; }
  .li-dinner-card-stat { text-align: left; }
  .li-booking-tags { display: none; }
  .li-chip-btn { min-width: 70px; padding: 12px 6px; font-size: 13px; }
  .li-booking-submit { padding: 18px 8px; font-size: 14.5px; letter-spacing: .06em; }
  .li-footer-grid { grid-template-columns: 1fr; }
  .li-footer-bottom { flex-direction: column; gap: 6px; }
}

@media (prefers-reduced-motion: reduce) {
  .progressive-image::before { animation: none; }
  .progressive-image.is-loaded img { animation: none; opacity: 1; transform: none; filter: none; }
}
`;
