import { Link } from "react-router-dom";

export function PublicNavbar() {
  return (
    <>
      <style>{publicNavbarStyles}</style>
      <header className="home-nav">
        <Link to="/" className="brand-lockup" aria-label="La Isla Cafe">
          <span className="brand-mark" />
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
  --home-ink: #1F2A1B;
  --home-muted: #6B7768;
  --home-paper: #FFF9EC;
  --home-rule: #E7DEC6;
  --home-espresso: #43593B;
  --home-maize: #F2D17E;
  --home-lagoon: #7CC1E7;
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
.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--home-ink);
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
  display: inline-block;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, var(--home-maize) 0 36%, var(--home-lagoon) 37% 100%);
  box-shadow: inset 0 0 0 1px rgba(31,42,27,.12);
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
  color: var(--home-paper);
  background: var(--home-espresso);
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
