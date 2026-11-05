import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Receipt,
  Pencil,
  CheckSquare,
  Square,
  ListChecks,
  Plus,
  ChevronDown,
  FileText,
  Search,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Transaction } from '../types';
import { getSmartTitle } from '../utils/transactionFormatters';

interface Props {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  currentMonthLabel?: string;
  onToggleSettled: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onEdit: (tx: Transaction) => void;
  onAddClick?: () => void;
}

export const TransactionsList: React.FC<Props> = ({
  transactions,
  allTransactions = [],
  currentMonthLabel = 'Mese Corrente',
  onToggleSettled,
  onDelete,
  onDeleteMultiple,
  onEdit,
  onAddClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'variabili' | 'fisse' | 'inv'>('all');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Stati della Barra di Ricerca e Filtri Avanzati
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'month' | 'all'>('month');
  const [amountFilter, setAmountFilter] = useState<'all' | 'gt50' | 'gt100'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'uscite' | 'entrate'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string, showYear = false) => {
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      if (showYear || searchScope === 'all') {
        const yr = parts[0].slice(2);
        return `${parts[2]}/${parts[1]}/${yr}`;
      }
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  // Base pool di movimenti: se si cerca in tutto lo storico e ci sono movimenti globali
  const pool = useMemo(() => {
    if (searchScope === 'all' && allTransactions.length > 0) {
      return allTransactions;
    }
    return transactions;
  }, [searchScope, allTransactions, transactions]);

  // Filtro combinato (Ricerca + Categoria + Tipo + Importo)
  const filtered = useMemo(() => {
    let result = pool;

    // 1. Filtro Tipo (Entrata / Uscita)
    if (typeFilter === 'uscite') {
      result = result.filter((t) => t.type === 'uscita');
    } else if (typeFilter === 'entrate') {
      result = result.filter((t) => t.type === 'entrata');
    }

    // 2. Filtro Categoria Rapido
    if (filter === 'variabili') {
      result = result.filter((t) => !t.isFixed);
    } else if (filter === 'fisse') {
      result = result.filter((t) => t.isFixed);
    } else if (filter === 'inv') {
      result = result.filter((t) => t.isInvestment);
    }

    // 3. Filtro Soglia Importo
    if (amountFilter === 'gt50') {
      result = result.filter((t) => t.amount >= 50);
    } else if (amountFilter === 'gt100') {
      result = result.filter((t) => t.amount >= 100);
    }

    // 4. Query di Ricerca Testuale (Descrizione, Merchant, Note Fineco, Categoria, Importo)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      result = result.filter((tx) => {
        const smart = getSmartTitle(tx.description, tx.notes).toLowerCase();
        const desc = tx.description.toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        const cat = tx.category.toLowerCase();
        const amtStr = tx.amount.toString();
        const amtFormatted = formatEuro(tx.amount).toLowerCase();

        return words.every(
          (w) =>
            smart.includes(w) ||
            desc.includes(w) ||
            notes.includes(w) ||
            cat.includes(w) ||
            amtStr.includes(w) ||
            amtFormatted.includes(w)
        );
      });
    }

    return result;
  }, [pool, typeFilter, filter, amountFilter, searchQuery]);

  // Statistiche live della ricerca corrente
  const searchStats = useMemo(() => {
    let uscite = 0;
    let entrate = 0;
    filtered.forEach((t) => {
      if (t.type === 'uscita') uscite += t.amount;
      else entrate += t.amount;
    });
    return { uscite, entrate, count: filtered.length };
  }, [filtered]);

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

    if (
      confirm(
        `Sei sicuro di voler eliminare ${count} movimenti selezionati? L'operazione non può essere annullata.`
      )
    ) {
      onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelecting(false);
    }
  };

  // Toggle Espansione Dettaglio Fineco
  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    searchScope !== 'month' ||
    amountFilter !== 'all' ||
    typeFilter !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSearchScope('month');
    setAmountFilter('all');
    setTypeFilter('all');
    setFilter('all');
  };

  return (
    <div className="space-y-2.5">
      {/* 1. Titolo Movimenti Registrati a tutta larghezza */}
      <div className="w-full flex items-center justify-between pb-0.5 px-0.5">
        <h2 className="text-xs uppercase tracking-wider font-black text-slate-300 w-full flex items-center justify-between">
          <span>
            {searchScope === 'all'
              ? `Storico Globale (${filtered.length} di ${allTransactions.length})`
              : `Movimenti Registrati (${filtered.length})`}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold lowercase normal-case tracking-normal underline"
            >
              resetta filtri
            </button>
          )}
        </h2>
      </div>

      {/* 2. BARRA DI RICERCA GLOBALE & PER ESERCENTE */}
      <div className="space-y-1.5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca esercente o spesa (es. Zara, Ipercoop, Unipol, 150...)"
            className="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-2xl py-2.5 pl-9 pr-16 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Cancella testo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-1.5 rounded-xl border transition-all ${
                showAdvancedFilters || amountFilter !== 'all' || typeFilter !== 'all'
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Filtri avanzati per importo e tipo"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Banner Risultati Ricerca & Selettore Ambito (Mese vs Tutto lo Storico) */}
        {(searchQuery.trim() !== '' || searchScope === 'all') && (
          <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-2xl space-y-2 shadow-md animate-in fade-in duration-150">
            {/* Toggle Ambito: Solo Mese vs Tutto lo Storico */}
            {allTransactions.length > 0 && (
              <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSearchScope('month')}
                  className={`py-1.5 px-2 rounded-lg transition-all ${
                    searchScope === 'month'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Nel mese ({currentMonthLabel})
                </button>
                <button
                  type="button"
                  onClick={() => setSearchScope('all')}
                  className={`py-1.5 px-2 rounded-lg transition-all ${
                    searchScope === 'all'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tutto lo Storico ({allTransactions.length})
                </button>
              </div>
            )}

            {/* Riepilogo Totali della Ricerca */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-slate-300 font-semibold">
                {filtered.length} {filtered.length === 1 ? 'risultato trovato' : 'risultati trovati'}
              </span>

              <div className="flex items-center gap-2">
                {searchStats.uscite > 0 && (
                  <span className="font-mono font-bold text-rose-400 text-xs">
                    -{formatEuro(searchStats.uscite)}
                  </span>
                )}
                {searchStats.entrate > 0 && (
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    +{formatEuro(searchStats.entrate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filtri Avanzati (Espandibili): Importo & Tipo */}
        {showAdvancedFilters && (
          <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Tipo:</span>
              {[
                { key: 'all', label: 'Tutti' },
                { key: 'uscite', label: 'Solo Uscite (-)' },
                { key: 'entrate', label: 'Solo Entrate (+)' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTypeFilter(opt.key as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    typeFilter === opt.key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Importo:</span>
              {[
                { key: 'all', label: 'Qualsiasi' },
                { key: 'gt50', label: '≥ 50 €' },
                { key: 'gt100', label: '≥ 100 €' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setAmountFilter(opt.key as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    amountFilter === opt.key
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Riga con Nuovo e Seleziona affiancati */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuovo</span>
          </button>
        )}

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
          className={`w-full py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm ${
            !onAddClick ? 'col-span-2' : ''
          } ${
            isSelecting
              ? 'bg-rose-950/80 border-rose-500/70 text-rose-200 shadow-md'
              : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white'
          }`}
          title="Seleziona movimenti multipli per cancellarli"
        >
          <ListChecks className="w-4 h-4 text-emerald-400" />
          <span>{isSelecting ? 'Annulla' : 'Seleziona'}</span>
        </button>
      </div>

      {/* 4. Filtri orizzontali a scorrimento (Tutte, Spese, Fisse, PAC / Titoli) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar w-full">
        {[
          { key: 'all', label: `Tutte (${pool.length})` },
          { key: 'variabili', label: 'Spese' },
          { key: 'fisse', label: 'Fisse' },
          { key: 'inv', label: 'PAC / Titoli' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap font-bold text-xs transition-all ${
              filter === tab.key
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
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

      {/* Lista Elementi Filtrati */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
          <Receipt className="w-10 h-10 mx-auto text-slate-500 mb-2 stroke-1" />
          <p className="text-sm font-bold text-slate-300">
            {searchQuery
              ? `Nessun risultato per "${searchQuery}"`
              : 'Nessun movimento registrato'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-emerald-400 font-bold underline"
              >
                Clicca qui per azzerare la ricerca
              </button>
            ) : (
              <>Usa il tasto <span className="text-emerald-400 font-bold">+</span> per segnare una spesa</>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => {
            const isSelected = selectedIds.has(tx.id);
            const smartTitle = getSmartTitle(tx.description, tx.notes);
            const isExpanded = expandedId === tx.id;
            const hasFinecoDetails = Boolean(tx.notes && tx.notes.trim().length > 0);

            return (
              <div
                key={tx.id}
                onClick={() => {
                  if (isSelecting) {
                    handleToggleSelect(tx.id);
                  } else {
                    handleToggleExpand(tx.id);
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
                {/* RIGA 1: Checkbox / Spunta + Descrizione Parlante + Importo */}
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

                    {/* Descrizione Parlante (es. Spesa Ipercoop Pasteur, Spesa Zara, ecc.) */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-sm sm:text-base leading-snug break-words transition-colors ${
                          isSelected
                            ? 'text-rose-100'
                            : 'text-white group-hover:text-emerald-300'
                        }`}
                      >
                        {smartTitle}
                      </h3>

                      {/* Hint cliccabile per aprire dettaglio Fineco */}
                      {hasFinecoDetails && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400 group-hover:text-emerald-300 transition-colors">
                          <ChevronDown
                            className={`w-3 h-3 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-emerald-400' : ''
                            }`}
                          />
                          <span>
                            {isExpanded ? 'Nascondi testo Fineco' : 'Vedi testo Fineco'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Importo: VERDE per entrata (+), ROSSO per uscita (-) */}
                  <div className="text-right shrink-0 ml-2">
                    <span
                      className={`font-mono font-black text-base sm:text-lg tracking-tight ${
                        tx.type === 'entrata' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'entrata' ? '+' : '-'}
                      {formatEuro(tx.amount)}
                    </span>
                  </div>
                </div>

                {/* RIGA 2: Metadati (Data, Categoria, Badge FISSA / INV / In attesa) + Tasti Modifica / Elimina */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {/* Badge e Dettagli */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="font-mono font-bold text-slate-200">
                      {formatDate(tx.date, searchScope === 'all')}
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

                  {/* Tasti Azione Rapida (Pencil & Trash) */}
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

                {/* ACCORDION ESPANDIBILE: Testo Esatto Completo Fineco (visibile SOLO al click) */}
                {isExpanded && hasFinecoDetails && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2.5 pt-2 border-t border-slate-800 text-xs space-y-1.5 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <FileText className="w-3.5 h-3.5" />
                        Testo Esatto Estratto Conto Fineco:
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                        {tx.description}
                      </span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-2.5 text-xs font-mono text-emerald-200/95 leading-relaxed break-words select-all shadow-inner">
                      {tx.notes}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
