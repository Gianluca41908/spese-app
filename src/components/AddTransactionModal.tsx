import React, { useState } from 'react';
import { X, TrendingUp, Check, Plus, Tag } from 'lucide-react';
import { TransactionType, CategoryKey } from '../types';
import { CATEGORIES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: {
    amount: number;
    description: string;
    type: TransactionType;
    category: CategoryKey;
    date: string;
    isInvestment: boolean;
    isFixed: boolean;
    isSettled: boolean;
  }) => void;
  defaultDate: string;
}

const PRESETS = [
  'Spesa Ipercoop Pasteur',
  'Famila',
  'Ricarica Genius Card',
  'Pizzeria / Cena',
  'Benzina / Rifornimento',
  'Zara / Abbigliamento',
  'Farmacia',
  'Regalo',
  'Compenso Stage',
  'Cedola BTP',
];

export const AddTransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAdd,
  defaultDate,
}) => {
  const [type, setType] = useState<TransactionType>('uscita');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<CategoryKey>('supermercato');
  const [isInvestment, setIsInvestment] = useState<boolean>(false);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num) || num <= 0) return;
    if (!description.trim()) return;

    onAdd({
      amount: num,
      description: description.trim(),
      type,
      category,
      date,
      isInvestment: type === 'uscita' ? isInvestment : false,
      isFixed: false,
      isSettled: true,
    });

    setAmount('');
    setDescription('');
    setIsInvestment(false);
    onClose();
  };

  const handleSelectCategory = (catKey: CategoryKey) => {
    setCategory(catKey);
    if (catKey === 'investimenti') {
      setIsInvestment(true);
    }
    if (catKey === 'stipendio' || catKey === 'rendite') {
      setType('entrata');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white">Nuovo Movimento</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Switch Uscita / Entrata */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('uscita');
                if (category === 'stipendio' || category === 'rendite') {
                  setCategory('supermercato');
                }
              }}
              className={`py-2 text-sm font-bold rounded-xl transition-all ${
                type === 'uscita'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Uscita (Spesa)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('entrata');
                setCategory('stipendio');
                setIsInvestment(false);
              }}
              className={`py-2 text-sm font-bold rounded-xl transition-all ${
                type === 'entrata'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrata (Incasso)
            </button>
          </div>

          {/* Importo Grande */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Importo
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                €
              </span>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-3xl font-extrabold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Descrizione con preset rapidi */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Descrizione
            </label>
            <input
              type="text"
              placeholder="es. Spesa Coop, Benzina, Regalo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            {/* Tag rapidi suggeriti */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDescription(preset)}
                  className="text-[11px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-700/50 active:scale-95 transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Categorie */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
              {Object.values(CATEGORIES).map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleSelectCategory(cat.key)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all ${
                    category === cat.key
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className="text-xs truncate w-full">{cat.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Data operazione
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Toggle Investimento (PAC / Titoli) - SOLO PER LE USCITE */}
          {type === 'uscita' && (
            <div className={`p-3 rounded-xl border transition-all ${
              isInvestment
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      È un Investimento? (PAC / Titoli)
                    </span>
                    <span className="text-[11px] opacity-70">
                      Escludi dal calcolo delle spese vive ordinarie
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isInvestment}
                  onChange={(e) => setIsInvestment(e.target.checked)}
                  className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* Pulsante di Invio */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl font-extrabold text-base text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Salva Movimento</span>
          </button>
        </form>
      </div>
    </div>
  );
};
