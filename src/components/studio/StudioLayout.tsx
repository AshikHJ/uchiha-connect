import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UcMonogram } from '../common/UcLogo';
import { BRAND } from '../../config/brand';
import {
  LayoutDashboard,
  Users,
  Layers,
  QrCode,
  Settings,
  LogOut,
  Sparkles,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface StudioLayoutProps {
  onOpenCreateModal?: () => void;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({ onOpenCreateModal }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/studio');
  };

  const navItems = [
    { to: '/studio', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/studio/participants', label: 'Participants', icon: Users },
    { to: '/studio/templates', label: 'Templates', icon: Layers },
    { to: '/studio/qr', label: 'QR Manager', icon: QrCode },
    { to: '/studio/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-brand-warmWhite flex flex-col antialiased">
      {/* Top Header Navbar */}
      <header className="h-16 bg-brand-surface border-b border-brand-border sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <NavLink to="/studio" className="flex items-center gap-3 group">
            <UcMonogram size={38} variant="crimson" className="group-hover:scale-105 transition-transform shadow-sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black tracking-tight text-lg text-brand-black block leading-none">
                  UCHIHA CONNECT
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded font-mono bg-brand-crimsonLight text-brand-crimson">
                  UC
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-crimson leading-none mt-1 block">
                STUDIO
              </span>
            </div>
          </NavLink>

          <span className="hidden md:inline-block px-3 py-1 rounded-full bg-brand-cream border border-brand-border text-[11px] font-semibold text-brand-charcoal">
            {BRAND.tagline}
          </span>
        </div>

        {/* Right Header Navigation & Actions */}
        <div className="flex items-center gap-3">
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus size={15} />
              <span>+ CREATE NEW CARD</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-brand-mutedGrey hover:text-brand-black hover:bg-brand-warmWhite transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Lock / Logout Organizer Session"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-brand-surface border-r border-brand-border p-4 hidden md:flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-mutedGrey">
              Main Menu
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-black text-white shadow-sm'
                      : 'text-brand-charcoal hover:bg-brand-warmWhite hover:text-brand-black'
                  }`
                }
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Quick Slot Summary Box */}
          <div className="p-3.5 rounded-2xl bg-brand-warmWhite border border-brand-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-brand-black">UCHIHA CONNECT</span>
              <span className="text-[10px] font-mono text-brand-crimson font-bold">
                30 Slots
              </span>
            </div>
            <p className="text-[10px] text-brand-mutedGrey leading-relaxed">
              One Identity. Every Connection. 30 personalized cards, QRs, and public URLs.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
