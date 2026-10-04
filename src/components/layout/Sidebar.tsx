import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { alertasInvApi } from "../../api/inventario";
import { fiscalApi } from "../../api/fiscal";
import { printingAlertsApi } from "../../api/printing";
import { useUiStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/authStore";
import {
  ADMIN_NAV,
  isAdminNavGroup,
  isAdminNavLeaf,
  type AdminNavLeaf,
  type AdminNavGroup,
} from "../../config/adminNav";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="bg-error text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
      {count}
    </span>
  );
}

function NavItem({ to, label, Icon, end, badgeCount }: AdminNavLeaf & { badgeCount?: number }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center justify-between px-6 py-2.5 text-sm font-body transition-all duration-200 ${
          isActive
            ? "bg-white text-island-dark font-medium"
            : "text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10"
        }`
      }
    >
      <span className="flex items-center gap-3">
        <Icon size={16} strokeWidth={1.75} />
        {label}
      </span>
      {badgeCount ? <Badge count={badgeCount} /> : null}
    </NavLink>
  );
}

function NavGroup({
  group,
  agotadoCount,
  fiscalCount,
  printingCount,
  defaultOpen,
}: {
  group: AdminNavGroup;
  agotadoCount: number;
  fiscalCount: number;
  printingCount: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const badgeCounts = { agotado: agotadoCount, fiscal: fiscalCount, printing: printingCount };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-6 py-2.5 text-sm font-body text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200"
      >
        <span className="flex items-center gap-3">
          <group.Icon size={16} strokeWidth={1.75} />
          {group.label}
          {group.badge && <Badge count={badgeCounts[group.badge]} />}
        </span>
        {open ? (
          <ChevronUp size={14} className="opacity-60" />
        ) : (
          <ChevronDown size={14} className="opacity-60" />
        )}
      </button>

      {open && (
        <div className="pl-4">
          {group.items.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              badgeCount={item.badge ? badgeCounts[item.badge] : undefined}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function Sidebar() {
  const { sidebarOpen } = useUiStore();
  const { isAdmin, isSuperAdmin } = useAuthStore();
  const location = useLocation();
  const [agotadoCount, setAgotadoCount] = useState(0);
  const [fiscalCount, setFiscalCount] = useState(0);
  const [printingCount, setPrintingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    alertasInvApi
      .getAll()
      .then((res) =>
        setAgotadoCount(
          res.data.filter((a) => a.detalle.nivel === "AGOTADO").length,
        ),
      )
      .catch(() => {});
  }, [location.pathname, isAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fiscalApi
      .getHealth()
      .then((res) =>
        setFiscalCount(
          (res.data.documentsByStatus.ERROR ?? 0) + (res.data.documentsByStatus.CONTINGENCY ?? 0),
        ),
      )
      .catch(() => {});
  }, [location.pathname, isSuperAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    printingAlertsApi
      .get()
      .then((res) => {
        const alerts = res.data;
        const flags = [alerts.noCajaPrinter, alerts.agentsOffline].filter(Boolean).length;
        setPrintingCount(alerts.failedJobsCount + flags);
      })
      .catch(() => {});
  }, [location.pathname, isAdmin]);

  const canSeeGroup = (group: AdminNavGroup) =>
    group.gate === "superadmin" ? isSuperAdmin : group.gate === "admin" ? isAdmin : true;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden"
          onClick={() => useUiStore.getState().setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 shrink-0 bg-gray-900 text-white z-30 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0 lg:static" : "-translate-x-full lg:hidden"}
          shadow-xl lg:shadow-none
        `}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white border-opacity-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/images/brand/icono-blanco.png"
              alt=""
              className="h-12 w-12 shrink-0"
            />
            <div>
              <h1 className="font-body text-xl font-bold text-white">
                La Isla
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => useUiStore.getState().setSidebarOpen(false)}
            className="rounded-lg p-1 text-white text-opacity-70 hover:bg-white hover:bg-opacity-10 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {ADMIN_NAV.filter(isAdminNavLeaf)
            .filter((item) => !item.hidden)
            .map((item) => (
              <NavItem key={item.to} {...item} />
            ))}

          {/* Divider */}
          <div className="mx-6 my-3 border-t border-white border-opacity-10" />

          {ADMIN_NAV.filter(isAdminNavGroup)
            .filter(canSeeGroup)
            .map((group) => {
              const defaultOpen = location.pathname.startsWith(
                group.openMatch ?? group.items[0]?.to ?? "",
              ) || group.items.some((item) => location.pathname.startsWith(item.to));
              return (
                <NavGroup
                  key={group.id}
                  group={group}
                  agotadoCount={agotadoCount}
                  fiscalCount={fiscalCount}
                  printingCount={printingCount}
                  defaultOpen={defaultOpen}
                />
              );
            })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white border-opacity-10">
          <p className="text-xs text-white text-opacity-40 font-body">
            La Isla Café Picnic © {new Date().getFullYear()}
          </p>
          <p className="text-xs text-white text-opacity-30 font-body">
            Ibagué, Colombia
          </p>
        </div>
      </aside>
    </>
  );
}
