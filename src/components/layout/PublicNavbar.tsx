import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu as MenuIcon, X } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "../icons/SocialIcons";
import { socialLinks } from "../../utils/siteInfo";

export function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <style>{publicNavbarStyles}</style>
      <header className="pnav">
        <Link to="/" className="pnav-brand" onClick={closeMenu}>
          <img
            src="/images/brand/wordmark-original-trim.png"
            alt="La Isla · Café Picnic"
            className="pnav-brand-mark"
          />
        </Link>
        <nav className="pnav-links">
          <a href="/#razones">Espacio</a>
          <Link to="/menu">Menu</Link>
          <a href="/#eventos">Eventos</a>
          <a href="/#visita">Visítanos</a>
        </nav>
        <div className="pnav-actions">
          <div className="pnav-social">
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
          <Link to="/reservar/mesa" className="pnav-cta">
            Reservar mesa <span>→</span>
          </Link>
          <button
            type="button"
            className="pnav-toggle"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} strokeWidth={2} /> : <MenuIcon size={22} strokeWidth={2} />}
          </button>
        </div>

        {menuOpen && (
          <div className="pnav-drawer">
            <a href="/#razones" onClick={closeMenu}>Espacio</a>
            <Link to="/menu" onClick={closeMenu}>Menu</Link>
            <a href="/#eventos" onClick={closeMenu}>Eventos</a>
            <a href="/#visita" onClick={closeMenu}>Visítanos</a>
            <Link to="/reservar/mesa" onClick={closeMenu}>
              Reservar mesa →
            </Link>
          </div>
        )}
      </header>
    </>
  );
}

const publicNavbarStyles = `
.pnav {
  --pnav-blue: #2043A9;
  --pnav-yellow: #FCA613;
  --pnav-sand: #FBF6E2;
  --pnav-rule: rgba(16,26,58,.2);
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  padding: 14px clamp(18px, 4vw, 48px);
  background: var(--pnav-sand);
  border-bottom: 2px solid var(--pnav-rule);
}
.pnav-brand { display: flex; align-items: center; }
.pnav-brand-mark { height: 44px; width: auto; display: block; }
.pnav-links {
  display: flex;
  justify-content: center;
  gap: 28px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  font-family: "Nunito", sans-serif;
}
.pnav-links a { color: var(--pnav-blue); text-decoration: none; }
.pnav-links a:hover { opacity: .7; }
.pnav-actions { display: flex; align-items: center; gap: 18px; }
.pnav-social { display: flex; align-items: center; gap: 14px; color: var(--pnav-blue); }
.pnav-social a { display: flex; color: var(--pnav-blue); transition: transform .2s ease, opacity .2s ease; }
.pnav-social a:hover { transform: translateY(-2px); opacity: .75; }
.pnav-cta {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: var(--pnav-yellow);
  color: var(--pnav-blue);
  font-family: "Nunito", sans-serif;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  padding: 13px 22px;
  border-radius: 999px;
  white-space: nowrap;
  text-decoration: none;
  transition: transform .2s ease;
}
.pnav-cta:hover { transform: translateY(-2px); }
.pnav-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  color: var(--pnav-blue);
  cursor: pointer;
  flex: none;
}
.pnav-drawer {
  display: none;
}
@media (max-width: 980px) {
  .pnav { grid-template-columns: auto 1fr; }
  .pnav-links { display: none; }
  .pnav-cta { display: none; }
  .pnav-actions { justify-self: end; }
  .pnav-toggle { display: inline-flex; }
  .pnav-drawer {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--pnav-sand);
    border-bottom: 2px solid var(--pnav-rule);
    padding: 10px clamp(18px, 4vw, 48px) 22px;
  }
  .pnav-drawer a {
    padding: 14px 2px;
    border-bottom: 1px solid var(--pnav-rule);
    color: var(--pnav-blue);
    text-decoration: none;
    font-family: "Nunito", sans-serif;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .pnav-drawer a:last-child { border-bottom: 0; }
}
@media (max-width: 640px) {
  .pnav { padding: 12px 18px; }
  .pnav-brand-mark { height: 32px; }
  .pnav-actions { gap: 10px; }
  .pnav-social { gap: 10px; }
  .pnav-social svg { width: 16px; height: 16px; }
  .pnav-toggle { width: 36px; height: 36px; }
}
`;
