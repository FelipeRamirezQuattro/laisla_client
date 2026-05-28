import { Outlet, Link, useLocation } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";

export function PublicLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  if (isHome) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <PublicNavbar />

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-espresso text-cream py-8">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <h2 className="font-body text-lg font-bold mb-2">La Isla Café</h2>
            <p className="text-sm text-cream text-opacity-70 font-body">
              El lugar donde Ibagué se encuentra a sí misma.
            </p>
          </div>
          <div>
            <h3 className="font-body font-semibold mb-2 text-sm">
              Experiencias
            </h3>
            <ul className="space-y-1 text-sm text-cream text-opacity-70 font-body">
              <li>
                <Link
                  to="/reservar/mesa"
                  className="hover:text-cream transition-colors"
                >
                  Reservar mesa
                </Link>
              </li>
              <li>
                <Link
                  to="/reservar/eventos"
                  className="hover:text-cream transition-colors"
                >
                  Eventos y experiencias
                </Link>
              </li>
              <li>
                <Link
                  to="/reservar/cena-con-desconocidos"
                  className="hover:text-cream transition-colors"
                >
                  Cena con Desconocidos
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-body font-semibold mb-2 text-sm">Contacto</h3>
            <p className="text-sm text-cream text-opacity-70 font-body">
              Ibagué, Tolima, Colombia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
