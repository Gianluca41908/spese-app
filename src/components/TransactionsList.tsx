import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Receipt,
  Pencil,
  CheckSquare,
  Square,
  ListChecks,
} from 'lucide-react';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
  onToggleSettled: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onEdit: (tx: Transaction) => void;
}

export const TransactionsList: React.FC<Props> = ({
  transactions,
  onToggleSettled,
  onDelete,
  onDeleteMultiple,
  onEdit,
}) => {
  const [filter, setFilter] = useState<'all' | 'variabili' | 'fisse' | 'inv'>('all');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = transactions.filter((t) => {
    if (filter === 'variabili') return !t.isFixed;
    if (filter === 'fisse') return t.isFixed;
    if (filter === 'inv') return t.isInvestment;
    return true;
  });

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

  // Gestione Selezione Singola
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Seleziona / Deseleziona Tutti i filtrati
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  };

  // Eliminazione di Massa
  const handleDeleteBatch = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    if (confirm(`Sei sicuro di voler eliminare ${count} movimenti selezionati? L'operazione non può essere annullata.`)) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelecting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Barra Azioni & Filtri */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Filtri orizzontali */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar flex-1 min-w-0">
          {[
            { key: 'all', label: `Tutte (${transactions.length})` },
            { key: 'variabili', label: 'Spese' },
            { key: 'fisse', label: 'Fisse' },
            { key: 'inv', label: 'PAC / INV' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
                filter === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pulsante Attiva/Disattiva Selezione Multipla */}
        <button
          type="button"
          onClick={() => {
            if (isSelecting) {
              setSelectedIds(new Set());
              setIsSelecting(false);
            } else {
              setIsSelecting(true);
            }
          }}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
            isSelecting
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Seleziona movimenti multipli per cancellarli"
        >
          <ListChecks className="w-4 h-4 text-emerald-400" />
          <span>{isSelecting ? 'Annulla' : 'Seleziona'}</span>
        </button>
      </div>

      {/* Barra di Controllo Selezione Multipla */}
      {isSelecting && (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-between gap-2 shadow-lg animate-in fade-in duration-150">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white transition-colors"
          >
            {selectedIds.size === filtered.length && filtered.length > 0 ? (
              <CheckSquare className="w-5 h-5 text-emerald-400" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
            <span>
              {selectedIds.size === 0
                ? `Seleziona tutti (${filtered.length})`
                : `${selectedIds.size} di ${filtered.length} selezionati`}
            </span>
          </button>

          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteBatch}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-rose-950"
            >
              <Trash2 className="w-4 h-4" />
              <span>Elimina ({selectedIds.size})</span>
            </button>
          )}
        </div>
      )}

      {/* Lista Elementi */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2 stroke-1" />
          <p className="text-sm font-semibold text-slate-400">Nessun movimento registrato</p>
          <p className="text-xs text-slate-500 mt-1">
            Usa il tasto <span className="text-emerald-400 font-bold">+</span> per segnare una spesa o carica i movimenti
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((tx) => {
            const isSelected = selectedIds.has(tx.id);

            return (
              <div
                key={tx.id}
                onClick={() => {
                  if (isSelecting) {
                    handleToggleSelect(tx.id);
                  } else {
                    onEdit(tx);
                  }
                }}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                  isSelected
                    ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/30'
                    : tx.isSettled
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    : 'bg-slate-950 border-dashed border-amber-500/40 hover:bg-slate-900/60'
                }`}
              >
                {/* Selettore checkbox in modalità selezione */}
                {isSelecting ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(tx.id);
                    }}
                    className="p-1 shrink-0 text-slate-400 hover:text-white"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                ) : (
                  /* Bottone Spunta Contabilizzato in modalità normale */
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSettled(tx.id);
                    }}
                    className="text-slate-500 hover:text-emerald-400 transition-colors p-1 shrink-0"
                    title={
                      tx.isSettled
                        ? 'Contabilizzato (clicca per segnare come provvisorio)'
                        : 'Provvisorio (clicca per segnare come contabilizzato)'
                    }
                  >
                    {tx.isSettled ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-amber-500/80 hover:text-amber-400" />
                    )}
                  </button>
                )}

                {/* Dettagli Spesa */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-semibold text-sm truncate transition-colors ${
                        isSelected
                          ? 'text-rose-200'
                          : 'text-slate-100 group-hover:text-emerald-300'
                      }`}
                    >
                      {tx.description}
                    </span>
                    {tx.isInvestment && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                        INV
                      </span>
                    )}
                    {tx.isFixed && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-medium shrink-0">
                        FISSA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono">{formatDate(tx.date)}</span>
                    <span>•</span>
                    <span className="capitalize">{tx.category}</span>
                    {!tx.isSettled && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400/90 text-[11px] font-medium">In attesa</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Importo e Azioni */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono font-bold text-sm sm:text-base ${
                      tx.type === 'entrata' ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {tx.type === 'entrata' ? '+' : '-'}
                    {formatEuro(tx.amount)}
                  </span>

                  {!isSelecting && (
                    <div className="flex items-center gap-1">
                      {/* Tasto Modifica */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(tx);
                        }}
                        className="text-slate-500 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Modifica movimento"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Tasto Elimina Singolo */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Eliminare "${tx.description}"?`)) {
                            onDelete(tx.id);
                          }
                        }}
                        className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
