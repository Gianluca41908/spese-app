import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calculator, Info } from 'lucide-react';
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
  { key: 'obbligazioni', label: 'Obbligazioni (BTP/BOT - base 100)' },
  { key: 'etf', label: 'ETF & Fondi (Azionari/Tematici)' },
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
  const [isin, setIsin] = useState('');
  const [type, setType] = useState<AssetClassType>('etf');
  const [quantity, setQuantity] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [averagePrice, setAveragePrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [invested, setInvested] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setSymbol(asset.symbol);
      setIsin(asset.isin || '');
      setType(asset.type);
      setQuantity(asset.quantity !== undefined ? asset.quantity.toString() : '');
      setMarketPrice(asset.marketPrice !== undefined ? asset.marketPrice.toString() : '');
      setAveragePrice(asset.averagePrice !== undefined ? asset.averagePrice.toString() : '');
      setCurrentValue(asset.currentValue.toString());
      setInvested(asset.invested.toString());
      setNotes(asset.notes || '');
    } else {
      setName('');
      setSymbol('');
      setIsin('');
      setType('etf');
      setQuantity('');
      setMarketPrice('');
      setAveragePrice('');
      setCurrentValue('');
      setInvested('');
      setNotes('');
    }
  }, [asset, isOpen]);

  if (!isOpen) return null;

  // Ricalcolo automatico del controvalore se l'utente modifica quantità o prezzo di mercato
  const handleRecalculate = (newQtyStr: string, newPriceStr: string, currentType: AssetClassType) => {
    const q = parseFloat(newQtyStr.replace(',', '.'));
    const p = parseFloat(newPriceStr.replace(',', '.'));
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      if (currentType === 'obbligazioni') {
        // Le obbligazioni si quotano in percentuale (base 100)
        const calcVal = (q * p) / 100;
        setCurrentValue(calcVal.toFixed(2));
      } else {
        const calcVal = q * p;
        setCurrentValue(calcVal.toFixed(2));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = parseFloat(invested.replace(',', '.'));
    const val = parseFloat(currentValue.replace(',', '.'));
    const q = quantity ? parseFloat(quantity.replace(',', '.')) : undefined;
    const mp = marketPrice ? parseFloat(marketPrice.replace(',', '.')) : undefined;
    const pmc = averagePrice ? parseFloat(averagePrice.replace(',', '.')) : undefined;

    if (!name.trim() || !symbol.trim()) {
      alert('Inserisci il nome e il simbolo/ticker del titolo.');
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
      isin: isin.trim().toUpperCase() || undefined,
      type,
      quantity: q && !isNaN(q) ? q : undefined,
      marketPrice: mp && !isNaN(mp) ? mp : undefined,
      averagePrice: pmc && !isNaN(pmc) ? pmc : undefined,
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
            <p className="text-xs text-slate-400">Aggiorna prezzo di mercato, quantità o controvalore</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Nome e Simbolo */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Nome Titolo
              </label>
              <input
                type="text"
                placeholder="es. Enel S.p.A."
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
                placeholder="es. ENEL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                required
              />
            </div>
          </div>

          {/* ISIN e Classe */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Codice ISIN
              </label>
              <input
                type="text"
                placeholder="es. IT0003128367"
                value={isin}
                onChange={(e) => setIsin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Classe Asset
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as AssetClassType;
                  setType(newType);
                  handleRecalculate(quantity, marketPrice, newType);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dati di Calcolo: Quantità e Prezzo di Mercato */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                Calcolo Controvalore da Prezzo
              </span>
              <span className="text-[10px] text-slate-500">Auto-calcolato</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Quantità / Quote
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={type === 'obbligazioni' ? 'es. 11000' : 'es. 348'}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    handleRecalculate(e.target.value, marketPrice, type);
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-3 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                  Prezzo Mercato {type === 'obbligazioni' ? '(base 100)' : '(€)'}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={type === 'obbligazioni' ? 'es. 97.99' : 'es. 9.768'}
                  value={marketPrice}
                  onChange={(e) => {
                    setMarketPrice(e.target.value);
                    handleRecalculate(quantity, e.target.value, type);
                  }}
                  className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl py-2 px-3 text-xs sm:text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Prezzo di Carico (PMC)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="es. 5.75"
                  value={averagePrice}
                  onChange={(e) => {
                    setAveragePrice(e.target.value);
                    const q = parseFloat(quantity.replace(',', '.'));
                    const pmc = parseFloat(e.target.value.replace(',', '.'));
                    if (!isNaN(q) && !isNaN(pmc) && q > 0 && pmc > 0) {
                      if (type === 'obbligazioni') {
                        setInvested(((q * pmc) / 100).toFixed(2));
                      } else {
                        setInvested((q * pmc).toFixed(2));
                      }
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-1.5 px-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Capitale Investito (€)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={invested}
                  onChange={(e) => setInvested(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-1.5 px-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* CONTROVALORE ATTUALE FINALE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Controvalore Attuale di Mercato (€)
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
                className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl py-2.5 pl-8 pr-3 text-xl font-black font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {quantity && marketPrice
                ? `= ${quantity} ${type === 'obbligazioni' ? 'nominale' : 'quote'} × ${marketPrice} ${type === 'obbligazioni' ? '%' : '€'}`
                : 'Puoi calcolarlo da quantità × prezzo oppure inserire direttamente il totale.'}
            </p>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Note (Opzionale)
            </label>
            <input
              type="text"
              placeholder="es. Cedola semestrale, PAC mensile, ecc."
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
