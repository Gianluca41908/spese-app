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
      <div className={`p-4 rounded-2xl border backdrop-blur-md transition-all shadow-lg ${
        summary.saldoSenzaInvestimenti >= 0
          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100 shadow-emerald-950/30'
          : 'bg-rose-950/40 border-rose-500/30 text-rose-100 shadow-rose-950/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${
              summary.saldoSenzaInvestimenti >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-300">
                Margine Senza Investimenti
              </span>
              <p className="text-[11px] text-slate-300 opacity-80">
                Entrate Ordinarie meno Spese Vive (esclude PAC, titoli e rimborsi)
              </p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
            summary.saldoSenzaInvestimenti >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`}>
            {summary.saldoSenzaInvestimenti >= 0 ? 'In Attivo' : 'In Deficit'}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-3xl font-extrabold tracking-tight">
            {formatEuro(summary.saldoSenzaInvestimenti)}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Margine netto reale
          </div>
        </div>
      </div>

      {/* Grid 3 Carte: Entrate, Uscite Totali, Saldo Netto */}
      <div className="grid grid-cols-3 gap-2">
        {/* Entrate */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium mb-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Entrate</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white truncate">
            {formatEuro(summary.totalEntrate)}
          </div>
        </div>

        {/* Uscite Totali */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-1 text-rose-400 text-xs font-medium mb-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Uscite Tot.</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white truncate">
            {formatEuro(summary.totalUscite)}
          </div>
        </div>

        {/* Investimenti / PAC */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-1 text-cyan-400 text-xs font-medium mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Investiti</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white truncate">
            {formatEuro(summary.totalInvestimenti)}
          </div>
        </div>
      </div>
    </div>
  );
};
