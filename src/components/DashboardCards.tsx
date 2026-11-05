import React from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { MonthSummary } from '../types';
import { formatEuro } from '../utils/formatters';

interface Props {
  summary: MonthSummary;
}

export const DashboardCards: React.FC<Props> = ({ summary }) => {
  const isAttivo = summary.saldoSenzaInvestimenti >= 0;

  return (
    <div className="space-y-2.5">
      {/* Hero Card compatto a singola riga */}
      <div
        className={`px-4 py-2.5 sm:py-3 rounded-2xl border backdrop-blur-md shadow-md flex items-center justify-between gap-2 ${
          isAttivo
            ? 'bg-emerald-950/40 border-emerald-500/30 shadow-emerald-950/20'
            : 'bg-rose-950/40 border-rose-500/30 shadow-rose-950/20'
        }`}
      >
        <span className="text-xs sm:text-sm uppercase tracking-wider font-black text-slate-200">
          Margine Senza Investimenti
        </span>
        <span
          className={`text-lg sm:text-2xl font-black tracking-tight font-mono shrink-0 ${
            isAttivo ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {formatEuro(summary.saldoSenzaInvestimenti)}
        </span>
      </div>

      {/* Grid 3 Carte: Entrate, Uscite (senza investimenti), Investiti */}
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

        {/* Uscite (esclusi investimenti) in rosso */}
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 sm:p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1 text-rose-400 text-xs font-bold mb-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Uscite</span>
          </div>
          <div className="text-sm sm:text-base font-extrabold text-rose-400 truncate font-mono">
            {formatEuro(summary.totalUscite - summary.totalInvestimenti)}
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
