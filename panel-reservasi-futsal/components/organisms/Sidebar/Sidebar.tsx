'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, ClipboardList, LogOut } from 'lucide-react';
import { NavItem } from '@/components/molecules';
import { Text } from '@/components/atoms';
import { useUIStore, useAuthStore } from '@/stores';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Calendar, label: 'Kelola Lapangan', href: '/admin/fields' },
  { icon: ClipboardList, label: 'Kelola Pesanan', href: '/admin/orders' },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeNav, setActiveNav } = useUIStore();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-primary to-primary-dark min-h-screen p-6 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white w-7 h-7"
          >
            {/* Cone / feathers outline */}
            <path d="M7 16L12 4l5 12" />
            {/* Cork base */}
            <path d="M9 16a3 3 0 0 0 6 0" fill="currentColor" />
            {/* Inner feather lines */}
            <path d="M10 16L12 4M14 16L12 4" />
            {/* Bands */}
            <path d="M8 12h8" />
            <path d="M8.5 9h7" />
          </svg>
        </div>
        <div>
          <Text variant="body" color="white" className="font-bold text-lg leading-tight">
            Gor Tambora jakarta barat
          </Text>
          <Text variant="caption" color="white" className="opacity-80">
            Admin Panel
          </Text>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={activeNav === item.href || pathname === item.href}
            onClick={() => setActiveNav(item.href)}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-white/20">
        <NavItem
          icon={LogOut}
          label="Logout"
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
}