import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Coffee,
  Laptop,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import type { FormEvent, ImgHTMLAttributes, ReactNode } from "react";
import { PublicNavbar } from "../../components/layout/PublicNavbar";
import { publicApi } from "../../api/public";
import { publicMenuApi } from "../../api/publicMenu";
import type {
  Event,
  Recipe,
  RecipeCategoryOption,
  RecipeVariant,
} from "../../types";

type MenuColumn = {
  title: string;
  ix: string;
  items: Array<{
    name: string;
    desc: string;
    price: string;
    imageUrl?: string;
  }>;
};

const homeImages = {
  hero: [
    {
      src: "/images/home/hero/barista-cafe-making-coffee-preparation-service-concept.jpg",
      alt: "Barista preparando cafe espresso en La Isla Cafe",
    },
    {
      src: "/images/home/hero/close-up-cup-cappuccino-coffee-chocolate-cake.jpg",
      alt: "Cappuccino servido con torta de chocolate",
    },
    {
      src: "/images/home/hero/mocca-coffee-shop%20(1).jpg",
      alt: "Mocca caliente en mesa de cafe",
    },
  ],
  spaces: [
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
  dinner: {
    src: "/images/home/features/close-up-delicious-healthy-breakfast.jpg",
    alt: "Mesa servida para compartir desayuno y cafe",
  },
  picnic: {
    src: "/images/home/features/red-blanket-with-tea-cookies.jpg",
    alt: "Manta de picnic con bebida y galletas",
  },
  visit: {
    src: "/images/home/features/front-view-cup-coffee-with-milk.jpg",
    alt: "Cafe con leche servido en taza",
  },
};

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

export function HomePage() {
  const [menuRecipes, setMenuRecipes] = useState<Recipe[]>([]);
  const [menuCategories, setMenuCategories] = useState<RecipeCategoryOption[]>(
    [],
  );
  const [publicEvents, setPublicEvents] = useState<Event[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  useEffect(() => {
    publicMenuApi
      .get()
      .then((res) => {
        setMenuRecipes(res.data.recipes);
        setMenuCategories(res.data.categories);
      })
      .catch(() => {
        setMenuRecipes([]);
        setMenuCategories([]);
      });
  }, []);

  useEffect(() => {
    publicApi
      .getEvents()
      .then((res) => setPublicEvents(res.data))
      .catch(() => setPublicEvents([]));
  }, []);

  const menuColumns = useMemo<MenuColumn[]>(() => {
    if (!menuRecipes.length) return [];
    return menuCategories
      .filter((category) =>
        menuRecipes.some((recipe) => recipe.category === category.value),
      )
      .slice(0, 4)
      .map((category, index) => ({
        title: category.label,
        ix: `N°${String(index + 1).padStart(2, "0")}`,
        items: menuRecipes
          .filter((recipe) => recipe.category === category.value)
          .slice(0, 5)
          .map((recipe) => ({
            name: recipe.name,
            desc:
              recipe.description ||
              `${recipe.variants.length} variante(s) disponibles en barra`,
            price: recipePriceLabel(recipe),
            imageUrl: recipe.imageUrl,
          })),
      }));
  }, [menuRecipes, menuCategories]);

  const featuredExperience =
    publicEvents.find((event) => event.type === "dinner-with-strangers") ??
    publicEvents.find((event) => event.type !== "picnic") ??
    null;
  const picnicEvents = publicEvents
    .filter((event) => event.type === "picnic")
    .slice(0, 3);
  const calendarEvents = publicEvents.slice(0, 4);

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterStatus("loading");
    setNewsletterMessage("");

    try {
      await publicApi.subscribeNewsletter({ email: newsletterEmail });
      setNewsletterStatus("success");
      setNewsletterMessage("Listo. Te apuntamos al boletin mensual.");
      setNewsletterEmail("");
    } catch {
      setNewsletterStatus("error");
      setNewsletterMessage("No pudimos registrar el correo. Intentalo de nuevo.");
    }
  };

  return (
    <div className="la-isla-home min-h-screen bg-paper text-ink">
      <style>{homeStyles}</style>

      <PublicNavbar />

      <main>
        <section className="hero-shell">
          <div className="hero-copy">
            <h1>
              Deja la prisa.
              <br />
              Sal del ruido.
              <br />
              Ven a <em>La Isla.</em>
            </h1>
            <p>
              Un cafe de especialidad con patio, mesas largas, picnic kits y
              experiencias para volver a conversar sin mirar el reloj.
            </p>
            <div className="hero-actions">
              <Link to="/reservar/mesa" className="btn-primary-home">
                Reservar mesa <ArrowRight size={18} />
              </Link>
              <Link to="/reservar/eventos" className="btn-quiet-home">
                Ver eventos
              </Link>
            </div>
          </div>

          <div className="hero-carousel" aria-label="Ambiente de La Isla Cafe">
            {homeImages.hero.map((image, index) => (
              <ProgressiveImage
                key={image.src}
                src={image.src}
                alt={image.alt}
                className={`hero-slide hero-slide-${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
              />
            ))}
            <div className="hero-photo-mark">
              <span>La Isla</span>
              <small>CAFE PICNIC</small>
            </div>
          </div>
        </section>

        <section className="intro-band">
          <p>Una pausa en medio del ruido.</p>
          <p>Un lugar para trabajar, comer, conversar y quedarse.</p>
        </section>

        <section className="worlds" id="mundos">
          <SectionHead
            eyebrow="Tres mundos"
            title="El espacio tiene ritmo propio."
          />
          <div className="world-grid">
            <WorldCard
              n="N° 01"
              icon={<Coffee size={22} />}
              image={homeImages.spaces[0]}
              title="Cafe de origen"
              text="Barra corta, granos colombianos, metodos frios y una carta sin ruido. Pides rapido, te quedas lento."
              tags={["Espresso", "Filtrados", "Cold brew"]}
            />
            <WorldCard
              n="N° 02"
              icon={<Laptop size={22} />}
              image={homeImages.spaces[1]}
              title="Work cafe"
              text="Mesas para sentarse sin culpa cuatro horas, enchufes, WiFi estable y una regla de casa: el volumen no decide por ti."
              tags={["WiFi", "Enchufes", "Reservable"]}
            />
            <WorldCard
              n="N° 03"
              icon={<Sparkles size={22} />}
              image={homeImages.spaces[2]}
              title="Experiencias sociales"
              text="Cine bajo cobertizo, cenas con desconocidos, catas guiadas, trivia y domingos de picnic."
              tags={["Cenas", "Cine", "Catas"]}
            />
          </div>
        </section>

        {featuredExperience && (
          <section className="feature-dinner">
            <div className="feature-copy">
              <p className="kicker dark">
                Experiencia estrella ·{" "}
                {featuredExperience.type === "dinner-with-strangers"
                  ? "cena con desconocidos"
                  : "proxima"}
              </p>
              <h2>{featuredExperience.title}</h2>
              <p>{featuredExperience.description}</p>
              <div className="detail-list">
                <Detail
                  label="Cuando"
                  value={eventDateTimeLabel(featuredExperience)}
                />
                <Detail
                  label="Cuanto"
                  value={`${eventPriceLabel(featuredExperience)} / persona`}
                />
                <Detail
                  label="Cupos"
                  value={`${eventSpotsLeft(featuredExperience)} de ${featuredExperience.maxCapacity} disponibles`}
                />
              </div>
              <div className="hero-actions">
                <Link
                  to={eventCtaPath(featuredExperience)}
                  className="btn-primary-home"
                >
                  Reservar
                </Link>
                <Link
                  to={`/reservar/eventos/${featuredExperience._id}`}
                  className="btn-quiet-home dark"
                >
                  Ver detalles
                </Link>
              </div>
            </div>
            <div className="table-scene">
              <ProgressiveImage
                className="image-fill"
                src={featuredExperience.imageUrl || homeImages.dinner.src}
                alt={featuredExperience.title}
              />
              <div className="quote-tag">{featuredExperience.title}</div>
              <p>{eventDateTimeLabel(featuredExperience)}</p>
            </div>
          </section>
        )}

        <section className="menu-section" id="carta">
          <div className="split-head">
            <SectionHead
              eyebrow=" Una carta corta a proposito"
              title="La carta."
            />
            <p>
              La carta publicada desde el administrador. Cambia con la temporada
              y con lo que el productor mande esta semana.
            </p>
            <Link to="/menu">Ver carta completa →</Link>
          </div>
          {menuColumns.length > 0 ? (
            <div className="menu-grid">
              {menuColumns.map((column) => (
                <div className="menu-col" key={column.title}>
                  <h3>
                    <span>{column.ix}</span>
                    {column.title}
                  </h3>
                  {column.items.map((item) => (
                    <div
                      className={`menu-item ${item.imageUrl ? "with-image" : ""}`}
                      key={item.name}
                    >
                      {item.imageUrl && (
                        <ProgressiveImage
                          className="menu-thumb"
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                        />
                      )}
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.desc}</p>
                      </div>
                      <span>{item.price}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-home-state">
              La carta publica aparecera aqui cuando haya productos activos
              publicados desde el administrador.
            </div>
          )}
        </section>

        {picnicEvents.length > 0 && (
          <section className="picnic-section" id="picnic">
            <div>
              <p className="kicker">Picnic</p>
              <h2>
                Picnic en <em>La Isla.</em>
              </h2>
              <p>
                Eventos picnic publicados desde el administrador, con cupos,
                precio, fecha e imagen definidos para cada experiencia.
              </p>
              <div className="hero-actions">
                <Link
                  to={eventCtaPath(picnicEvents[0])}
                  className="btn-primary-home"
                >
                  Reservar picnic
                </Link>
                <Link to="/reservar/eventos" className="btn-quiet-home">
                  Ver todos
                </Link>
              </div>
            </div>
            <div className="picnic-content">
              <ProgressiveImage
                className="picnic-photo"
                src={picnicEvents[0].imageUrl || homeImages.picnic.src}
                alt={picnicEvents[0].title}
                loading="lazy"
              />
              <div className="tiers">
                {picnicEvents.map((event, index) => (
                  <Tier
                    key={event._id}
                    ix={`${index + 1}.`}
                    name={event.title}
                    price={eventPriceLabel(event)}
                    desc={`${eventDateTimeLabel(event)} · ${eventSpotsLeft(event)} cupos disponibles`}
                    href={eventCtaPath(event)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="events-section" id="eventos">
          <div className="split-head">
            <SectionHead eyebrow=" Calendario" title="Próximos eventos." />
            <Link to="/reservar/eventos">Ver todo el calendario →</Link>
          </div>
          {calendarEvents.length > 0 ? (
            <div className="event-grid">
              {calendarEvents.map((event, index) => {
                const { day, month } = eventDateParts(event);
                return (
                  <Link
                    to={eventCtaPath(event)}
                    className={`event-card ${index === 0 ? "featured" : ""}`}
                    key={event._id}
                  >
                    {event.imageUrl && (
                      <ProgressiveImage
                        className="event-card-image"
                        src={event.imageUrl}
                        alt={event.title}
                        loading="lazy"
                      />
                    )}
                    <div className="date-row">
                      <div>
                        <strong>{day}</strong>
                        <span>{month}</span>
                      </div>
                      <span>{eventSpotsLeft(event)} cupos</span>
                    </div>
                    <h3>{event.title}</h3>
                    <p>{eventDateTimeLabel(event)}</p>
                    <p>{eventPriceLabel(event)}</p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-home-state">
              Los eventos publicados desde el administrador apareceran aqui.
            </div>
          )}
        </section>

        <section className="visit-section" id="visita">
          <div className="visit-copy">
            <p className="kicker">Visitanos</p>
            <h2>
              Estamos <em>aqui.</em>
            </h2>
            <p className="address">
              Carrera 5 N° 28-14, barrio Belen,
              <br />
              Ibague, Tolima. Entre la Plaza de Belen
              <br />y el Parque Andres Lopez.
            </p>
            <div className="hours">
              <Detail label="Lun - Jue" value="9:00 - 21:00" />
              <Detail label="Vie - Sab" value="9:00 - 23:00" />
              <Detail label="Domingo" value="10:00 - 19:00 · brunch & picnic" />
            </div>
            <div className="hero-actions">
              <a
                className="btn-primary-home"
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={17} /> Como llegar
              </a>
              <a
                className="btn-quiet-home"
                href="https://wa.me/573000000000"
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={17} /> WhatsApp
              </a>
            </div>
          </div>
          <div className="map-panel">
            <ProgressiveImage
              className="image-fill"
              src={homeImages.visit.src}
              alt={homeImages.visit.alt}
              loading="lazy"
            />
            <div className="pin">
              <MapPin size={18} /> La Isla Cafe
            </div>
            <div className="ribbon">04°26'N · 75°14'W · Ibague</div>
          </div>
        </section>

        <aside className="newsletter">
          <div className="quote">
            <span>Deja la prisa.</span>
            <span>Sal del ruido.</span>
            <span>Ven a La Isla.</span>
          </div>
          <form onSubmit={handleNewsletterSubmit}>
            <label>Boletin · una vez al mes, no mas</label>
            <div>
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
            </div>
            <p>
              {newsletterMessage ||
                "Reservas para cenas, catas y eventos. Cero promos, cero ruido."}
            </p>
          </form>
        </aside>
      </main>

      <footer className="home-footer">
        <div>
          <span className="brand-mark" />
          <h2>La Isla Cafe</h2>
          <p>
            Una pausa en medio del ruido. Cafe picnic en el corazon de Ibague.
          </p>
        </div>
        <nav>
          <a href="#mundos">El espacio</a>
          <a href="#carta">La carta</a>
          <a href="#eventos">Eventos</a>
          <a href="#visita">Visitanos</a>
        </nav>
        <div className="contact">
          <span>hola@laisla.cafe</span>
          <span>+57 300 000 0000</span>
          <span>@laisla.cafe</span>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
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

function WorldCard({
  n,
  icon,
  image,
  title,
  text,
  tags,
}: {
  n: string;
  icon: ReactNode;
  image: { src: string; alt: string };
  title: string;
  text: string;
  tags: string[];
}) {
  return (
    <article className="world-card">
      <div className="visual-box">
        <ProgressiveImage
          className="image-fill"
          src={image.src}
          alt={image.alt}
          loading="lazy"
        />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Tier({
  ix,
  name,
  desc,
  price,
  href,
}: {
  ix: string;
  name: string;
  desc: string;
  price: string;
  href?: string;
}) {
  const content = (
    <>
      <span>{ix}</span>
      <div>
        <strong>{name}</strong>
        <p>{desc}</p>
      </div>
      <b>{price}</b>
    </>
  );

  return href ? (
    <Link to={href} className="tier">
      {content}
    </Link>
  ) : (
    <div className="tier">{content}</div>
  );
}

const homeStyles = `
.la-isla-home {
  --home-ink: #1F2A1B;
  --home-muted: #6B7768;
  --home-paper: #FFF9EC;
  --home-tint: #FBF3DE;
  --home-rule: #E7DEC6;
  --home-espresso: #43593B;
  --home-terracotta: #E87A5D;
  --home-maize: #F2D17E;
  --home-lagoon: #7CC1E7;
  background: var(--home-paper);
}
.la-isla-home a { text-decoration: none; }
.home-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 18px clamp(18px, 4vw, 54px);
  background: rgba(255, 249, 236, .88);
  border-bottom: 1px solid var(--home-rule);
  backdrop-filter: blur(16px);
}
.brand-lockup { display: inline-flex; align-items: center; gap: 12px; color: var(--home-ink); }
.brand-lockup strong { display: block; font-family: "DM Sans", system-ui, sans-serif; font-size: 26px; line-height: 1; }
.brand-lockup small { display: block; color: var(--home-muted); font-size: 10px; letter-spacing: 4px; margin-top: 5px; }
.brand-mark { display: inline-block; width: 36px; height: 36px; border-radius: 50%; background: radial-gradient(circle at 50% 50%, var(--home-maize) 0 36%, var(--home-lagoon) 37% 100%); box-shadow: inset 0 0 0 1px rgba(31,42,27,.12); }
.home-nav nav { display: flex; gap: 28px; font-size: 13px; font-weight: 700; color: var(--home-muted); }
.home-nav nav a { color: var(--home-muted); }
.nav-cta { justify-self: end; color: var(--home-paper); background: var(--home-espresso); border-radius: 999px; padding: 11px 18px; font-weight: 800; font-size: 13px; }
.hero-shell { min-height: calc(100vh - 73px); display: grid; grid-template-columns: minmax(0, .9fr) minmax(360px, 46vw); gap: clamp(28px, 4vw, 48px); align-items: center; padding: clamp(30px, 4.5vw, 54px) clamp(20px, 6vw, 72px); overflow: hidden; }
.hero-copy { max-width: 620px; }
.kicker, .section-eyebrow { color: var(--home-terracotta); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-weight: 900; margin-bottom: 12px; }
.kicker.dark { color: var(--home-maize); }
.hero-copy h1 { font-family: "DM Sans", system-ui, sans-serif; color: var(--home-ink); font-size: clamp(46px, 6.1vw, 88px); line-height: .92; letter-spacing: 0; font-weight: 900; margin: 0 0 18px; }
.hero-copy em, .feature-copy em, .picnic-section em, .visit-copy em { font-style: italic; color: var(--home-espresso); }
.hero-copy p { max-width: 540px; color: var(--home-muted); font-size: 17px; line-height: 1.48; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
.btn-primary-home, .btn-quiet-home { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 48px; border-radius: 999px; padding: 0 20px; font-weight: 900; font-size: 14px; }
.btn-primary-home { background: var(--home-terracotta); color: var(--home-paper); box-shadow: 0 10px 24px rgba(232,122,93,.24); }
.btn-quiet-home { border: 1px solid var(--home-rule); color: var(--home-espresso); background: rgba(255,255,255,.38); }
.btn-quiet-home.dark { color: var(--home-paper); border-color: rgba(255,249,236,.28); background: rgba(255,249,236,.08); }
.progressive-image { position: relative; display: block; overflow: hidden; isolation: isolate; background: linear-gradient(135deg, #f8edcf 0%, #fff9ec 44%, #e8dcbf 100%); }
.progressive-image::before { content: ""; position: absolute; inset: 0; z-index: 1; background: linear-gradient(110deg, rgba(255,255,255,0) 20%, rgba(255,255,255,.62) 46%, rgba(255,255,255,0) 72%); transform: translateX(-120%); animation: imageWash 1.35s ease-in-out infinite; opacity: 1; transition: opacity .55s ease .2s; pointer-events: none; }
.progressive-image::after { content: ""; position: absolute; inset: 0; z-index: 2; background: radial-gradient(circle at 28% 18%, rgba(242,209,126,.36), transparent 34%), linear-gradient(180deg, rgba(31,42,27,.04), rgba(31,42,27,.12)); opacity: 1; transition: opacity .85s ease .18s; pointer-events: none; }
.progressive-image img { display: block; width: 100%; height: 100%; object-fit: cover; opacity: 0; transform: scale(1.055); filter: blur(22px) saturate(.78); clip-path: inset(3% 3% 3% 3% round 8px); }
.progressive-image.is-loaded::before { opacity: 0; animation-play-state: paused; }
.progressive-image.is-loaded::after { opacity: 0; }
.progressive-image.is-loaded img { animation: imageReveal 1.25s cubic-bezier(.16,1,.3,1) both; }
.image-fill { position: absolute; inset: 0; width: 100%; height: 100%; }
@keyframes imageWash {
  to { transform: translateX(120%); }
}
@keyframes imageReveal {
  0% { opacity: 0; transform: scale(1.055); filter: blur(22px) saturate(.78); clip-path: inset(3% 3% 3% 3% round 8px); }
  58% { opacity: .92; filter: blur(5px) saturate(.96); }
  100% { opacity: 1; transform: scale(1); filter: blur(0) saturate(1); clip-path: inset(0 round 8px); }
}
.hero-carousel { position: relative; height: min(60vh, 560px); min-height: 420px; border-radius: 8px; overflow: hidden; background: var(--home-tint); box-shadow: 0 28px 70px rgba(67,89,59,.16); }
.hero-carousel::after { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(31,42,27,.08), rgba(31,42,27,.46)); pointer-events: none; }
.hero-slide { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; animation: heroFade 18s infinite; }
.hero-slide img { position: absolute; inset: 0; }
.hero-slide-1 { animation-delay: 0s; }
.hero-slide-2 { animation-delay: 6s; }
.hero-slide-3 { animation-delay: 12s; }
@keyframes heroFade {
  0%, 28% { opacity: 1; transform: scale(1); }
  34%, 94% { opacity: 0; transform: scale(1.045); }
  100% { opacity: 1; transform: scale(1); }
}
.hero-photo-mark { position: absolute; right: 26px; bottom: 26px; z-index: 2; width: min(42%, 240px); aspect-ratio: 1; border-radius: 50%; background: rgba(242,209,126,.88); display: grid; place-items: center; text-align: center; color: var(--home-ink); box-shadow: 0 24px 60px rgba(31,42,27,.18); backdrop-filter: blur(3px); }
.hero-photo-mark span { font-family: "DM Sans", system-ui, sans-serif; font-style: italic; font-size: clamp(32px, 3.4vw, 54px); }
.hero-photo-mark small { display: block; margin-top: 12px; letter-spacing: 5px; color: var(--home-muted); font-size: 11px; }
.ticket { position: absolute; border: 1px solid var(--home-rule); background: rgba(255,249,236,.92); color: var(--home-muted); border-radius: 999px; padding: 12px 16px; font-size: 12px; font-weight: 800; }
.ticket-a { z-index: 2; left: 24px; top: 24px; }
.ticket-b { z-index: 2; left: 24px; bottom: 24px; }
.intro-band { border-block: 1px solid var(--home-rule); background: var(--home-espresso); color: var(--home-paper); display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 24px clamp(20px, 6vw, 72px); font-family: "DM Sans", system-ui, sans-serif; font-size: clamp(22px, 3vw, 42px); line-height: 1.08; }
.intro-band p:last-child { color: rgba(255,249,236,.64); }
.worlds, .menu-section, .events-section { padding: clamp(56px, 8vw, 104px) clamp(20px, 6vw, 72px); }
.section-title { font-family: "DM Sans", system-ui, sans-serif; font-size: clamp(38px, 5vw, 76px); line-height: .94; color: var(--home-espresso); margin: 0; }
.world-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 34px; }
.world-card { border: 1px solid var(--home-rule); background: white; border-radius: 8px; padding: 22px; min-height: 440px; display: flex; flex-direction: column; }
.world-num { color: var(--home-terracotta); font-size: 12px; font-weight: 900; letter-spacing: 1px; }
.visual-box { position: relative; height: 170px; border-radius: 8px; background: var(--home-tint); margin: 18px 0 20px; display: grid; place-items: center; color: var(--home-paper); text-align: center; overflow: hidden; }
.visual-box::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(31,42,27,.08), rgba(31,42,27,.55)); }
.visual-box svg { position: relative; z-index: 1; filter: drop-shadow(0 2px 8px rgba(0,0,0,.22)); }
.visual-box span { position: relative; z-index: 1; display: block; font-size: 11px; color: rgba(255,249,236,.86); margin-top: 6px; }
.world-card h3 { font-family: "DM Sans", system-ui, sans-serif; font-size: 31px; line-height: 1; color: var(--home-ink); margin-bottom: 12px; }
.world-card p { color: var(--home-muted); line-height: 1.55; }
.world-card div:last-child { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; }
.world-card div:last-child span { border: 1px solid var(--home-rule); border-radius: 999px; padding: 7px 10px; font-size: 11px; color: var(--home-espresso); font-weight: 800; }
.feature-dinner { display: grid; grid-template-columns: 1fr 1fr; min-height: 680px; background: var(--home-espresso); color: var(--home-paper); }
.feature-copy { padding: clamp(46px, 7vw, 88px); align-self: center; }
.feature-copy h2, .picnic-section h2, .visit-copy h2 { font-family: "DM Sans", system-ui, sans-serif; font-size: clamp(44px, 6vw, 82px); line-height: .95; margin: 0 0 22px; }
.feature-copy p, .picnic-section p { color: rgba(255,249,236,.72); font-size: 18px; line-height: 1.6; max-width: 570px; }
.detail-list, .hours { margin-top: 28px; border-top: 1px solid rgba(255,249,236,.18); }
.detail { display: flex; justify-content: space-between; gap: 22px; padding: 13px 0; border-bottom: 1px solid rgba(255,249,236,.15); }
.detail span { color: rgba(255,249,236,.58); }
.detail strong { color: inherit; }
.table-scene { position: relative; min-height: 520px; display: grid; place-items: center; background: #314429; overflow: hidden; }
.table-scene::after { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(31,42,27,.18), rgba(31,42,27,.64)); pointer-events: none; }
.quote-tag { position: absolute; left: 34px; top: 34px; font-family: "DM Sans", system-ui, sans-serif; font-size: 28px; line-height: 1.05; color: var(--home-maize); }
.quote-tag, .table-scene p { z-index: 1; }
.table-scene p { position: absolute; right: 30px; bottom: 24px; color: rgba(255,249,236,.78); font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
.split-head { display: grid; grid-template-columns: 1fr minmax(240px, 410px) auto; gap: 28px; align-items: end; margin-bottom: 34px; }
.split-head p { color: var(--home-muted); line-height: 1.55; }
.split-head a { color: var(--home-ink); border-bottom: 1px solid var(--home-terracotta); font-weight: 800; font-size: 13px; }
.menu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.empty-home-state { border: 1px dashed var(--home-rule); border-radius: 8px; background: rgba(255,255,255,.46); color: var(--home-muted); padding: 22px; font-weight: 700; }
.menu-col { border: 1px solid var(--home-rule); border-radius: 8px; background: white; padding: 24px; }
.menu-col h3 { display: flex; gap: 14px; align-items: baseline; font-family: "DM Sans", system-ui, sans-serif; font-size: 34px; color: var(--home-espresso); margin-bottom: 14px; }
.menu-col h3 span { font: 11px ui-monospace, monospace; color: var(--home-terracotta); }
.menu-item { display: grid; grid-template-columns: 1fr auto; gap: 18px; padding: 17px 0; border-top: 1px solid var(--home-rule); align-items: center; }
.menu-item.with-image { grid-template-columns: 74px 1fr auto; }
.menu-thumb { width: 74px; height: 74px; border-radius: 8px; border: 1px solid var(--home-rule); background: var(--home-tint); }
.menu-item strong { color: var(--home-ink); }
.menu-item p { color: var(--home-muted); font-size: 13px; margin-top: 4px; }
.menu-item > span { color: var(--home-espresso); font-weight: 900; }
.picnic-section { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1fr); gap: 42px; padding: clamp(56px, 8vw, 104px) clamp(20px, 6vw, 72px); background: var(--home-espresso); color: var(--home-paper); }
.picnic-content { display: grid; gap: 14px; align-self: center; }
.picnic-photo { width: 100%; height: min(34vw, 280px); border-radius: 8px; border: 1px solid rgba(255,249,236,.18); }
.tiers { display: grid; gap: 12px; }
.tier { display: grid; grid-template-columns: 42px 1fr auto; gap: 18px; align-items: start; border: 1px solid rgba(255,249,236,.18); background: rgba(255,249,236,.07); border-radius: 8px; padding: 18px; color: inherit; transition: transform .2s ease, background .2s ease; }
.tier:hover { transform: translateY(-2px); background: rgba(255,249,236,.11); }
.tier > span { color: var(--home-maize); font-family: "DM Sans", system-ui, sans-serif; font-size: 24px; }
.tier strong { color: var(--home-paper); }
.tier p { color: rgba(255,249,236,.62); font-size: 13px; margin-top: 4px; }
.tier b { color: var(--home-maize); white-space: nowrap; }
.event-grid { display: grid; grid-template-columns: 1.25fr repeat(3, 1fr); gap: 14px; }
.event-card { border: 1px solid var(--home-rule); border-radius: 8px; background: white; padding: 20px; min-height: 250px; display: flex; flex-direction: column; color: inherit; overflow: hidden; }
.event-card.featured { background: var(--home-espresso); color: var(--home-paper); border-color: var(--home-espresso); }
.event-card-image { width: calc(100% + 40px); height: 120px; margin: -20px -20px 18px; }
.date-row { display: flex; justify-content: space-between; gap: 16px; margin-bottom: auto; }
.date-row strong { display: block; font-family: "DM Sans", system-ui, sans-serif; font-size: 54px; line-height: .9; }
.date-row span { color: var(--home-muted); font-size: 12px; text-transform: uppercase; }
.featured .date-row span, .featured p { color: rgba(255,249,236,.7); }
.date-row > span { border: 1px solid currentColor; border-radius: 999px; height: 26px; padding: 5px 9px; }
.event-card h3 { font-family: "DM Sans", system-ui, sans-serif; font-size: 25px; line-height: 1.05; margin: 24px 0 12px; color: inherit; }
.event-card p { color: var(--home-muted); font-size: 13px; }
.visit-section { display: grid; grid-template-columns: .9fr 1.1fr; min-height: 620px; }
.visit-copy { padding: clamp(46px, 7vw, 88px); background: white; }
.visit-copy .kicker { color: var(--home-terracotta); }
.visit-copy h2, .visit-copy h2 em { color: var(--home-espresso); }
.address { color: var(--home-muted); font-size: 20px; line-height: 1.55; }
.visit-copy .detail { border-color: var(--home-rule); }
.visit-copy .detail span { color: var(--home-muted); }
.map-panel { position: relative; min-height: 520px; overflow: hidden; border-left: 1px solid var(--home-rule); }
.map-panel::after { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(251,243,222,.05), rgba(31,42,27,.34)); pointer-events: none; }
.pin { position: absolute; left: 46%; top: 43%; display: inline-flex; align-items: center; gap: 8px; background: var(--home-terracotta); color: var(--home-paper); border-radius: 999px; padding: 10px 14px; font-weight: 900; }
.ribbon { position: absolute; right: 22px; bottom: 22px; background: var(--home-ink); color: var(--home-paper); border-radius: 999px; padding: 9px 12px; font-size: 11px; letter-spacing: 1px; }
.pin, .ribbon { z-index: 1; }
.newsletter { display: grid; grid-template-columns: 1.2fr .8fr; gap: 32px; align-items: center; padding: clamp(44px, 7vw, 78px) clamp(20px, 6vw, 72px); background: var(--home-maize); }
.quote { display: grid; gap: 4px; font-family: "DM Sans", system-ui, sans-serif; font-size: clamp(34px, 5vw, 68px); line-height: .95; color: var(--home-ink); }
.newsletter form { background: rgba(255,249,236,.54); border: 1px solid rgba(31,42,27,.12); border-radius: 8px; padding: 20px; }
.newsletter label { font-weight: 900; color: var(--home-espresso); font-size: 13px; }
.newsletter form > div { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin: 12px 0; }
.newsletter input { border: 1px solid var(--home-rule); border-radius: 999px; padding: 13px 15px; background: white; color: var(--home-ink); }
.newsletter button { border: 0; border-radius: 999px; padding: 0 16px; background: var(--home-espresso); color: var(--home-paper); font-weight: 900; }
.newsletter button:disabled, .newsletter input:disabled { opacity: .68; cursor: wait; }
.newsletter p { color: var(--home-muted); font-size: 12px; line-height: 1.5; }
.home-footer { display: grid; grid-template-columns: 1.2fr .7fr .7fr; gap: 30px; padding: 42px clamp(20px, 6vw, 72px); background: var(--home-ink); color: var(--home-paper); }
.home-footer h2 { font-family: "DM Sans", system-ui, sans-serif; font-size: 28px; margin: 10px 0 8px; }
.home-footer p, .home-footer span { color: rgba(255,249,236,.62); }
.home-footer nav, .contact { display: grid; gap: 10px; align-content: start; }
.home-footer a { color: rgba(255,249,236,.72); }
@media (max-width: 980px) {
  .home-nav { grid-template-columns: 1fr auto; }
  .home-nav nav { display: none; }
  .hero-shell, .feature-dinner, .picnic-section, .visit-section, .newsletter, .home-footer { grid-template-columns: 1fr; }
  .hero-shell { min-height: auto; }
  .hero-carousel { height: 420px; min-height: 380px; }
  .world-grid, .menu-grid, .event-grid { grid-template-columns: 1fr; }
  .split-head { grid-template-columns: 1fr; align-items: start; }
  .intro-band { grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .hero-shell, .worlds, .menu-section, .events-section, .picnic-section { padding-inline: 16px; }
  .hero-copy h1 { font-size: 44px; }
  .hero-carousel { height: 360px; min-height: 340px; }
  .hero-photo-mark { width: 180px; right: 18px; bottom: 18px; }
  .ticket { display: none; }
  .home-nav { padding-inline: 14px; }
  .brand-lockup small { letter-spacing: 2px; }
  .nav-cta { padding-inline: 14px; }
  .tier { grid-template-columns: 32px 1fr; }
  .tier b { grid-column: 2; }
  .newsletter form > div { grid-template-columns: 1fr; }
  .menu-item.with-image { grid-template-columns: 58px 1fr; }
  .menu-thumb { width: 58px; height: 58px; }
  .menu-item > span { grid-column: 2; }
}
@media (prefers-reduced-motion: reduce) {
  .progressive-image::before, .hero-slide { animation: none; }
  .hero-slide-1 { opacity: 1; }
  .progressive-image.is-loaded img { animation: none; opacity: 1; transform: none; filter: none; clip-path: none; }
}
`;
