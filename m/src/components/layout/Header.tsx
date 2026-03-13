import { Link, useLocation } from "react-router-dom";
import { Activity, BookOpen, Navigation } from "lucide-react";

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Activity },
    { path: "/routing", label: "Routing", icon: Navigation },
    { path: "/directory", label: "Directory", icon: BookOpen },
  ];

  return (
    <header className="bg-[hsl(var(--surface-dark))] border-b border-[hsl(var(--border-strong))] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[hsl(var(--brand))] rounded-sm flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-bold text-sm tracking-wide">EMS ROUTING</span>
            <span className="text-[hsl(var(--text-muted))] text-[10px] tracking-widest uppercase">Dispatch System</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[hsl(var(--brand))] text-black"
                    : "text-[hsl(var(--text-muted))] hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
