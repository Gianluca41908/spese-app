import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Wallet,
  Coins,
  Plus,
  Pencil,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Layers,
  PieChart,
  Calendar,
  CheckCircle2,
  DollarSign,
  Info,
} from 'lucide-react';
import { PortfolioData, PortfolioAsset, AssetClassType, Transaction } from '../types';
import {
  getPortfolioData,
  updateLiquidity,
  upsertAsset,
  deleteAsset,
} from '../services/portfolioStorage';
import { EditAssetModal } from './EditAssetModal';

interface Props {
  allTransactions: Transaction[];
}

const CLASS_CONFIG: Record<
  AssetClassType,
  { label: string; color: string; hex: string; bg: string; border: string; text: string }
> = {
  liquidita: {
    label: 'Liquidità Conto',
    color: 'cyan',
    hex: '#06b6d4',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
  },
  obbligazioni: {
    label: 'Obbligazioni (BTP/BOT)',
    color: 'amber',
    hex: '#f59e0b',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
  },
  etf: {
    label: 'ETF (Azionari/Tematici)',
    color: 'emerald',
    hex: '#10b981',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
  },
  azioni: {
    label: 'Azioni Singole',
    color: 'purple',
    hex: '#a855f7',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
  },
  altro: {
    label: 'Altro',
    color: 'slate',
    hex: '#64748b',
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/40',
    text: 'text-slate-400',
  },
};

export const PortfolioView: React.FC<Props> = ({ allTransactions }) => {
  const [portfolio, setPortfolio] = useState<PortfolioData>(() => getPortfolioData());
  const [selectedClass, setSelectedClass] = useState<AssetClassType | 'all'>('all');
  const [editingAsset, setEditingAsset] = useState<PortfolioAsset | null>(null);
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [isEditingLiquidity, setIsEditingLiquidity] = useState(false);
  const [liquidityInput, setLiquidityInput] = useState('');

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
      return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
    }
    return dateStr;
  };

  // 1. Calcoli aggregati del Portafoglio Titoli
  const totals = useMemo(() => {
    const totalInvested = portfolio.assets.reduce((sum, a) => sum + a.invested, 0);
    const totalCurrentValue = portfolio.assets.reduce((sum, a) => sum + a.currentValue, 0);
    const totalProfit = totalCurrentValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    const netWorth = portfolio.liquidita + totalCurrentValue;

    return {
      totalInvested,
      totalCurrentValue,
      totalProfit,
      profitPercentage,
      netWorth,
    };
  }, [portfolio]);

  // 2. Ripartizione per Asset Class
  const classBreakdown = useMemo(() => {
    const map: Record<AssetClassType, { invested: number; currentValue: number; count: number }> = {
      liquidita: { invested: portfolio.liquidita, currentValue: portfolio.liquidita, count: 1 },
      obbligazioni: { invested: 0, currentValue: 0, count: 0 },
      etf: { invested: 0, currentValue: 0, count: 0 },
      azioni: { invested: 0, currentValue: 0, count: 0 },
      altro: { invested: 0, currentValue: 0, count: 0 },
    };

    portfolio.assets.forEach((a) => {
      const type = a.type || 'altro';
      if (!map[type]) {
        map[type] = { invested: 0, currentValue: 0, count: 0 };
      }
      map[type].invested += a.invested;
      map[type].currentValue += a.currentValue;
      map[type].count += 1;
    });

    return (Object.keys(map) as AssetClassType[])
      .map((key) => {
        const item = map[key];
        const pctOnNetWorth = totals.netWorth > 0 ? (item.currentValue / totals.netWorth) * 100 : 0;
        const profit = item.currentValue - item.invested;
        const profitPct = item.invested > 0 ? (profit / item.invested) * 100 : 0;
        return {
          key,
          ...item,
          pctOnNetWorth,
          profit,
          profitPct,
          config: CLASS_CONFIG[key] || CLASS_CONFIG.altro,
        };
      })
      .filter((c) => c.currentValue > 0 || c.invested > 0);
  }, [portfolio, totals.netWorth]);

  // 3. Spicchi per Donut Chart SVG (Asset Allocation)
  const donutRadius = 70;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const donutSlices = useMemo(() => {
    let accumulatedOffset = 0;
    return classBreakdown.map((item) => {
      const strokeLength = (item.pctOnNetWorth / 100) * donutCircumference;
      const strokeDasharray = `${strokeLength} ${donutCircumference - strokeLength}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += strokeLength;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
        color: item.config.hex,
      };
    });
  }, [classBreakdown, donutCircumference]);

  // 4. Titoli filtrati per classe
  const filteredAssets = useMemo(() => {
    if (selectedClass === 'all') return portfolio.assets;
    return portfolio.assets.filter((a) => a.type === selectedClass);
  }, [portfolio.assets, selectedClass]);

  // 5. Storico Rendite Passive Incassate (Cedole BTP, Dividendi Enel, ecc. da allTransactions)
  const renditeHistory = useMemo(() => {
    return allTransactions
      .filter(
        (t) =>
          t.category === 'rendite' ||
          /cedol|dividend|rendit/i.test(t.description + ' ' + (t.notes || ''))
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allTransactions]);

  const renditeStats = useMemo(() => {
    let lordo = 0;
    let ritenute = 0;
    renditeHistory.forEach((r) => {
      if (r.type === 'entrata') lordo += r.amount;
      else ritenute += r.amount;
    });
    return {
      lordo,
      ritenute,
      netto: lordo - ritenute,
      count: renditeHistory.length,
    };
  }, [renditeHistory]);

  // Handlers di Salvataggio
  const handleSaveAsset = (asset: PortfolioAsset) => {
    const updated = upsertAsset(asset);
    setPortfolio(updated);
  };

  const handleDeleteAsset = (id: string) => {
    const updated = deleteAsset(id);
    setPortfolio(updated);
  };

  const handleSaveLiquidity = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(liquidityInput.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      const updated = updateLiquidity(val);
      setPortfolio(updated);
      setIsEditingLiquidity(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. HERO CARD PATRIMONIO NETTO COMPLESSIVO */}
      <div className="p-4 sm:p-5 rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-black text-slate-300 block">
                Patrimonio Netto Totale
              </span>
              <p className="text-[11px] text-slate-400 font-medium">
                Liquidità Fineco + Portafoglio Titoli
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewAssetModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuovo Titolo</span>
          </button>
        </div>

        {/* Cifra Patrimonio Netto Principale */}
        <div className="pt-1 flex items-baseline justify-between gap-2 flex-wrap">
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
            {formatEuro(totals.netWorth)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
            <ArrowUpRight className="w-4 h-4" />
            <span>+{formatEuro(totals.totalProfit)} ({totals.profitPercentage.toFixed(1)}%)</span>
          </div>
        </div>

        {/* 2 Mini KPI: Liquidità vs Titoli */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          {/* Liquidità Conto */}
          <div
            onClick={() => {
              setLiquidityInput(portfolio.liquidita.toString());
              setIsEditingLiquidity(true);
            }}
            className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl cursor-pointer hover:border-cyan-500/40 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs text-cyan-400 font-bold mb-1">
              <span className="flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                Liquidità
              </span>
              <Pencil className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-white truncate">
              {formatEuro(portfolio.liquidita)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {((portfolio.liquidita / totals.netWorth) * 100).toFixed(1)}% del patrimonio
            </span>
          </div>

          {/* Portafoglio Titoli */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Titoli & ETF
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {portfolio.assets.length} titoli
              </span>
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-white truncate">
              {formatEuro(totals.totalCurrentValue)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Investiti: {formatEuro(totals.totalInvested)}
            </span>
          </div>
        </div>
      </div>

      {/* MODAL / POPUP MODIFICA LIQUIDITÀ RAPIDA */}
      {isEditingLiquidity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Aggiorna Saldo Liquidità Conto
            </h3>
            <form onSubmit={handleSaveLiquidity} className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  €
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={liquidityInput}
                  onChange={(e) => setLiquidityInput(e.target.value)}
                  placeholder="38117.00"
                  className="w-full bg-slate-950 border border-cyan-500/50 rounded-2xl py-3 pl-8 pr-3 text-2xl font-black font-mono text-white focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingLiquidity(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
                >
                  Salva Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. GRAFICO ASSET ALLOCATION (DONUT SVG) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md space-y-3">
        <div className="text-center">
          <span className="text-xs uppercase tracking-wider font-black text-slate-300">
            Ripartizione Asset Allocation
          </span>
        </div>

        <div className="relative flex items-center justify-center py-1">
          <svg
            viewBox="0 0 200 200"
            className="w-52 h-52 sm:w-60 sm:h-60 transform -rotate-90 filter drop-shadow-lg"
          >
            <circle
              cx="100"
              cy="100"
              r={donutRadius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="22"
            />
            {donutSlices.map((slice) => (
              <circle
                key={slice.key}
                cx="100"
                cy="100"
                r={donutRadius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={selectedClass === slice.key ? '26' : '22'}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="cursor-pointer transition-all duration-300 hover:opacity-90"
                onClick={() =>
                  setSelectedClass(selectedClass === slice.key ? 'all' : slice.key)
                }
              />
            ))}
          </svg>

          {/* Centro del Donut */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
            style={{ transform: 'none' }}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {selectedClass === 'all'
                ? 'Patrimonio Netto'
                : CLASS_CONFIG[selectedClass]?.label || 'Classe'}
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-white tracking-tight">
              {formatEuro(
                selectedClass === 'all'
                  ? totals.netWorth
                  : classBreakdown.find((c) => c.key === selectedClass)?.currentValue || 0
              )}
            </span>
            <span className="text-xs font-black text-cyan-400">
              {selectedClass === 'all'
                ? '100% Wallet'
                : `${classBreakdown.find((c) => c.key === selectedClass)?.pctOnNetWorth.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* Chips Filtro Asset Class */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setSelectedClass('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedClass === 'all'
                ? 'bg-white text-slate-900 shadow-md scale-105'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Tutti ({portfolio.assets.length})
          </button>
          {classBreakdown.map((item) => {
            const isSelected = selectedClass === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedClass(isSelected ? 'all' : item.key)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-md scale-105'
                    : `${item.config.bg} ${item.config.text} border ${item.config.border}`
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.config.hex }}
                />
                <span>{item.config.label.split(' ')[0]}</span>
                <span className="font-mono text-[11px] opacity-90">
                  {item.pctOnNetWorth.toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LISTA TITOLI IN PORTAFOGLIO */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs uppercase tracking-wider font-black text-slate-300">
            Titoli in Portafoglio ({filteredAssets.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">
            Tocca la matita per aggiornare il valore
          </span>
        </div>

        <div className="space-y-2">
          {filteredAssets.map((asset) => {
            const profit = asset.currentValue - asset.invested;
            const profitPct = asset.invested > 0 ? (profit / asset.invested) * 100 : 0;
            const isProfit = profit >= 0;
            const config = CLASS_CONFIG[asset.type] || CLASS_CONFIG.altro;

            return (
              <div
                key={asset.id}
                className="p-3.5 sm:p-4 rounded-2xl border bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-2"
              >
                {/* Header Titolo: Simbolo + Nome + Tasto Modifica */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm sm:text-base text-white tracking-wide">
                        {asset.symbol}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${config.bg} ${config.text} ${config.border}`}
                      >
                        {config.label.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                      {asset.name}
                    </p>
                  </div>

                  {/* Tasto Modifica Rapida Valore */}
                  <button
                    type="button"
                    onClick={() => setEditingAsset(asset)}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                    title="Aggiorna controvalore di mercato"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Valori: Controvalore Attuale vs Investito */}
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Controvalore
                    </span>
                    <span className="font-mono font-black text-base sm:text-lg text-white">
                      {formatEuro(asset.currentValue)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Profitto / Perdita
                    </span>
                    <div
                      className={`flex items-center justify-end gap-1 font-mono font-black text-xs sm:text-sm ${
                        isProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isProfit ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isProfit ? '+' : ''}
                        {formatEuro(profit)} ({isProfit ? '+' : ''}
                        {profitPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Dettaglio: Capitale Investito & Note */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-0.5">
                  <span>Investito: <strong className="text-slate-200 font-mono">{formatEuro(asset.invested)}</strong></span>
                  {asset.notes && <span className="truncate max-w-[160px] text-[10px] text-slate-500">{asset.notes}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. FLUSSO RENDITE PASSIVE (CEDOLE & DIVIDENDI) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-md space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-black text-slate-300 block">
                Rendite Passive Incassate
              </span>
              <p className="text-[11px] text-slate-400 font-medium">
                Cedole BTP semestrali & Dividendi Enel
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">
              Totale Netto Incassato
            </span>
            <span className="font-mono font-black text-base sm:text-lg text-emerald-400">
              +{formatEuro(renditeStats.netto)}
            </span>
          </div>
        </div>

        {/* Banner Prossime Cedole Attese */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-teal-400 font-bold text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario Cedole & Dividendi Ricorrenti</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-amber-400 font-bold block">BTP (Cedole Semestrali)</span>
              <span className="text-slate-200 font-mono font-semibold block">Febbraio & Agosto</span>
              <span className="text-[10px] text-slate-400">~220 € lordi (192,50 € netti)</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-purple-400 font-bold block">Enel (Dividendi)</span>
              <span className="text-slate-200 font-mono font-semibold block">Gennaio & Luglio</span>
              <span className="text-[10px] text-slate-400">~80-90 € netti a tranche</span>
            </div>
          </div>
        </div>

        {/* Elenco Movimenti Cedole Storiche */}
        {renditeHistory.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block px-1">
              Ultimi Accrediti Registrati ({renditeHistory.length})
            </span>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
              {renditeHistory.slice(0, 10).map((r) => (
                <div
                  key={r.id}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/70 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate text-xs">{r.description}</p>
                    <p className="text-[10px] font-mono text-slate-400">{formatDate(r.date)}</p>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs shrink-0 ${
                      r.type === 'entrata' ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {r.type === 'entrata' ? '+' : '-'}
                    {formatEuro(r.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALE MODIFICA ASSET ESISTENTE */}
      <EditAssetModal
        isOpen={!!editingAsset}
        asset={editingAsset}
        isNew={false}
        onClose={() => setEditingAsset(null)}
        onSave={handleSaveAsset}
        onDelete={handleDeleteAsset}
      />

      {/* MODALE NUOVO TITOLO */}
      <EditAssetModal
        isOpen={isNewAssetModalOpen}
        asset={null}
        isNew={true}
        onClose={() => setIsNewAssetModalOpen(false)}
        onSave={handleSaveAsset}
      />
    </div>
  );
};
