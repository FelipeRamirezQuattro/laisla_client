import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu as MenuIcon, X } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "../icons/SocialIcons";
import { socialLinks } from "../../utils/siteInfo";

export function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        toggleRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const isCurrent = (href: string) =>
    location.pathname === "/" && location.hash === href.replace("/", "");

  return (
    <>
      <style>{publicNavbarStyles}</style>
      <a className="pnav-skip" href="#main-content">Saltar al contenido</a>
      <header className="pnav">
        <Link to="/" className="pnav-brand" onClick={closeMenu}>
          <img
            src="/images/brand/wordmark-original-trim.png"
            alt="La Isla · Café Picnic"
            width="180"
            height="103"
            className="pnav-brand-mark"
          />
        </Link>
        <nav className="pnav-links">
          <a href="/#razones" aria-current={isCurrent("/#razones") ? "location" : undefined}>Espacio</a>
          <Link to="/menu" aria-current={location.pathname === "/menu" ? "page" : undefined}>Menú</Link>
          <a href="/#eventos" aria-current={isCurrent("/#eventos") ? "location" : undefined}>Eventos</a>
          <a href="/#visita" aria-current={isCurrent("/#visita") ? "location" : undefined}>Visítanos</a>
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
            <span className="pnav-cta-full">Reservar mesa</span>
            <span className="pnav-cta-short">Reservar</span>
            <span aria-hidden="true">→</span>
          </Link>
          <button
            type="button"
            className="pnav-toggle"
            ref={toggleRef}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="pnav-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} strokeWidth={2} /> : <MenuIcon size={22} strokeWidth={2} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="pnav-drawer" id="pnav-mobile-menu" aria-label="Navegación móvil">
            <a href="/#razones" onClick={closeMenu}>Espacio</a>
            <Link to="/menu" onClick={closeMenu}>Menú</Link>
            <a href="/#eventos" onClick={closeMenu}>Eventos</a>
            <a href="/#visita" onClick={closeMenu}>Visítanos</a>
            <div className="pnav-drawer-social">
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon size={18} /> Instagram</a>
              <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer"><TikTokIcon size={18} /> TikTok</a>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

const publicNavbarStyles = `
.pnav-skip {
  position: fixed; left: 16px; top: 8px; z-index: 100; padding: 10px 14px;
  background: #FCA613; color: #2043A9; border: 2px solid #2043A9; border-radius: 999px;
  min-height: 44px; font: 800 14px "Nunito", sans-serif; transform: translateY(-150%); transition: transform .2s ease;
}
.pnav-skip:focus-visible { transform: translateY(0); outline: 3px solid #fff; outline-offset: 2px; }
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
  padding: 10px clamp(18px, 4vw, 48px);
  background: var(--pnav-sand);
  border-bottom: 2px solid var(--pnav-rule);
}
.pnav-brand { display: flex; align-items: center; min-height: 44px; }
.pnav-brand-mark { height: 40px; width: auto; display: block; }
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
.pnav-links a { position: relative; color: var(--pnav-blue); text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; }
.pnav-links a::after { content: ""; position: absolute; left: 0; right: 100%; bottom: 4px; height: 3px; border-radius: 2px; background: var(--pnav-yellow); transition: right .2s ease; }
.pnav-links a:hover::after, .pnav-links a[aria-current]::after { right: 0; }
.pnav-actions { display: flex; align-items: center; gap: 18px; }
.pnav-social { display: flex; align-items: center; gap: 14px; color: var(--pnav-blue); }
.pnav-social a { display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; color: var(--pnav-blue); transition: transform .2s ease, opacity .2s ease; }
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
  min-height: 44px; padding: 10px 20px;
  border-radius: 999px;
  white-space: nowrap;
  text-decoration: none;
  transition: transform .2s ease;
}
.pnav-cta:hover { transform: translateY(-2px); }
.pnav-cta-short { display: none; }
.pnav-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
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
    padding: 10px clamp(18px, 4vw, 48px) calc(22px + env(safe-area-inset-bottom));
    overscroll-behavior: contain;
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
  .pnav-drawer-social { display: flex; gap: 18px; padding-top: 12px; }
  .pnav-drawer-social a { display: inline-flex; align-items: center; gap: 6px; border: 0; font-size: 13px; }
}
@media (max-width: 640px) {
  .pnav { grid-template-columns: minmax(0,1fr) auto; padding: 9px 14px; }
  .pnav-brand-mark { height: 32px; }
  .pnav-actions { gap: 10px; }
  .pnav-social { display: none; }
  .pnav-cta { display: inline-flex; min-height: 44px; padding: 8px 13px; font-size: 12px; letter-spacing: .06em; }
  .pnav-cta-full { display: none; }
  .pnav-cta-short { display: inline; }
}
.pnav :where(a, button):focus-visible { outline: 3px solid var(--pnav-blue); outline-offset: 3px; }
`;
