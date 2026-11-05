import React from 'react';
import { ChevronLeft, ChevronRight, Layers, Calendar } from 'lucide-react';

interface Props {
  yearMonth: string; // "YYYY-MM" oppure "ALL"
  onChange: (ym: string) => void;
}

export const MonthSelector: React.FC<Props> = ({ yearMonth, onChange }) => {
  const isAll = yearMonth === 'ALL';
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = yearMonth === currentYM;

  let capitalized = 'Tutti i Movimenti';
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (!isAll) {
    const [yearStr, monthStr] = yearMonth.split('-');
    year = parseInt(yearStr, 10);
    month = parseInt(monthStr, 10); // 1-12
    const dateObj = new Date(year, month - 1, 1);
    const monthName = dateObj.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }

  const handlePrev = () => {
    if (isAll) {
      onChange(currentYM);
      return;
    }
    let newM = month - 1;
    let newY = year;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    onChange(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleNext = () => {
    if (isAll) {
      onChange(currentYM);
      return;
    }
    let newM = month + 1;
    let newY = year;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    onChange(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleToday = () => {
    onChange(currentYM);
  };

  const handleToggleAll = () => {
    if (isAll) {
      onChange(currentYM);
    } else {
      onChange('ALL');
    }
  };

  return (
    <div className="flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded-2xl p-2 px-3 shadow-md gap-2">
      <button
        onClick={handlePrev}
        disabled={isAll}
        className="p-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 transition-all"
        aria-label="Mese precedente"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 flex-wrap justify-center text-center">
        <span className="font-black text-base sm:text-lg text-white tracking-tight">
          {capitalized}
        </span>

        {!isCurrentMonth && !isAll && (
          <button
            onClick={handleToday}
            className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold hover:bg-emerald-500/30 transition-all"
          >
            Oggi
          </button>
        )}

        {/* Toggle Tutti i Movimenti vs Per Mese */}
        <button
          onClick={handleToggleAll}
          className={`text-xs px-3 py-0.5 rounded-full font-bold border flex items-center gap-1.5 transition-all ${
            isAll
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-sm'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
          }`}
          title={isAll ? 'Passa alla visualizzazione per singolo mese' : 'Visualizza tutti i movimenti dello storico'}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isAll ? 'Per Mese' : 'Tutti'}</span>
        </button>
      </div>

      <button
        onClick={handleNext}
        disabled={isAll}
        className="p-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed active:scale-95 transition-all"
        aria-label="Mese successivo"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
