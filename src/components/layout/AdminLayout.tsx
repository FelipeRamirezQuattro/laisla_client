import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ServiceQuickNav } from './ServiceQuickNav';

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-white overflow-hidden print:h-auto print:block print:overflow-visible">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden transition-all duration-300 print:block print:overflow-visible">
        <div className="print:hidden">
          <Topbar />
          <ServiceQuickNav />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
