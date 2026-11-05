import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { PortfolioAsset, AssetClassType } from '../types';

interface Props {
  isOpen: boolean;
  asset: PortfolioAsset | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (asset: PortfolioAsset) => void;
  onDelete?: (id: string) => void;
}

const ASSET_TYPES: { key: AssetClassType; label: string }[] = [
  { key: 'obbligazioni', label: 'Obbligazioni (BTP/BOT)' },
  { key: 'etf', label: 'ETF (Azionari/Tematici)' },
  { key: 'azioni', label: 'Azioni Singole' },
  { key: 'liquidita', label: 'Liquidità / Conto' },
  { key: 'altro', label: 'Altro' },
];

export const EditAssetModal: React.FC<Props> = ({
  isOpen,
  asset,
  isNew = false,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<AssetClassType>('etf');
  const [invested, setInvested] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setSymbol(asset.symbol);
      setType(asset.type);
      setInvested(asset.invested.toString());
      setCurrentValue(asset.currentValue.toString());
      setNotes(asset.notes || '');
    } else {
      setName('');
      setSymbol('');
      setType('etf');
      setInvested('');
      setCurrentValue('');
      setNotes('');
    }
  }, [asset, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = parseFloat(invested.replace(',', '.'));
    const val = parseFloat(currentValue.replace(',', '.'));

    if (!name.trim() || !symbol.trim()) {
      alert('Inserisci il nome e il simbolo del titolo.');
      return;
    }
    if (isNaN(inv) || inv < 0 || isNaN(val) || val < 0) {
      alert('Inserisci importi validi per il capitale investito e il controvalore.');
      return;
    }

    onSave({
      id: asset?.id || `asset-${Date.now()}`,
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      type,
      invested: inv,
      currentValue: val,
      notes: notes.trim() || undefined,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="font-bold text-lg text-white">
              {isNew ? 'Nuovo Titolo in Portafoglio' : `Modifica ${symbol || 'Titolo'}`}
            </span>
            <p className="text-xs text-slate-400">Aggiorna controvalore, investito o dettagli</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Nome e Simbolo */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Nome Titolo
              </label>
              <input
                type="text"
                placeholder="es. MSCI World"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Codice / Ticker
              </label>
              <input
                type="text"
                placeholder="es. MSCIW"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                required
              />
            </div>
          </div>

          {/* Tipo Asset Class */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Classe di Investimento
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AssetClassType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Controvalore Attuale (il più importante per aggiornare il prezzo) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              Controvalore Attuale (€)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                €
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl py-2.5 pl-8 pr-3 text-lg font-black font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Capitale Investito */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Capitale Investito Totale (€)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                €
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={invested}
                onChange={(e) => setInvested(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-sm font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Note / Dettagli */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Note (Opzionale)
            </label>
            <input
              type="text"
              placeholder="es. Scadenza, PAC mensile, ecc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Azioni Footer */}
          <div className="flex gap-2 pt-2">
            {!isNew && onDelete && asset && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Eliminare il titolo "${asset.name}" dal portafoglio?`)) {
                    onDelete(asset.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/50 text-rose-400 hover:text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Elimina</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg shadow-emerald-950"
            >
              <Save className="w-4 h-4" />
              <span>Salva Titolo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
