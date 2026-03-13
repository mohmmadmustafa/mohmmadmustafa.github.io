import { Link } from "react-router-dom";
import { Navigation, BookOpen, Radio, AlertCircle } from "lucide-react";
import heroImg from "@/assets/hero-ems.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      {/* Hero Section */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img
          src={heroImg}
          alt="EMS Dispatch Center"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[hsl(var(--bg))]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-5 h-5 text-[hsl(var(--brand))]" />
            <span className="text-[hsl(var(--brand))] text-sm font-bold tracking-widest uppercase">
              EMS Dispatch System
            </span>
          </div>
          <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight">
            Hospital Routing
            <span className="block text-[hsl(var(--brand))]">Decision Support</span>
          </h1>
          <p className="text-slate-300 mt-2 text-sm max-w-md">
            Select the optimal destination hospital based on case type, capabilities, and proximity.
          </p>
        </div>
      </div>

      {/* Main Actions */}
      <div className="max-w-2xl mx-auto px-4 py-8 -mt-4">
        <div className="grid gap-4">
          {/* Primary CTA */}
          <Link
            to="/routing"
            className="group relative overflow-hidden bg-[hsl(var(--brand))] rounded-xl p-6 flex items-center gap-4 hover:bg-[hsl(var(--brand-hover))] transition-all duration-200 shadow-lg shadow-[hsl(var(--brand))]/20"
          >
            <div className="w-14 h-14 bg-black/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Navigation className="w-7 h-7 text-black" />
            </div>
            <div>
              <h2 className="text-black font-bold text-xl">New Routing Decision</h2>
              <p className="text-black/70 text-sm mt-0.5">
                Enter incident location and case type to find the best hospital
              </p>
            </div>
            <div className="ml-auto text-black/50 text-2xl font-light">›</div>
          </Link>

          {/* Secondary CTA */}
          <Link
            to="/directory"
            className="group bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] rounded-xl p-6 flex items-center gap-4 hover:border-white/30 hover:bg-[hsl(var(--surface-hover))] transition-all duration-200"
          >
            <div className="w-14 h-14 bg-[hsl(var(--brand))]/10 border border-[hsl(var(--brand))]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-[hsl(var(--brand))]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Hospital Directory</h2>
              <p className="text-[hsl(var(--text-muted))] text-sm mt-0.5">
                Browse and filter all hospitals by capability and location
              </p>
            </div>
            <div className="ml-auto text-[hsl(var(--text-muted))] text-2xl font-light">›</div>
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { value: "34", label: "Hospitals" },
            { value: "28", label: "Case Types" },
            { value: "5", label: "Emirates" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-strong))] rounded-lg p-4 text-center"
            >
              <div className="text-[hsl(var(--brand))] font-bold text-2xl">{value}</div>
              <div className="text-[hsl(var(--text-muted))] text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* System Notice */}
        <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300 text-xs">
            This system provides routing recommendations only. Final destination decisions remain with the dispatcher and treating crew. Always verify hospital status before transport.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
