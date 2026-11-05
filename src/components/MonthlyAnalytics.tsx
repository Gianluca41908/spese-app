import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Building2,
  Zap,
  ShieldCheck,
  Car,
  UtensilsCrossed,
  ShoppingBag,
  TrendingUp,
  ArrowLeftRight,
  Briefcase,
  Coins,
  MoreHorizontal,
  ChevronDown,
  PieChart,
  BarChart3,
  Percent,
  CheckCircle2,
  Circle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import { Transaction, MonthSummary, CategoryKey } from '../types';
import { CATEGORIES } from '../constants';
import { getSmartTitle } from '../utils/transactionFormatters';

interface Props {
  transactions: Transaction[];
  allTransactions: Transaction[];
  monthLabel: string;
  selectedYearMonth: string;
  summary: MonthSummary;
  onEditTransaction?: (tx: Transaction) => void;
}

const CATEGORY_STYLES: Record<
  string,
  { hex: string; bg: string; text: string; border: string; bar: string }
> = {
  supermercato: {
    hex: '#10b981',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bar: 'bg-emerald-500',
  },
  condominio: {
    hex: '#3b82f6',
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    bar: 'bg-blue-500',
  },
  utenze: {
    hex: '#f59e0b',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    bar: 'bg-amber-500',
  },
  assicurazioni: {
    hex: '#6366f1',
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    bar: 'bg-indigo-500',
  },
  auto: {
    hex: '#f43f5e',
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    bar: 'bg-rose-500',
  },
  svago: {
    hex: '#a855f7',
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    bar: 'bg-purple-500',
  },
  shopping: {
    hex: '#ec4899',
    bg: 'bg-pink-500/20',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
    bar: 'bg-pink-500',
  },
  investimenti: {
    hex: '#06b6d4',
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bar: 'bg-cyan-500',
  },
  trasferimenti: {
    hex: '#94a3b8',
    bg: 'bg-slate-500/20',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
    bar: 'bg-slate-400',
  },
  stipendio: {
    hex: '#22c55e',
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
    bar: 'bg-green-500',
  },
  rendite: {
    hex: '#14b8a6',
    bg: 'bg-teal-500/20',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
    bar: 'bg-teal-500',
  },
  altro: {
    hex: '#64748b',
    bg: 'bg-slate-600/20',
    text: 'text-slate-400',
    border: 'border-slate-600/30',
    bar: 'bg-slate-500',
  },
};

export const MonthlyAnalytics: React.FC<Props> = ({
  transactions,
  allTransactions,
  monthLabel,
  selectedYearMonth,
  summary,
  onEditTransaction,
}) => {
  // Toggle per escludere o includere gli investimenti nel calcolo di incidenza
  const [excludeInvestments, setExcludeInvestments] = useState(true);
  // Categoria selezionata (per highlight nel Donut o espansione)
  const [selectedCatKey, setSelectedCatKey] = useState<string | null>(null);
  // Categoria espansa per vedere l'elenco dei singoli movimenti
  const [expandedCatKey, setExpandedCatKey] = useState<string | null>(null);

  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const getCategoryIcon = (key: string, className = 'w-4 h-4') => {
    switch (key) {
      case 'supermercato':
        return <ShoppingCart className={className} />;
      case 'condominio':
        return <Building2 className={className} />;
      case 'utenze':
        return <Zap className={className} />;
      case 'assicurazioni':
        return <ShieldCheck className={className} />;
      case 'auto':
        return <Car className={className} />;
      case 'svago':
        return <UtensilsCrossed className={className} />;
      case 'shopping':
        return <ShoppingBag className={className} />;
      case 'investimenti':
        return <TrendingUp className={className} />;
      case 'trasferimenti':
        return <ArrowLeftRight className={className} />;
      case 'stipendio':
        return <Briefcase className={className} />;
      case 'rendite':
        return <Coins className={className} />;
      case 'altro':
      default:
        return <MoreHorizontal className={className} />;
    }
  };

  // 1. Filtra uscite in base al toggle "Escludi Investimenti"
  const relevantExpenses = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'uscita') return false;
      if (excludeInvestments && (t.isInvestment || t.category === 'investimenti')) {
        return false;
      }
      return true;
    });
  }, [transactions, excludeInvestments]);

  // Totale spese considerate
  const totalExpenses = useMemo(() => {
    return relevantExpenses.reduce((sum, t) => sum + t.amount, 0);
  }, [relevantExpenses]);

  // 2. Raggruppa per categoria e calcola incidenza %
  const categoryStats = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        total: number;
        count: number;
        percentage: number;
        items: Transaction[];
      }
    >();

    relevantExpenses.forEach((tx) => {
      const catKey = tx.category || 'altro';
      const existing = map.get(catKey);
      if (existing) {
        existing.total += tx.amount;
        existing.count += 1;
        existing.items.push(tx);
      } else {
        const catInfo = CATEGORIES[catKey as CategoryKey];
        map.set(catKey, {
          key: catKey,
          label: catInfo ? catInfo.label : catKey,
          total: tx.amount,
          count: 1,
          percentage: 0,
          items: [tx],
        });
      }
    });

    // Calcolo % di incidenza
    const list = Array.from(map.values()).map((c) => ({
      ...c,
      percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0,
    }));

    // Ordina per spesa decrescente
    list.sort((a, b) => b.total - a.total);
    return list;
  }, [relevantExpenses, totalExpenses]);

  // 3. Calcolo spicchi per il Donut SVG
  // Radius = 70, Circumference = 2 * PI * 70 = 439.82297
  const donutRadius = 70;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const donutSlices = useMemo(() => {
    let accumulatedOffset = 0;
    return categoryStats.map((cat) => {
      const strokeLength = (cat.percentage / 100) * donutCircumference;
      const strokeDasharray = `${strokeLength} ${donutCircumference - strokeLength}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;

      const style = CATEGORY_STYLES[cat.key] || CATEGORY_STYLES.altro;

      return {
        ...cat,
        strokeDasharray,
        strokeDashoffset,
        color: style.hex,
      };
    });
  }, [categoryStats, donutCircumference]);

  // Categoria selezionata per il centro del Donut
  const activeCatInfo = useMemo(() => {
    if (!selectedCatKey) return null;
    return categoryStats.find((c) => c.key === selectedCatKey) || null;
  }, [selectedCatKey, categoryStats]);

  // 4. Trend Ultimi 6 Mesi per confronto
  const monthlyTrend = useMemo(() => {
    const monthMap = new Map<
      string,
      { ym: string; label: string; usciteVive: number; investiti: number; entrate: number }
    >();

    allTransactions.forEach((t) => {
      const ym = t.date.substring(0, 7);
      if (!monthMap.has(ym)) {
        const [yStr, mStr] = ym.split('-');
        const d = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, 1);
        const shortMonth = d.toLocaleDateString('it-IT', { month: 'short' });
        monthMap.set(ym, {
          ym,
          label: `${shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1)} '${yStr.slice(2)}`,
          usciteVive: 0,
          investiti: 0,
          entrate: 0,
        });
      }
      const data = monthMap.get(ym)!;
      if (t.type === 'entrata') {
        data.entrate += t.amount;
      } else {
        if (t.isInvestment || t.category === 'investimenti') {
          data.investiti += t.amount;
        } else {
          data.usciteVive += t.amount;
        }
      }
    });

    const sortedMonths = Array.from(monthMap.values()).sort((a, b) => a.ym.localeCompare(b.ym));
    // Prendi gli ultimi 6 mesi
    return sortedMonths.slice(-6);
  }, [allTransactions]);

  const maxTrendExpense = useMemo(() => {
    return Math.max(...monthlyTrend.map((m) => m.usciteVive + m.investiti), 100);
  }, [monthlyTrend]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Riepilogo & Filtro Investimenti */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Analisi Categorie
              </h2>
              <p className="text-xs text-slate-400 font-medium">{monthLabel}</p>
            </div>
          </div>

          {/* Badge Totale Spese */}
          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold block">Totale Analizzato</span>
            <span className="font-mono font-black text-base sm:text-lg text-rose-400">
              {formatEuro(totalExpenses)}
            </span>
          </div>
        </div>

        {/* Toggle Escludi Investimenti vs Tutte le Uscite */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setExcludeInvestments(true)}
            className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              excludeInvestments
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Spese Vive</span>
            <span className="text-[10px] opacity-80">(escl. PAC)</span>
          </button>
          <button
            type="button"
            onClick={() => setExcludeInvestments(false)}
            className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              !excludeInvestments
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Tutte le Uscite</span>
            <span className="text-[10px] opacity-80">(con PAC)</span>
          </button>
        </div>
      </div>

      {/* Se non ci sono spese nel mese selezionato */}
      {categoryStats.length === 0 ? (
        <div className="py-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <PieChart className="w-10 h-10 mx-auto text-slate-500 mb-2 stroke-1" />
          <p className="text-sm font-bold text-slate-300">Nessuna spesa da analizzare</p>
          <p className="text-xs text-slate-400 mt-1">
            Nessun movimento di uscita registrato per il mese selezionato ({monthLabel}).
          </p>
        </div>
      ) : (
        <>
          {/* 2. Grafico Donut SVG Interattivo */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md">
            <div className="text-center mb-1">
              <span className="text-xs uppercase tracking-wider font-black text-slate-400">
                Ripartizione Grafica Spese
              </span>
            </div>

            <div className="relative flex items-center justify-center py-2">
              <svg
                viewBox="0 0 200 200"
                className="w-52 h-52 sm:w-60 sm:h-60 transform -rotate-90 filter drop-shadow-lg"
              >
                {/* Traccia di sfondo vuota */}
                <circle
                  cx="100"
                  cy="100"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth="22"
                />

                {/* Spicchi colorati proporzionali */}
                {donutSlices.map((slice) => {
                  const isSelected = selectedCatKey === slice.key;
                  return (
                    <circle
                      key={slice.key}
                      cx="100"
                      cy="100"
                      r={donutRadius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={isSelected ? '26' : '22'}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="cursor-pointer transition-all duration-300 hover:opacity-90"
                      onClick={() =>
                        setSelectedCatKey(selectedCatKey === slice.key ? null : slice.key)
                      }
                    />
                  );
                })}
              </svg>

              {/* Centro del Donut: Dettaglio al Tocco / Totale Generale */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
                style={{ transform: 'none' }}
              >
                {activeCatInfo ? (
                  <>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 line-clamp-1 max-w-[120px]">
                      {activeCatInfo.label.split(' ')[0]}
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono text-white tracking-tight">
                      {formatEuro(activeCatInfo.total)}
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      {activeCatInfo.percentage.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Totale Mese
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono text-white tracking-tight">
                      {formatEuro(totalExpenses)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {categoryStats.length} Categorie
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Chips Legenda Rapida Toccabile */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-slate-800/80">
              {categoryStats.slice(0, 6).map((cat) => {
                const style = CATEGORY_STYLES[cat.key] || CATEGORY_STYLES.altro;
                const isSelected = selectedCatKey === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() =>
                      setSelectedCatKey(selectedCatKey === cat.key ? null : cat.key)
                    }
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-md scale-105'
                        : `${style.bg} ${style.text} border ${style.border} hover:opacity-90`
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: style.hex }}
                    />
                    <span>{cat.label.split(' ')[0]}</span>
                    <span className="font-mono text-[11px] opacity-90">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Classifica e Incidenza Dettagliata di Ogni Categoria */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs uppercase tracking-wider font-black text-slate-300">
                Incidenza Categorie ({categoryStats.length})
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Tocca per vedere i singoli movimenti
              </span>
            </div>

            <div className="space-y-2.5">
              {categoryStats.map((cat, idx) => {
                const style = CATEGORY_STYLES[cat.key] || CATEGORY_STYLES.altro;
                const isExpanded = expandedCatKey === cat.key;
                const isHighlighted = selectedCatKey === cat.key;

                return (
                  <div
                    key={cat.key}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isHighlighted
                        ? 'bg-slate-900 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-lg'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    {/* Header Card Categoria (Cliccabile) */}
                    <div
                      onClick={() => {
                        setExpandedCatKey(isExpanded ? null : cat.key);
                        setSelectedCatKey(cat.key);
                      }}
                      className="p-3 sm:p-3.5 cursor-pointer space-y-2"
                    >
                      {/* Riga 1: Icona + Nome + Importo + Percentuale */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank badge */}
                          <span className="font-mono font-bold text-xs text-slate-300 w-4">
                            #{idx + 1}
                          </span>

                          {/* Icona */}
                          <div
                            className={`p-2 rounded-xl shrink-0 ${style.bg} ${style.text} border ${style.border}`}
                          >
                            {getCategoryIcon(cat.key, 'w-4 h-4')}
                          </div>

                          {/* Nome categoria */}
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-white block truncate">
                              {cat.label}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {cat.count} {cat.count === 1 ? 'spesa' : 'spese'} • media{' '}
                              {formatEuro(cat.total / cat.count)}
                            </span>
                          </div>
                        </div>

                        {/* Importo e Percentuale di Incidenza */}
                        <div className="text-right shrink-0">
                          <div className="font-mono font-black text-sm sm:text-base text-rose-400">
                            {formatEuro(cat.total)}
                          </div>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${style.bg} ${style.text} border ${style.border}`}
                          >
                            {cat.percentage.toFixed(1)}% incidenza
                          </span>
                        </div>
                      </div>

                      {/* Barra Orizzontale Proporzionale di Incidenza */}
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Accordion Espandibile: Lista Movimenti di Questa Categoria */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/70 space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-1">
                          <span>Movimenti registrati in "{cat.label}"</span>
                          <span>{cat.items.length} voci</span>
                        </div>

                        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                          {cat.items.map((item) => (
                            <div
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEditTransaction) onEditTransaction(item);
                              }}
                              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">
                                  {getSmartTitle(item.description, item.notes)}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {formatDate(item.date)}
                                  {item.isFixed && ' • Fissa'}
                                  {!item.isSettled && ' • In attesa'}
                                </p>
                              </div>
                              <span className="font-mono font-bold text-xs text-rose-400 shrink-0">
                                -{formatEuro(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Ripartizione Entrate vs Spese vs Risparmio (se entrate > 0) */}
          {summary.totalEntrate > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-black text-slate-300">
                  Destinazione Entrate Mese
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {formatEuro(summary.totalEntrate)} incassate
                </span>
              </div>

              {/* Barra segmentata */}
              {(() => {
                const usciteVive = Math.max(0, summary.totalUscite - summary.totalInvestimenti);
                const investiti = summary.totalInvestimenti;
                const risparmio = Math.max(0, summary.saldoNetto);

                const pctVive = Math.min(100, (usciteVive / summary.totalEntrate) * 100);
                const pctInv = Math.min(100, (investiti / summary.totalEntrate) * 100);
                const pctRisparmio = Math.max(0, 100 - pctVive - pctInv);

                return (
                  <div className="space-y-2">
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex border border-slate-800">
                      <div
                        className="bg-rose-500 h-full transition-all"
                        style={{ width: `${pctVive}%` }}
                        title={`Spese Vive: ${pctVive.toFixed(1)}%`}
                      />
                      <div
                        className="bg-cyan-500 h-full transition-all"
                        style={{ width: `${pctInv}%` }}
                        title={`Investiti: ${pctInv.toFixed(1)}%`}
                      />
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${pctRisparmio}%` }}
                        title={`Risparmio netto: ${pctRisparmio.toFixed(1)}%`}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] pt-1">
                      <div className="p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-rose-400 font-bold block">Spese Vive</span>
                        <span className="font-mono font-bold text-slate-200">
                          {pctVive.toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-cyan-400 font-bold block">Investiti</span>
                        <span className="font-mono font-bold text-slate-200">
                          {pctInv.toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-emerald-400 font-bold block">Risparmio</span>
                        <span className="font-mono font-bold text-slate-200">
                          {pctRisparmio.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 5. Trend Storico Spese (Ultimi 6 Mesi) */}
          {monthlyTrend.length > 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs uppercase tracking-wider font-black text-slate-300">
                    Confronto Ultimi 6 Mesi
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Uscite mensili</span>
              </div>

              {/* Barre di confronto per ciascun mese */}
              <div className="grid grid-cols-6 gap-2 pt-2 items-end h-32">
                {monthlyTrend.map((m) => {
                  const totalMese = m.usciteVive + m.investiti;
                  const heightPct = Math.max(12, Math.round((totalMese / maxTrendExpense) * 100));
                  const isCurrent = m.ym === selectedYearMonth;

                  return (
                    <div
                      key={m.ym}
                      className="flex flex-col items-center justify-end h-full gap-1 group"
                      title={`${m.label}: Spese ${formatEuro(totalMese)}`}
                    >
                      <span className="text-[10px] font-mono text-slate-400 font-semibold truncate max-w-full">
                        {Math.round(totalMese)}€
                      </span>
                      <div className="w-full bg-slate-950 rounded-lg p-0.5 h-20 flex items-end">
                        <div
                          className={`w-full rounded-md transition-all ${
                            isCurrent
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-950'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-bold truncate max-w-full ${
                          isCurrent ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {m.label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
