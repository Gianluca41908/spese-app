import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, Calendar, Tag, CheckCircle2, Circle } from 'lucide-react';
import { Transaction, TransactionType, CategoryKey } from '../types';
import { CATEGORIES } from '../constants';

interface Props {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const EditTransactionModal: React.FC<Props> = ({
  isOpen,
  transaction,
  onClose,
  onSave,
  onDelete,
}) => {
  const [type, setType] = useState<TransactionType>('uscita');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<CategoryKey>('supermercato');
  const [date, setDate] = useState<string>('');
  const [isInvestment, setIsInvestment] = useState<boolean>(false);
  const [isFixed, setIsFixed] = useState<boolean>(false);
  const [isSettled, setIsSettled] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setCategory(transaction.category);
      setDate(transaction.date);
      setIsInvestment(transaction.isInvestment);
      setIsFixed(transaction.isFixed);
      setIsSettled(transaction.isSettled);
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      alert('Inserisci un importo valido maggiore di zero.');
      return;
    }
    if (!description.trim()) {
      alert('Inserisci una descrizione.');
      return;
    }

    const updated: Transaction = {
      ...transaction,
      type,
      amount: num,
      description: description.trim(),
      category,
      date,
      isInvestment: type === 'uscita' ? isInvestment : false,
      isFixed,
      isSettled,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Sei sicuro di voler eliminare "${transaction.description}"?`)) {
      onDelete(transaction.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white">Modifica Movimento</span>
              {transaction.isFixed && (
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                  Voce Fissa
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Aggiorna dettagli, importo o categoria</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 transition-colors"
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
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
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
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                type === 'entrata'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrata (Incasso)
            </button>
          </div>

          {/* Importo */}
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
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-3xl font-extrabold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Descrizione */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Descrizione
            </label>
            <input
              type="text"
              placeholder="es. TIM Fibra, Condominio, Spesa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-950 rounded-xl border border-slate-800">
              {Object.values(CATEGORIES).map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setCategory(cat.key);
                    if (cat.key === 'investimenti') setIsInvestment(true);
                  }}
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

          {/* Opzioni avanzate (Toggles) */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 text-xs">
            {/* Toggle Investimento */}
            {type === 'uscita' && (
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-slate-200">Investimento (PAC / Titoli)</span>
                  <p className="text-[11px] text-slate-500">
                    Escluso dal totale "Spese Vive"
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isInvestment}
                  onChange={(e) => setIsInvestment(e.target.checked)}
                  className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                />
              </label>
            )}

            {/* Toggle Contabilizzato */}
            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-900">
              <div>
                <span className="font-semibold text-slate-200">Contabilizzato in Banca</span>
                <p className="text-[11px] text-slate-500">
                  {isSettled
                    ? 'Movimento già addebitato / registrato'
                    : 'Movimento provvisorio / programmato'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={isSettled}
                onChange={(e) => setIsSettled(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            {/* Toggle Spesa Fissa */}
            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-900">
              <div>
                <span className="font-semibold text-slate-200">Voce Fissa / Ricorrente</span>
                <p className="text-[11px] text-slate-500">
                  Contrassegna come spesa abituale fissa
                </p>
              </div>
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="w-5 h-5 accent-slate-400 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Azioni del Footer */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-3 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/50 text-rose-400 hover:text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Elimina</span>
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg shadow-emerald-950"
            >
              <Save className="w-4 h-4" />
              <span>Salva Modifiche</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
