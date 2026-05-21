import React from 'react';
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react';
import { cn } from '../utils/cn';

interface MobileShellProps {
  children: React.ReactNode;
  activeTab?: string;
}

export function MobileShell({ children, activeTab = 'home' }: MobileShellProps) {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl overflow-hidden border-x border-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <h1 className="text-xl font-bold tracking-tight text-indigo-600">Community</h1>
        <div className="flex gap-4">
          <Heart className="w-6 h-6 text-gray-700" />
          <Search className="w-6 h-6 text-gray-700" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around py-2 border-t border-gray-100 bg-white sticky bottom-0">
        <NavItem icon={<Home />} label="Home" active={activeTab === 'home'} />
        <NavItem icon={<Search />} label="Explore" active={activeTab === 'explore'} />
        <NavItem icon={<PlusSquare />} label="Post" active={activeTab === 'post'} />
        <NavItem icon={<Heart />} label="Activity" active={activeTab === 'activity'} />
        <NavItem icon={<User />} label="Profile" active={activeTab === 'profile'} />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={cn(
      "flex flex-col items-center gap-1 transition-colors",
      active ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
    )}>
      {React.cloneElement(icon as React.ReactElement<any>, {
        className: cn("w-6 h-6", active && "fill-current")
      })}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}
