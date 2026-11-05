import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CalendarCheck,
  Pencil,
  Save,
  RotateCcw,
} from 'lucide-react';
import { FixedExpenseTemplate, CategoryKey, TransactionType } from '../types';
import { CATEGORIES } from '../constants';
import { getFixedTemplates, resetFixedTemplatesToDefault } from '../services/storage';
import { formatEuro } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  templates: FixedExpenseTemplate[];
  onSaveTemplates: (templates: FixedExpenseTemplate[]) => void;
  onApplyToMonth: () => void;
  currentMonthName: string;
}

export const FixedExpensesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  templates,
  onSaveTemplates,
  onApplyToMonth,
  currentMonthName,
}) => {
  const [list, setList] = useState<FixedExpenseTemplate[]>(() => {
    if (templates && templates.length > 0) return templates;
    return getFixedTemplates();
  });

  // Sincronizza lo stato quando la modale si apre o i templates cambiano
  useEffect(() => {
    if (templates && templates.length > 0) {
      setList(templates);
    } else {
      const def = getFixedTemplates();
      setList(def);
      if (onSaveTemplates) onSaveTemplates(def);
    }
  }, [templates, isOpen]);

  // Modalità form: null (nessuno), 'new' (nuovo), o 'fix-id' (modifica esistente)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Campi del form di modifica/creazione
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<TransactionType>('uscita');
  const [formCategory, setFormCategory] = useState<CategoryKey>('utenze');
  const [formDay, setFormDay] = useState<number>(1);
  const [formIsInv, setFormIsInv] = useState(false);
  const [formActive, setFormActive] = useState(true);

  if (!isOpen) return null;

  // Apertura form creazione
  const handleOpenNew = () => {
    setEditingId('new');
    setFormName('');
    setFormAmount('');
    setFormType('uscita');
    setFormCategory('utenze');
    setFormDay(1);
    setFormIsInv(false);
    setFormActive(true);
  };

  // Apertura form modifica di un elemento esistente
  const handleOpenEdit = (item: FixedExpenseTemplate) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormAmount(item.amount.toString());
    setFormType(item.type);
    setFormCategory(item.category);
    setFormDay(item.defaultDay || 1);
    setFormIsInv(item.isInvestment);
    setFormActive(item.active);
  };

  const handleCancelForm = () => {
    setEditingId(null);
  };

  // Salvataggio form (creazione o modifica)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(formAmount.replace(',', '.'));
    if (!formName.trim() || isNaN(num) || num <= 0) {
      alert('Inserisci un nome valido e un importo maggiore di zero.');
      return;
    }

    const dayNum = Math.min(31, Math.max(1, Number(formDay) || 1));

    if (editingId === 'new') {
      const newItem: FixedExpenseTemplate = {
        id: 'fix-' + Date.now(),
        name: formName.trim(),
        amount: num,
        type: formType,
        category: formCategory,
        isInvestment: formType === 'uscita' ? formIsInv : false,
        defaultDay: dayNum,
        active: formActive,
      };
      const updated = [...list, newItem];
      setList(updated);
      onSaveTemplates(updated);
    } else if (editingId) {
      const updated = list.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            name: formName.trim(),
            amount: num,
            type: formType,
            category: formCategory,
            isInvestment: formType === 'uscita' ? formIsInv : false,
            defaultDay: dayNum,
            active: formActive,
          };
        }
        return item;
      });
      setList(updated);
      onSaveTemplates(updated);
    }

    setEditingId(null);
  };

  // Toggle attiva/sospesa
  const handleToggle = (id: string) => {
    const updated = list.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    setList(updated);
    onSaveTemplates(updated);
  };

  // Elimina elemento
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Sei sicuro di voler eliminare la spesa fissa "${name}"?`)) {
      const updated = list.filter((item) => item.id !== id);
      setList(updated);
      onSaveTemplates(updated);
      if (editingId === id) setEditingId(null);
    }
  };

  // Ripristina voci dal foglio Excel
  const handleResetToDefault = () => {
    if (confirm('Vuoi ricaricare le spese e entrate fisse predefinite del tuo foglio Excel (TIM, Condominio, PAC, Stage, NASpI)?')) {
      const def = resetFixedTemplatesToDefault();
      setList(def);
      onSaveTemplates(def);
      setEditingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="font-bold text-lg text-white">Menu Spese Fisse & Ricorrenti</h2>
            <p className="text-xs text-slate-400">
              Personalizza le tue spese e entrate automatiche del mese
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Action: Carica su questo mese */}
        <div className="my-3 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-200">
                Carica su {currentMonthName}
              </p>
              <p className="text-[11px] text-emerald-300/70">
                Aggiunge le voci attive a questo mese
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onApplyToMonth();
              onClose();
            }}
            disabled={list.filter(t => t.active).length === 0}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl active:scale-95 transition-all shadow-md shrink-0"
          >
            Applica al Mese
          </button>
        </div>

        {/* Se il form di modifica o aggiunta è aperto */}
        {editingId !== null ? (
          <form
            onSubmit={handleSaveForm}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-4 my-2 space-y-3 overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">
                {editingId === 'new' ? 'Nuova Spesa Fissa' : 'Modifica Spesa Fissa'}
              </span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-xs text-slate-400 hover:text-white"
              >
                Annulla
              </button>
            </div>

            {/* Tipo: Uscita / Entrata */}
            <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setFormType('uscita');
                  if (formCategory === 'stipendio' || formCategory === 'rendite') {
                    setFormCategory('utenze');
                  }
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  formType === 'uscita'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Uscita (Spesa)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormType('entrata');
                  setFormCategory('stipendio');
                  setFormIsInv(false);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  formType === 'entrata'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Entrata (Incasso)
              </button>
            </div>

            {/* Nome e Importo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nome Spesa Fissa
                </label>
                <input
                  type="text"
                  placeholder="es. TIM Fibra, Condominio..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Importo (€)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Categoria e Giorno abituale del mese */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Categoria
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    const val = e.target.value as CategoryKey;
                    setFormCategory(val);
                    if (val === 'investimenti') setFormIsInv(true);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {Object.values(CATEGORIES).map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Giorno di addebito (1 - 31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formDay}
                  onChange={(e) => setFormDay(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Checkbox Avanzate */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-300">
              {formType === 'uscita' && (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsInv}
                    onChange={(e) => setFormIsInv(e.target.checked)}
                    className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span>È un Investimento (PAC / Titoli)</span>
                </label>
              )}

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                />
                <span>Attiva per i prossimi mesi</span>
              </label>
            </div>

            {/* Pulsanti Azione Form */}
            <div className="flex gap-2 pt-2 border-t border-slate-900">
              <button
                type="button"
                onClick={handleCancelForm}
                className="w-1/3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{editingId === 'new' ? 'Crea Voce Fissa' : 'Salva Modifiche'}</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* Sezione Lista Spese Fisse */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Voci Configurate ({list.length})
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs text-slate-400 hover:text-emerald-400 font-medium flex items-center gap-1 transition-colors"
                title="Ricarica le voci dal tuo foglio Excel"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ricarica Excel</span>
              </button>
              <button
                type="button"
                onClick={handleOpenNew}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuova Voce</span>
              </button>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="py-8 text-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 my-2">
              <p className="text-sm font-semibold text-slate-300">Nessuna voce fissa trovata</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Puoi ricaricare le tue voci dal foglio Excel (TIM, Condominio, PAC, Stage, NASpI) oppure aggiungerne una nuova.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ricarica Voci Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenNew}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuova Voce</span>
                </button>
              </div>
            </div>
          ) : (
            list.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  item.active
                    ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                {/* Checkbox Attiva / Sospesa */}
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  className="shrink-0 text-slate-500 hover:text-emerald-400 p-0.5"
                  title={item.active ? 'Spesa Attiva (clicca per sospendere)' : 'Spesa Sospesa (clicca per attivare)'}
                >
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={() => handleToggle(item.id)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </button>

                {/* Informazioni Template */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenEdit(item)}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-xs sm:text-sm text-white truncate">
                      {item.name}
                    </span>
                    {item.isInvestment && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold uppercase">
                        INV
                      </span>
                    )}
                    {!item.active && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-medium">
                        Sospesa
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="capitalize">{CATEGORIES[item.category]?.label.split(' ')[0] || item.category}</span>
                    <span>•</span>
                    <span>Giorno {item.defaultDay || 1} del mese</span>
                  </div>
                </div>

                {/* Importo e Pulsanti Modifica / Elimina */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono font-bold text-xs sm:text-sm ${
                      item.type === 'entrata' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {item.type === 'entrata' ? '+' : '-'}
                    {formatEuro(item.amount)}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Tasto Modifica */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                      title="Modifica parametri di questa spesa fissa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Tasto Elimina */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      title="Elimina voce fissa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800 shrink-0 flex items-center justify-between text-[11px] text-slate-500">
          <span>Modificando una voce fissa non perdi le spese già registrate nei mesi passati.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-xs ml-2 shrink-0"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
