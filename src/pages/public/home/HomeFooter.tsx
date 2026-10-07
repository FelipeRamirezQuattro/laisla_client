import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import "./home.css";
import { publicApi } from "../../../api/public";
import { InstagramIcon, TikTokIcon } from "../../../components/icons/SocialIcons";
import { TurnstileWidget } from "../../../components/TurnstileWidget";
import { contact, socialLinks } from "../../../utils/siteInfo";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export function HomeFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setNewsletterStatus("error");
      setNewsletterMessage("Espera a que se cargue la verificación de seguridad.");
      return;
    }

    setNewsletterStatus("loading");
    setNewsletterMessage("");

    try {
      await publicApi.subscribeNewsletter({
        email: newsletterEmail,
        turnstileToken,
        company: honeypot,
      });
      setNewsletterStatus("success");
      setNewsletterMessage("Listo. Te apuntamos al boletín mensual.");
      setNewsletterEmail("");
    } catch {
      setNewsletterStatus("error");
      setNewsletterMessage("No pudimos registrar el correo. Inténtalo de nuevo.");
    } finally {
      setTurnstileToken("");
      setTurnstileKey((key) => key + 1);
    }
  };

  return (
    <footer className="li-footer li-pattern-band">
      <div className="li-footer-grid">
        <div>
          <img
            src="/images/brand/logo-principal-blanco.png"
            alt="La Isla · Café Picnic"
            width="300"
            height="300"
            className="li-footer-logo"
          />
          <p className="li-footer-desc">
            <strong>Vivir sin afán.</strong> Café picnic en el corazón de
            Ibagué, de lunes a sábado, de 1 a 9 de la noche.
          </p>
        </div>
        <nav className="li-footer-col">
          <p className="li-footer-col-title">La isla</p>
          <a href="/#razones">El espacio</a>
          <Link to="/menu">La carta</Link>
          <Link to="/reservar/eventos">Eventos</Link>
          <Link to="/reservar/cena-con-desconocidos">Cena con desconocidos</Link>
        </nav>
        <div className="li-footer-col">
          <p className="li-footer-col-title">Visítanos</p>
          <span>
            Cra 4C N.º 41-25
            <br />
            Barrio La Macarena · Ibagué
          </span>
          <span>Lun–Sáb 1:00 pm–9:00 pm</span>
        </div>
        <div className="li-footer-col">
          <p className="li-footer-col-title">Boletín · 1 vez al mes</p>
          <form className="li-newsletter-form" onSubmit={handleNewsletterSubmit}>
            <label className="li-sr-only" htmlFor="newsletter-email">Correo electrónico</label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="tu@correo.com…"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              disabled={newsletterStatus === "loading"}
              required
            />
            {/* Honeypot: invisible to real visitors, bots that fill every field don't know that. */}
            <input
              type="text"
              name="company"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                opacity: 0,
                pointerEvents: "none",
                left: "-9999px",
              }}
            />
            <button type="submit" disabled={newsletterStatus === "loading"}>
              {newsletterStatus === "loading" ? "Enviando…" : "Apuntarme"}
            </button>
          </form>
          {TURNSTILE_SITE_KEY && (
            <TurnstileWidget
              key={turnstileKey}
              siteKey={TURNSTILE_SITE_KEY}
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
              className="li-turnstile"
            />
          )}
          {newsletterMessage && (
            <span className="li-newsletter-message" role="status" aria-live="polite">{newsletterMessage}</span>
          )}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.phoneHref}>{contact.phone}</a>
          <div className="li-footer-social">
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramIcon size={16} /> Instagram
            </a>
            <a
              href={socialLinks.tiktok}
              target="_blank"
              rel="noopener noreferrer"
            >
              <TikTokIcon size={15} /> TikTok
            </a>
          </div>
        </div>
      </div>
      <div className="li-footer-bottom">
        <span>© {new Date().getFullYear()} La Isla · Café Picnic</span>
        <span>Hecho en Ibagué, Tolima</span>
      </div>
    </footer>
  );
}
