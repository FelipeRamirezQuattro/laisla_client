import { Outlet, Link, useLocation } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";

export function PublicLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <PublicNavbar />

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer — HomePage renders its own richer footer, skip the generic one there */}
      {!isHome && (
      <footer
        className="bg-island-blue text-sand py-10"
        style={{ fontFamily: '"Nunito", sans-serif' }}
      >
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <img
              src="/images/brand/logo-secundario-blanco.png"
              alt="La Isla Café Picnic"
              className="h-20 w-auto mb-3"
            />
            <p className="text-sm text-sand text-opacity-80">
              El lugar donde Ibagué se encuentra a sí misma.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-xs uppercase tracking-widest text-sun-yellow">
              Experiencias
            </h3>
            <ul className="space-y-2 text-sm text-sand text-opacity-80">
              <li>
                <Link
                  to="/reservar/mesa"
                  className="hover:text-sun-yellow transition-colors"
                >
                  Reservar mesa
                </Link>
              </li>
              <li>
                <Link
                  to="/reservar/eventos"
                  className="hover:text-sun-yellow transition-colors"
                >
                  Eventos y experiencias
                </Link>
              </li>
              <li>
                <Link
                  to="/reservar/cena-con-desconocidos"
                  className="hover:text-sun-yellow transition-colors"
                >
                  Cena con Desconocidos
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3 text-xs uppercase tracking-widest text-sun-yellow">
              Contacto
            </h3>
            <p className="text-sm text-sand text-opacity-80">
              Cra 4C # 41-25, Barrio La Macarena Parte Baja
              <br />
              Ibagué, Tolima, Colombia
            </p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
