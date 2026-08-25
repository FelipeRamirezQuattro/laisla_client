import { Link } from "react-router-dom";

export function PublicNavbar() {
  return (
    <>
      <style>{publicNavbarStyles}</style>
      <header className="home-nav">
        <Link to="/" className="brand-lockup" aria-label="La Isla Cafe">
          <img src="/images/brand/icono-color.png" alt="" className="brand-mark" />
          <span>
            <strong>La Isla</strong>
            <small>CAFE PICNIC</small>
          </span>
        </Link>
        <nav>
          <a href="/#mundos">Espacio</a>
          <Link to="/menu">Carta</Link>
          <a href="/#eventos">Eventos</a>
          <a href="/#visita">Visita</a>
        </nav>
        <Link to="/reservar/mesa" className="nav-cta">
          Reservar
        </Link>
      </header>
    </>
  );
}

const publicNavbarStyles = `
.home-nav {
  --home-text: #1A2480;
  --home-muted: rgba(26,36,128,.7);
  --home-bg: #FFFFFF;
  --home-rule: rgba(26,36,128,.2);
  --home-dark: #1A2480;
  --home-accent2: #F5A623;
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 18px clamp(18px, 4vw, 54px);
  background: rgba(255, 255, 255, .88);
  border-bottom: 1px solid var(--home-rule);
  backdrop-filter: blur(16px);
}
.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--home-text);
  text-decoration: none;
}
.brand-lockup strong {
  display: block;
  font-family: "DM Sans", system-ui, sans-serif;
  font-size: 26px;
  line-height: 1;
}
.brand-lockup small {
  display: block;
  color: var(--home-muted);
  font-size: 10px;
  letter-spacing: 4px;
  margin-top: 5px;
}
.brand-mark {
  display: block;
  height: 44px;
  width: auto;
}
.home-nav nav {
  display: flex;
  gap: 28px;
  font-size: 13px;
  font-weight: 700;
  color: var(--home-muted);
}
.home-nav nav a {
  color: var(--home-muted);
  text-decoration: none;
}
.nav-cta {
  justify-self: end;
  color: var(--home-bg);
  background: var(--home-dark);
  border-radius: 999px;
  padding: 11px 18px;
  font-weight: 800;
  font-size: 13px;
  text-decoration: none;
}
@media (max-width: 980px) {
  .home-nav { grid-template-columns: 1fr auto; }
  .home-nav nav { display: none; }
}
@media (max-width: 620px) {
  .home-nav { padding-inline: 14px; }
  .brand-lockup small { letter-spacing: 2px; }
  .nav-cta { padding-inline: 14px; }
}
`;
