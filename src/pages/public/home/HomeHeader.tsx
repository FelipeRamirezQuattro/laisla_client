import { Link } from "react-router-dom";
import { InstagramIcon, TikTokIcon } from "./SocialIcons";
import { socialLinks } from "./helpers";

export function HomeHeader() {
  return (
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
      <div className="li-header-actions">
        <div className="li-header-social">
          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="La Isla en Instagram"
          >
            <InstagramIcon size={19} />
          </a>
          <a
            href={socialLinks.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="La Isla en TikTok"
          >
            <TikTokIcon size={18} />
          </a>
        </div>
        <Link to="/reservar/mesa" className="li-header-cta">
          Reservar mesa <span>→</span>
        </Link>
      </div>
    </header>
  );
}
