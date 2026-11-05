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
      <div className="flex items-center justify-between gap-2">
        {/* Filtri orizzontali a scorrimento */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar flex-1 min-w-0">
          {[
            { key: 'all', label: `Tutte (${transactions.length})` },
            { key: 'variabili', label: 'Spese' },
            { key: 'fisse', label: 'Fisse' },
            { key: 'inv', label: 'PAC / Titoli' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold text-xs transition-all ${
                filter === tab.key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white'
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
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            isSelecting
              ? 'bg-rose-950/70 border-rose-500/70 text-rose-200 shadow-md'
              : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white'
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
        <div className="py-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <Receipt className="w-10 h-10 mx-auto text-slate-500 mb-2 stroke-1" />
          <p className="text-sm font-bold text-slate-300">Nessun movimento registrato</p>
          <p className="text-xs text-slate-400 mt-1">
            Usa il tasto <span className="text-emerald-400 font-bold">+</span> per segnare una spesa o carica i movimenti
          </p>
        </div>
      ) : (
        <div className="space-y-2">
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
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-rose-950/30 border-rose-500/70 ring-2 ring-rose-500/40 shadow-lg'
                    : tx.isSettled
                    ? 'bg-slate-900/95 border-slate-800 hover:border-slate-700 hover:bg-slate-900 shadow-sm'
                    : 'bg-slate-950 border-dashed border-amber-500/60 hover:bg-slate-900/70 shadow-sm'
                }`}
              >
                {/* RIGA 1: Checkbox / Spunta + Descrizione Completa (senza truncate) + Importo */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {/* Selettore o Bottone Spunta */}
                    {isSelecting ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(tx.id);
                        }}
                        className="mt-0.5 p-1 shrink-0 text-slate-300 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-rose-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSettled(tx.id);
                        }}
                        className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors p-1 shrink-0"
                        title={
                          tx.isSettled
                            ? 'Contabilizzato (clicca per segnare come provvisorio)'
                            : 'Provvisorio (clicca per segnare come contabilizzato)'
                        }
                      >
                        {tx.isSettled ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-amber-400" />
                        )}
                      </button>
                    )}

                    {/* Descrizione: leggibile al 100%, non troncata */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-sm sm:text-base leading-snug break-words transition-colors ${
                          isSelected
                            ? 'text-rose-100'
                            : 'text-white group-hover:text-emerald-300'
                        }`}
                      >
                        {tx.description}
                      </h3>
                    </div>
                  </div>

                  {/* Importo in evidenza a destra */}
                  <div className="text-right shrink-0 ml-2">
                    <span
                      className={`font-mono font-black text-base sm:text-lg tracking-tight ${
                        tx.type === 'entrata' ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {tx.type === 'entrata' ? '+' : '-'}
                      {formatEuro(tx.amount)}
                    </span>
                  </div>
                </div>

                {/* RIGA 2: Metadati (Data, Categoria, Badge FISSA / INV / In attesa) + Tasti Rapidi Modifica / Elimina */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {/* Badge e Dettagli */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="font-mono font-bold text-slate-200">
                      {formatDate(tx.date)}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {tx.category}
                    </span>
                    {tx.isInvestment && (
                      <span className="text-[10px] bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-1.5 py-0.5 rounded font-black uppercase">
                        INV
                      </span>
                    )}
                    {tx.isFixed && (
                      <span className="text-[10px] bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 px-1.5 py-0.5 rounded font-black uppercase">
                        FISSA
                      </span>
                    )}
                    {!tx.isSettled && (
                      <span className="text-[10px] bg-amber-500/20 border border-amber-400/40 text-amber-300 px-1.5 py-0.5 rounded font-black uppercase">
                        In attesa
                      </span>
                    )}
                  </div>

                  {/* Tasti Azione Rapida a destra (Pencil & Trash) */}
                  {!isSelecting && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(tx);
                        }}
                        className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 active:scale-95 transition-all"
                        title="Modifica movimento"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Eliminare "${tx.description}"?`)) {
                            onDelete(tx.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 active:scale-95 transition-all"
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
