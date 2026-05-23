'use client';

import { useState, useEffect } from 'react';
import { Gem, Shield, Zap, TrendingUp, Building2, Star } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const features = [
  { icon: TrendingUp, text: 'Real-time inventory tracking' },
  { icon: Building2, text: 'Enterprise marble management' },
  { icon: Star, text: 'Trusted by 500+ dealers' },
];

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Branding + Illustration (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[44%] relative overflow-hidden bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950">
        {/* Marble vein SVG */}
        <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs><filter id="mblur"><feGaussianBlur stdDeviation="24"/></filter></defs>
            <path d="M0,200 C200,100 400,400 600,250 C800,100 1000,350 1400,200" stroke="#d4d4d4" strokeWidth="50" fill="none" filter="url(#mblur)" opacity="0.7"/>
            <path d="M-50,450 C200,550 400,250 550,500 C700,700 900,150 1200,550" stroke="#a3a3a3" strokeWidth="35" fill="none" filter="url(#mblur)" opacity="0.5"/>
            <path d="M-100,650 C150,750 350,500 550,680 C750,850 950,550 1300,700" stroke="#d4d4d4" strokeWidth="45" fill="none" filter="url(#mblur)" opacity="0.6"/>
          </svg>
        </div>
        {/* Ambient glows */}
        <div className="absolute -top-20 -right-20 w-[350px] h-[350px] rounded-full bg-amber-500/5 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-stone-400/5 blur-[80px]" />

        {/* Left panel content */}
        <div className="relative flex flex-col justify-between p-12 xl:p-16 w-full">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Gem className="w-5 h-5 text-stone-900" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">Marble Mart</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
              Premium Marble<br />
              <span className="text-amber-400">Management Platform</span>
            </h2>
            <p className="mt-4 text-stone-400 text-base leading-relaxed max-w-md">
              Streamline your marble business with real-time inventory, pipeline tracking, and intelligent insights.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-stone-400">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-amber-400/80" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Trust bar */}
          <div className="flex items-center gap-6 pt-6 border-t border-white/10">
            <span className="flex items-center gap-1.5 text-xs text-stone-500"><Shield className="w-3 h-3" /> SOC2</span>
            <span className="flex items-center gap-1.5 text-xs text-stone-500"><Zap className="w-3 h-3" /> 99.9% Uptime</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-stone-50 via-white to-amber-50/20">
        {/* Mobile-only logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Gem className="w-4 h-4 text-stone-900" />
          </div>
          <span className="text-stone-800 font-bold text-sm">Marble Mart</span>
        </div>

        <div className={`w-full max-w-[420px] transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {/* Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)] border border-stone-200/60 p-8 sm:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
              <p className="text-sm text-stone-500 mt-1.5">{subtitle}</p>
            </div>
            {children}
            {footer && (
              <p className="text-sm text-center text-stone-400 mt-6">{footer}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
