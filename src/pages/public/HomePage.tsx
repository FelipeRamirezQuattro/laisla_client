import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ImgHTMLAttributes } from "react";
import { publicApi } from "../../api/public";
import { publicMenuApi } from "../../api/publicMenu";
import type { Event, Recipe, RecipeVariant } from "../../types";

const homeImages = {
  hero: {
    src: "/images/home/hero/barista-cafe-making-coffee-preparation-service-concept.jpg",
    alt: "Barista preparando cafe espresso en La Isla Cafe",
  },
  reasons: [
    {
      src: "/images/home/spaces/metal-large-coffee-maker-machine-pouring-coffee-into-metal-cup.jpg",
      alt: "Maquina de espresso preparando cafe",
    },
    {
      src: "/images/home/spaces/mocca-coffee-shop.jpg",
      alt: "Mesa de cafe para trabajar y conversar",
    },
    {
      src: "/images/home/spaces/waitress-serving-coffee.jpg",
      alt: "Mesera sirviendo cafe en mesa",
    },
  ],
  menuFeature: {
    src: "/images/home/hero/close-up-cup-cappuccino-coffee-chocolate-cake.jpg",
    alt: "Cappuccino servido con torta de chocolate",
  },
};

const dinnerTraits = [
  "Habla de cine",
  "Trasnochador",
  "Cocina de más",
  "Pregunta todo",
  "Viaja solo",
  "Escucha más",
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
          <a href="#cena">Experiencias</a>
        </nav>
        <Link to="/reservar/mesa" className="li-header-cta">
          Reservar mesa <span>→</span>
        </Link>
      </header>

      <main>
        <section className="li-hero">
          <div className="li-hero-sunrays" aria-hidden="true" />
          <div className="li-hero-dots" aria-hidden="true" />
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
              <div className="li-hero-photo">
                <ProgressiveImage
                  className="image-fill"
                  src={homeImages.hero.src}
                  alt={homeImages.hero.alt}
                  loading="eager"
                />
              </div>
              <img
                src="/images/brand/sello-color.png"
                alt="La Isla · Café Picnic"
                className="li-hero-seal"
              />
              <div className="li-hero-stamp">
                Sin prisa · <span>sin ruido</span>
              </div>
            </div>
          </div>
          <div className="li-scallop" aria-hidden="true" />
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
            <article className="li-reason-card">
              <div className="li-reason-meta">
                <span className="li-reason-n">N.º 01</span>
                <span className="li-reason-tag">Barra</span>
              </div>
              <div className="li-reason-photo">
                <ProgressiveImage
                  className="image-fill"
                  src={homeImages.reasons[0].src}
                  alt={homeImages.reasons[0].alt}
                  loading="lazy"
                />
              </div>
              <h3>Café de origen</h3>
              <p>
                Grano del Tolima, tostión de la semana escrita en la pizarra y
                métodos fríos para el calor de Ibagué.
              </p>
            </article>
            <article className="li-reason-card">
              <div className="li-reason-meta">
                <span className="li-reason-n">N.º 02</span>
                <span className="li-reason-tag">Mesas</span>
              </div>
              <div className="li-reason-photo">
                <ProgressiveImage
                  className="image-fill"
                  src={homeImages.reasons[1].src}
                  alt={homeImages.reasons[1].alt}
                  loading="lazy"
                />
              </div>
              <h3>Isla de trabajo</h3>
              <p>
                Enchufe en cada mesa, WiFi que aguanta la videollamada y permiso
                oficial para quedarte cuatro horas.
              </p>
            </article>
            <article className="li-reason-card li-reason-card-3">
              <div className="li-reason-meta">
                <span className="li-reason-n">N.º 03</span>
                <span className="li-reason-tag">Planes</span>
              </div>
              <div className="li-reason-photo">
                <ProgressiveImage
                  className="image-fill"
                  src={homeImages.reasons[2].src}
                  alt={homeImages.reasons[2].alt}
                  loading="lazy"
                />
              </div>
              <h3>Vida social</h3>
              <p>
                Cine bajo el cobertizo, catas guiadas, domingos de picnic y la
                cena donde nadie se conoce.
              </p>
            </article>
          </div>
        </section>

        <section className="li-menu" id="carta">
          <p className="li-kicker">Carta corta a propósito</p>
          <h2 className="li-section-title">
            Lo que se pide
            <br />
            dos veces
          </h2>
          {menuItems.length > 0 ? (
            <>
              <div className="li-menu-list">
                {menuItems.map((item) => (
                  <div className="li-menu-row" key={item.id}>
                    <span className="li-menu-row-name">{item.name}</span>
                    <span className="li-menu-row-leader" />
                    <span className="li-menu-row-desc">{item.desc}</span>
                    <strong className="li-menu-row-price">{item.price}</strong>
                  </div>
                ))}
              </div>
              <Link to="/menu" className="li-text-link">
                Ver la carta completa →
              </Link>
            </>
          ) : (
            <div className="li-empty-state">
              La carta pública aparecerá aquí cuando haya productos activos
              publicados desde el administrador.
            </div>
          )}
          <div className="li-menu-feature">
            <div className="li-menu-feature-photo">
              <ProgressiveImage
                className="image-fill"
                src={homeImages.menuFeature.src}
                alt={homeImages.menuFeature.alt}
                loading="lazy"
              />
            </div>
            <div className="li-menu-feature-copy">
              <p className="li-kicker">Café de origen</p>
              <p className="li-menu-feature-title">
                Grano seleccionado del Tolima
              </p>
              <p>
                Tostión rotativa, notas frutales y dulces. Pregunta en barra
                cuál está sirviendo hoy.
              </p>
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
              {calendarEvents.map((event) => {
                const { day, month } = eventDateParts(event);
                return (
                  <Link
                    to={eventCtaPath(event)}
                    className="li-event-card"
                    key={event._id}
                  >
                    <div className="li-event-date">
                      <strong>{day}</strong>
                      <span>{month}</span>
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

        <section className="li-dinner" id="cena">
          <div className="li-dinner-dots" aria-hidden="true" />
          <div className="li-dinner-inner">
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
                Contestas un cuestionario de compatibilidad, nosotros armamos el
                grupo y tú apareces sin saber nada más.
              </p>
              <div className="li-hero-actions">
                <Link
                  to="/reservar/cena-con-desconocidos"
                  className="li-btn-primary"
                >
                  Contestar el cuestionario →
                </Link>
                <a href="#cena" className="li-btn-ghost">
                  Cómo funciona
                </a>
              </div>
              <p className="li-dinner-meta">
                {dinnerEvent
                  ? `${eventDateTimeLabel(dinnerEvent)} · ${eventPriceLabel(dinnerEvent)}`
                  : "Último jueves de cada mes · $65.000 con tres tiempos"}
              </p>
            </div>
            <div className="li-dinner-card-wrap">
              <div className="li-dinner-card">
                <div className="li-dinner-card-head">
                  <span>Mesa · próxima cena</span>
                  <span>6 sillas</span>
                </div>
                <div className="li-dinner-chips">
                  {dinnerTraits.map((trait, index) => (
                    <div
                      className={`li-dinner-chip ${index >= 3 ? "li-dinner-chip-extra" : ""}`}
                      key={trait}
                    >
                      <div
                        className={`li-dinner-chip-mark ${index % 2 ? "alt" : ""}`}
                      >
                        ?
                      </div>
                      <span className="li-dinner-chip-label">{trait}</span>
                    </div>
                  ))}
                </div>
                <p className="li-dinner-note">
                  Los nombres se revelan en la mesa. Lo único que sabes antes:
                  que el algoritmo dijo que se iban a caer bien.
                </p>
              </div>
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

      <footer className="li-footer">
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
  --li-muted: rgba(26,36,128,.72);
  --li-rule: rgba(26,36,128,.2);
  font-family: "DM Sans", system-ui, sans-serif;
  color: var(--li-dark);
  background: #FFFFFF;
}
.li-home a { text-decoration: none; }
.li-home h1, .li-home h2, .li-home h3 {
  font-family: "Archivo", system-ui, sans-serif;
  font-stretch: 120%;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0;
}

/* — header — */
.li-header { position: sticky; top: 0; z-index: 30; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 24px; padding: 18px clamp(18px, 4vw, 48px); background: var(--li-sand); border-bottom: 2px solid var(--li-dark); }
.li-brand { display: flex; align-items: center; }
.li-brand-mark { height: 72px; width: auto; display: block; }
.li-nav { display: flex; justify-content: center; gap: 28px; font-size: 12px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--li-dark); }
.li-nav a { color: var(--li-dark); }
.li-nav a:hover { color: var(--li-blue); }
.li-header-cta { display: inline-flex; align-items: center; gap: 8px; background: var(--li-yellow); color: var(--li-dark); font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; padding: 12px 20px; border-radius: 999px; border: 2px solid var(--li-dark); white-space: nowrap; }
.li-header-cta:hover { background: #fff; }

/* — shared — */
.li-kicker { margin: 0 0 12px; font-size: 11px; font-weight: 800; letter-spacing: .24em; text-transform: uppercase; color: var(--li-blue); }
.li-pill { display: inline-flex; align-items: center; margin: 0 0 22px; background: var(--li-yellow); color: var(--li-dark); font-size: 11px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; padding: 8px 14px; border-radius: 999px; }
.li-section-title { font-size: clamp(34px, 4.4vw, 58px); line-height: .88; letter-spacing: -.02em; }
.li-text-link { display: inline-flex; color: var(--li-dark); font-size: 12.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; border-bottom: 2px solid var(--li-yellow); padding-bottom: 4px; margin-top: 18px; }
.li-empty-state { border: 1px dashed var(--li-rule); border-radius: 8px; background: rgba(255,255,255,.5); color: var(--li-muted); padding: 22px; font-weight: 700; }
.li-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
.li-btn-primary, .li-btn-ghost { display: inline-flex; align-items: center; gap: 9px; font-size: 13.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 15px 24px; border-radius: 999px; border: 2px solid transparent; }
.li-btn-primary { background: var(--li-yellow); color: var(--li-dark); }
.li-btn-primary:hover { background: #fff; }
.li-btn-ghost { border-color: rgba(245,230,211,.55); color: var(--li-sand); }
.li-btn-ghost:hover { border-color: var(--li-yellow); color: var(--li-yellow); }

/* — hero — */
.li-hero { position: relative; overflow: hidden; background: var(--li-blue); padding: clamp(46px, 6vw, 74px) clamp(20px, 5vw, 48px) clamp(64px, 9vw, 108px); }
.li-hero-sunrays { position: absolute; left: 50%; top: -42%; width: 2200px; height: 2200px; transform: translateX(-50%); background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(26,36,128,.55) 0deg 5.2deg, rgba(26,36,128,0) 5.2deg 12deg); opacity: .9; pointer-events: none; }
.li-hero-dots { position: absolute; left: -160px; bottom: -520px; width: 1100px; height: 1100px; border-radius: 50%; background: repeating-radial-gradient(circle at 50% 50%, rgba(245,166,35,0) 0 80px, rgba(245,166,35,.35) 80px 84px); pointer-events: none; }
.li-hero-inner { position: relative; display: grid; grid-template-columns: minmax(0,1fr) minmax(340px, 46%); gap: clamp(28px, 4vw, 56px); align-items: center; }
.li-hero-title { color: #fff; font-size: clamp(44px, 7.2vw, 100px); line-height: .82; letter-spacing: -.03em; margin-bottom: 8px; text-wrap: balance; }
.li-hero-title span { color: var(--li-yellow); }
.li-hero-desc { max-width: 470px; margin: 26px 0 0; font-size: 17.5px; line-height: 1.5; color: rgba(245,230,211,.92); }
.li-hero-stats { display: flex; gap: 26px; margin-top: 40px; padding-top: 22px; border-top: 2px solid rgba(245,230,211,.28); flex-wrap: wrap; }
.li-hero-stats strong { display: block; font-family: "Archivo", system-ui, sans-serif; font-stretch: 118%; font-weight: 800; font-size: 27px; color: var(--li-yellow); }
.li-hero-stats span { font-size: 11.5px; letter-spacing: .12em; text-transform: uppercase; color: rgba(245,230,211,.7); }
.li-hero-media { position: relative; }
.li-hero-photo { position: relative; height: clamp(320px, 42vw, 480px); border: 3px solid var(--li-sand); border-radius: 220px 220px 16px 16px; overflow: hidden; background: var(--li-dark); }
.li-hero-seal { position: absolute; left: -46px; bottom: 32px; width: 148px; height: 148px; background: var(--li-sand); border-radius: 50%; padding: 9px; box-sizing: border-box; box-shadow: 0 16px 34px rgba(26,36,128,.3); }
.li-hero-stamp { position: absolute; right: -14px; top: -14px; background: var(--li-sand); border: 2px solid var(--li-dark); padding: 10px 14px; transform: rotate(6deg); font-size: 10.5px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: var(--li-dark); }
.li-hero-stamp span { color: var(--li-blue); }
.li-scallop { position: absolute; left: 0; right: 0; bottom: 0; height: 26px; background: radial-gradient(circle at 22px 26px, var(--li-sand) 20px, rgba(245,230,211,0) 21px) repeat-x; background-size: 44px 26px; }

/* — progressive image — */
.progressive-image { position: relative; display: block; overflow: hidden; isolation: isolate; background: linear-gradient(135deg, #F0E5D3 0%, #FFFFFF 44%, #E5D5BE 100%); }
.progressive-image::before { content: ""; position: absolute; inset: 0; z-index: 1; background: linear-gradient(110deg, rgba(255,255,255,0) 20%, rgba(255,255,255,.62) 46%, rgba(255,255,255,0) 72%); transform: translateX(-120%); animation: imageWash 1.35s ease-in-out infinite; opacity: 1; transition: opacity .55s ease .2s; pointer-events: none; }
.progressive-image::after { content: ""; position: absolute; inset: 0; z-index: 2; background: radial-gradient(circle at 28% 18%, rgba(245,166,35,.28), transparent 34%), linear-gradient(180deg, rgba(26,36,128,.05), rgba(26,36,128,.14)); opacity: 1; transition: opacity .85s ease .18s; pointer-events: none; }
.progressive-image img { display: block; width: 100%; height: 100%; object-fit: cover; opacity: 0; transform: scale(1.055); filter: blur(22px) saturate(.85); }
.progressive-image.is-loaded::before { opacity: 0; animation-play-state: paused; }
.progressive-image.is-loaded::after { opacity: 0; }
.progressive-image.is-loaded img { animation: imageReveal 1.25s cubic-bezier(.16,1,.3,1) both; }
.image-fill { position: absolute; inset: 0; width: 100%; height: 100%; }
@keyframes imageWash { to { transform: translateX(120%); } }
@keyframes imageReveal {
  0% { opacity: 0; transform: scale(1.055); filter: blur(22px) saturate(.85); }
  58% { opacity: .92; filter: blur(5px) saturate(.95); }
  100% { opacity: 1; transform: scale(1); filter: blur(0) saturate(1); }
}

/* — reasons — */
.li-reasons { background: var(--li-sand); padding: clamp(56px, 8vw, 96px) clamp(20px, 5vw, 48px); }
.li-reasons-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; margin-bottom: 44px; }
.li-reasons-lead { max-width: 340px; margin: 0; font-size: 15.5px; line-height: 1.6; color: var(--li-muted); }
.li-reasons-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 22px; }
.li-reason-card { background: #fff; border: 2px solid var(--li-dark); padding: 22px 22px 26px; }
.li-reason-meta { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
.li-reason-n { font-family: "Archivo", system-ui, sans-serif; font-stretch: 118%; font-weight: 800; font-size: 14px; color: var(--li-blue); }
.li-reason-tag { font-size: 10.5px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--li-muted); }
.li-reason-photo { position: relative; height: 190px; border-radius: 130px 130px 8px 8px; overflow: hidden; background: var(--li-blue); }
.li-reason-card h3 { font-size: 27px; line-height: 1; margin: 20px 0 10px; }
.li-reason-card p { margin: 0; font-size: 14.5px; line-height: 1.6; color: var(--li-muted); }

/* — menu — */
.li-menu { background: #fff; padding: clamp(56px, 8vw, 96px) clamp(20px, 5vw, 48px); }
.li-menu-list { margin-top: 30px; border-top: 2px solid var(--li-dark); max-width: 760px; }
.li-menu-row { display: flex; align-items: baseline; gap: 16px; padding: 18px 0; border-bottom: 1px solid var(--li-rule); }
.li-menu-row-name { font-family: "Archivo", system-ui, sans-serif; font-stretch: 116%; font-weight: 800; font-size: 20px; text-transform: uppercase; white-space: nowrap; }
.li-menu-row-leader { flex: 1; border-bottom: 1.5px dotted rgba(26,36,128,.35); align-self: center; }
.li-menu-row-desc { font-size: 12.5px; color: var(--li-muted); max-width: 260px; }
.li-menu-row-price { font-family: "Archivo", system-ui, sans-serif; font-stretch: 116%; font-size: 19px; color: var(--li-blue); white-space: nowrap; }
.li-menu-feature { display: grid; grid-template-columns: 200px 1fr; gap: 22px; align-items: stretch; max-width: 760px; margin-top: 34px; border: 2px solid var(--li-dark); }
.li-menu-feature-photo { position: relative; min-height: 140px; background: var(--li-blue); }
.li-menu-feature-copy { padding: 18px 20px 18px 0; }
.li-menu-feature-title { margin: 4px 0 8px; font-family: "Archivo", system-ui, sans-serif; font-stretch: 114%; font-weight: 800; font-size: 21px; line-height: 1.1; text-transform: uppercase; }
.li-menu-feature-copy p:last-child { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--li-muted); }

/* — events — */
.li-events { background: var(--li-sand); padding: clamp(56px, 8vw, 96px) clamp(20px, 5vw, 48px); border-top: 2px solid var(--li-dark); }
.li-events-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; margin-bottom: 40px; }
.li-events-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 22px; }
.li-event-card { display: grid; grid-template-columns: 92px 1fr; background: #fff; color: var(--li-dark); border: 2px solid var(--li-dark); }
.li-event-date { background: var(--li-blue); color: var(--li-sand); padding: 18px 10px; text-align: center; border-right: 2px dashed rgba(245,230,211,.5); }
.li-event-date strong { display: block; font-family: "Archivo", system-ui, sans-serif; font-stretch: 118%; font-weight: 800; font-size: 40px; line-height: .85; }
.li-event-date span { display: block; font-size: 10.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; margin-top: 6px; }
.li-event-body { padding: 18px; }
.li-event-badge { display: inline-block; background: var(--li-yellow); color: var(--li-dark); font-size: 9.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; padding: 4px 9px; border-radius: 999px; }
.li-event-body h3 { font-size: 22px; line-height: 1.02; margin: 13px 0 7px; }
.li-event-body p { margin: 0; font-size: 13px; line-height: 1.5; color: var(--li-muted); }

/* — dinner — */
.li-dinner { position: relative; overflow: hidden; background: var(--li-dark); padding: clamp(56px, 8vw, 100px) clamp(20px, 5vw, 48px); }
.li-dinner-dots { position: absolute; right: -220px; top: -220px; width: 800px; height: 800px; border-radius: 50%; background: repeating-radial-gradient(circle at 50% 50%, rgba(245,166,35,0) 0 58px, rgba(245,166,35,.22) 58px 61px); pointer-events: none; }
.li-dinner-inner { position: relative; display: grid; grid-template-columns: minmax(0,1.05fr) minmax(0,.95fr); gap: 56px; align-items: center; }
.li-dinner-title { color: #fff; font-size: clamp(38px, 5.6vw, 76px); line-height: .84; letter-spacing: -.03em; }
.li-dinner-title span { color: var(--li-yellow); }
.li-dinner-desc { max-width: 470px; margin: 24px 0 0; font-size: 17px; line-height: 1.55; color: rgba(245,230,211,.9); }
.li-dinner-meta { margin: 20px 0 0; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: rgba(245,230,211,.55); }
.li-dinner-card { position: relative; background: var(--li-blue); border: 3px solid var(--li-sand); padding: 30px 28px 28px; }
.li-dinner-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; font-size: 10.5px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
.li-dinner-card-head span:first-child { color: var(--li-sand); }
.li-dinner-card-head span:last-child { color: var(--li-yellow); }
.li-dinner-chips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.li-dinner-chip { text-align: center; }
.li-dinner-chip-mark { height: 78px; border-radius: 999px 999px 6px 6px; background: var(--li-sand); display: grid; place-items: center; font-family: "Archivo", system-ui, sans-serif; font-stretch: 120%; font-weight: 800; font-size: 32px; color: var(--li-blue); }
.li-dinner-chip-mark.alt { background: var(--li-yellow); color: var(--li-dark); }
.li-dinner-chip-label { display: block; margin-top: 8px; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: rgba(245,230,211,.85); }
.li-dinner-note { margin: 22px 0 0; padding-top: 16px; border-top: 2px dashed rgba(245,230,211,.4); font-size: 13px; line-height: 1.5; color: rgba(245,230,211,.85); }

/* — booking — */
.li-booking { position: relative; overflow: hidden; background: var(--li-yellow); padding: clamp(56px, 8vw, 96px) clamp(20px, 5vw, 48px); }
.li-booking-sunrays { position: absolute; left: 50%; top: -70%; width: 1800px; height: 1800px; transform: translateX(-50%); background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,.32) 0deg 4.4deg, rgba(255,255,255,0) 4.4deg 11deg); pointer-events: none; }
.li-booking-inner { position: relative; display: grid; grid-template-columns: minmax(0,.95fr) 520px; gap: 56px; align-items: center; }
.li-booking-title { line-height: .85; }
.li-booking-desc { max-width: 420px; margin: 0; font-size: 16.5px; line-height: 1.55; color: rgba(26,36,128,.82); }
.li-booking-tags { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
.li-booking-tags span { background: #fff; border: 1.5px solid var(--li-dark); font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; padding: 8px 12px; border-radius: 999px; }
.li-booking-form { background: #fff; border: 3px solid var(--li-dark); padding: 28px; }
.li-booking-form-title { margin: 0 0 20px; font-family: "Archivo", system-ui, sans-serif; font-stretch: 118%; font-weight: 800; font-size: 24px; text-transform: uppercase; }
.li-booking-step-label { margin: 0 0 10px; font-size: 11px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; color: var(--li-blue); }
.li-chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.li-chip-btn { flex: 1; min-width: 76px; padding: 11px 8px; border: 2px solid var(--li-dark); border-radius: 6px; cursor: pointer; background: #fff; color: var(--li-dark); font-family: "DM Sans", sans-serif; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.li-chip-btn.is-active { background: var(--li-blue); color: #fff; }
.li-people-row { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
.li-people-btn { width: 46px; height: 46px; border: 2px solid var(--li-dark); border-radius: 999px; background: var(--li-sand); color: var(--li-dark); font-size: 22px; font-weight: 800; cursor: pointer; }
.li-people-btn:hover { background: var(--li-yellow); }
.li-people-count { font-family: "Archivo", system-ui, sans-serif; font-stretch: 120%; font-weight: 800; font-size: 30px; min-width: 150px; text-align: center; }
.li-booking-submit { width: 100%; padding: 18px; border: 2px solid var(--li-dark); border-radius: 999px; background: var(--li-blue); color: #fff; font-family: "DM Sans", sans-serif; font-size: 13.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; }
.li-booking-submit:hover { background: var(--li-dark); }
.li-booking-summary { margin: 14px 0 0; font-size: 12.5px; line-height: 1.5; color: rgba(26,36,128,.65); }

/* — footer — */
.li-footer { background: var(--li-dark); padding: 56px clamp(20px, 5vw, 48px) 34px; color: var(--li-sand); }
.li-footer-grid { display: grid; grid-template-columns: 1.3fr .8fr .8fr .9fr; gap: 36px; }
.li-footer-logo { height: 88px; width: auto; display: block; margin-bottom: 16px; }
.li-footer-desc { margin: 0; max-width: 280px; font-size: 14px; line-height: 1.6; color: rgba(245,230,211,.78); }
.li-footer-col { display: grid; gap: 11px; align-content: start; }
.li-footer-col-title { margin: 0 0 4px; font-size: 11px; font-weight: 800; letter-spacing: .22em; text-transform: uppercase; color: var(--li-yellow); }
.li-footer-col a, .li-footer-col span { font-size: 14px; color: rgba(245,230,211,.85); line-height: 1.5; }
.li-footer-col a:hover { color: var(--li-yellow); }
.li-newsletter-form { display: flex; border: 2px solid var(--li-sand); }
.li-newsletter-form input { flex: 1; min-width: 0; border: 0; background: transparent; padding: 12px 13px; color: var(--li-sand); font-family: "DM Sans", sans-serif; font-size: 13.5px; outline: none; }
.li-newsletter-form input::placeholder { color: rgba(245,230,211,.55); }
.li-newsletter-form button { border: 0; border-left: 2px solid var(--li-sand); background: var(--li-yellow); color: var(--li-dark); padding: 0 15px; font-family: "DM Sans", sans-serif; font-size: 11.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }
.li-newsletter-form button:hover { background: #fff; }
.li-newsletter-form button:disabled { opacity: .68; cursor: wait; }
.li-newsletter-message { font-size: 12.5px; color: var(--li-yellow); }
.li-footer-bottom { display: flex; justify-content: space-between; gap: 24px; margin-top: 40px; padding-top: 18px; border-top: 1px solid rgba(245,230,211,.28); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: rgba(245,230,211,.6); }

/* — responsive: tablet — */
@media (max-width: 980px) {
  .li-nav { display: none; }
  .li-header { grid-template-columns: auto 1fr auto; }
  .li-hero-inner, .li-dinner-inner, .li-booking-inner { grid-template-columns: 1fr; }
  .li-booking-form { max-width: 520px; }
  .li-reasons-grid, .li-events-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .li-reason-card-3 { display: none; }
  .li-events-grid { grid-template-columns: 1fr; }
  .li-menu-feature { grid-template-columns: 1fr; }
  .li-menu-feature-photo { height: 160px; }
  .li-footer-grid { grid-template-columns: 1fr 1fr; }
}

/* — responsive: mobile (matches 1d) — */
@media (max-width: 640px) {
  .li-header { padding: 16px 18px; }
  .li-brand-mark { height: 47px; }
  .li-header-cta { padding: 10px 14px; font-size: 11px; }
  .li-header-cta span { display: none; }
  .li-hero { padding: 34px 18px 42px; }
  .li-hero-title { font-size: 46px; }
  .li-hero-desc { font-size: 15px; }
  .li-hero-actions { flex-direction: column; }
  .li-hero-actions a { width: 100%; text-align: center; }
  .li-hero-stats { display: none; }
  .li-hero-photo { height: 240px; border-radius: 120px 120px 10px 10px; margin-top: 24px; }
  .li-hero-seal { width: 84px; height: 84px; left: auto; right: 12px; bottom: 12px; }
  .li-hero-stamp { display: none; }
  .li-reasons-head { flex-direction: column; align-items: flex-start; gap: 16px; }
  .li-reasons-lead { display: none; }
  .li-reasons-grid { grid-template-columns: 1fr; }
  .li-reason-card-3 { display: none; }
  .li-menu-row { flex-wrap: wrap; }
  .li-menu-row-name { white-space: normal; flex: 1 1 100%; }
  .li-menu-row-leader { display: none; }
  .li-menu-row-price { margin-left: auto; }
  .li-events-grid { grid-template-columns: 1fr; }
  .li-dinner-chip:nth-child(n+4) { display: none; }
  .li-dinner-chip-label { display: none; }
  .li-dinner-chips { grid-template-columns: repeat(3, 1fr); }
  .li-dinner-chip-mark { height: 66px; font-size: 26px; }
  .li-booking-tags { display: none; }
  .li-chip-btn { min-width: 62px; font-size: 11px; }
  .li-booking-submit { padding: 18px 10px; }
  .li-footer-grid { grid-template-columns: 1fr; }
  .li-footer-bottom { flex-direction: column; gap: 6px; }
}

@media (prefers-reduced-motion: reduce) {
  .progressive-image::before { animation: none; }
  .progressive-image.is-loaded img { animation: none; opacity: 1; transform: none; filter: none; }
}
`;
