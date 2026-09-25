import { useState } from 'react';
import {
  Wallet, LayoutDashboard, ArrowLeftRight, Users, Tags,
  FileBarChart, Shield, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DashboardPage from '@/pages/DashboardPage';
import TransactionsPage from '@/pages/TransactionsPage';
import MembersPage from '@/pages/MembersPage';
import CategoriesPage from '@/pages/CategoriesPage';
import ReportsPage from '@/pages/ReportsPage';
import AdminPage from '@/pages/AdminPage';

type PageKey = 'dashboard' | 'transactions' | 'members' | 'categories' | 'reports' | 'admin';

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isBendahara = profile?.role === 'bendahara';

  const navItems: { key: PageKey; label: string; icon: typeof Wallet; show: boolean }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { key: 'transactions', label: 'Transaksi', icon: ArrowLeftRight, show: true },
    { key: 'members', label: 'Anggota', icon: Users, show: true },
    { key: 'categories', label: 'Kategori', icon: Tags, show: true },
    { key: 'reports', label: 'Laporan', icon: FileBarChart, show: true },
    { key: 'admin', label: 'Manajemen Admin', icon: Shield, show: isBendahara },
  ];

  const visibleNav = navItems.filter((n) => n.show);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Sistem Kas</h2>
              <p className="text-xs text-slate-400">Manajemen Dana</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setPage(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 bg-slate-900 text-white px-4 py-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">Sistem Kas</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'transactions' && <TransactionsPage />}
          {page === 'members' && <MembersPage />}
          {page === 'categories' && <CategoriesPage />}
          {page === 'reports' && <ReportsPage isAdmin={isAdmin} />}
          {page === 'admin' && isBendahara && <AdminPage />}
        </main>
      </div>
    </div>
  );
}
