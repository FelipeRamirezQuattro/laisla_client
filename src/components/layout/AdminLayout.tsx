import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ServiceQuickNav } from './ServiceQuickNav';

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-paper overflow-hidden">
      <Sidebar />
      <div className="flex flex-col min-w-0 flex-1 overflow-hidden transition-all duration-300">
        <Topbar />
        <ServiceQuickNav />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
