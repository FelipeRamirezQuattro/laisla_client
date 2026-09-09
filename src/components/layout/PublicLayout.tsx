import { Outlet } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";
import { HomeFooter } from "../../pages/public/home/HomeFooter";
import { WhatsAppButton } from "../WhatsAppButton";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <PublicNavbar />

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Shared footer for every public page — li-home scopes the "Playa de
          Cuaderno" CSS custom properties HomeFooter's styles rely on. */}
      <div className="li-home">
        <HomeFooter />
      </div>

      <WhatsAppButton />
    </div>
  );
}
