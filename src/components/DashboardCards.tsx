import React from 'react';
import { ArrowDownRight, ArrowUpRight, ShieldCheck, TrendingUp } from 'lucide-react';
import { MonthSummary } from '../types';

interface Props {
  summary: MonthSummary;
}

export const DashboardCards: React.FC<Props> = ({ summary }) => {
  const formatEuro = (num: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-3">
      {/* Hero Card: Margine del mese esclusi gli investimenti finanziari */}
      <div
        className={`p-4 rounded-3xl border backdrop-blur-md transition-all shadow-xl ${
          summary.saldoSenzaInvestimenti >= 0
            ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-50 shadow-emerald-950/40'
            : 'bg-rose-950/70 border-rose-500/40 text-rose-50 shadow-rose-950/40'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-2xl shrink-0 ${
                summary.saldoSenzaInvestimenti >= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs uppercase tracking-wider font-black text-emerald-300 block">
                Margine Senza Investimenti
              </span>
              <p className="text-xs text-slate-200 mt-0.5 leading-snug font-normal">
                Entrate ordinarie meno spese vive (escl. BOT e PAC)
              </p>
            </div>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-black uppercase shrink-0 border ${
              summary.saldoSenzaInvestimenti >= 0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
            }`}
          >
            {summary.saldoSenzaInvestimenti >= 0 ? 'In Attivo' : 'In Deficit'}
          </span>
        </div>

        <div className="mt-3.5 pt-3 border-t border-emerald-500/20 flex items-baseline justify-between gap-2">
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
            {formatEuro(summary.saldoSenzaInvestimenti)}
          </div>
          <div className="text-xs text-slate-300 font-bold">
            Margine netto reale
          </div>
        </div>
      </div>

      {/* Grid 3 Carte: Entrate, Uscite Totali, Investiti */}
      <div className="grid grid-cols-3 gap-2">
        {/* Entrate */}
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 sm:p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Entrate</span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-white truncate font-mono">
            {formatEuro(summary.totalEntrate)}
          </div>
        </div>

        {/* Uscite Totali */}
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 sm:p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1 text-rose-400 text-xs font-bold mb-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Uscite Tot.</span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-white truncate font-mono">
            {formatEuro(summary.totalUscite)}
          </div>
        </div>

        {/* Investimenti / PAC */}
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 sm:p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Investiti</span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-white truncate font-mono">
            {formatEuro(summary.totalInvestimenti)}
          </div>
        </div>
      </div>
    </div>
  );
};
