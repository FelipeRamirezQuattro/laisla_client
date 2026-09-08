import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import "./home.css";
import { publicApi } from "../../../api/public";
import { InstagramIcon, TikTokIcon } from "../../../components/icons/SocialIcons";
import { contact, socialLinks } from "../../../utils/siteInfo";

export function HomeFooter() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

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
      setNewsletterMessage("No pudimos registrar el correo. Inténtalo de nuevo.");
    }
  };

  return (
    <footer className="li-footer li-pattern-band">
      <div className="li-footer-grid">
        <div>
          <img
            src="/images/brand/logo-principal-blanco.png"
            alt="La Isla · Café Picnic"
            className="li-footer-logo"
          />
          <p className="li-footer-desc">
            Café picnic en el corazón de Ibagué. Una pausa en medio del ruido,
            de lunes a sábado, de 1 a 9 de la noche.
          </p>
        </div>
        <nav className="li-footer-col">
          <p className="li-footer-col-title">La isla</p>
          <a href="#razones">El espacio</a>
          <Link to="/menu">La carta</Link>
          <a href="#eventos">Eventos</a>
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
