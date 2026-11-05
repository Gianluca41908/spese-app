import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileSpreadsheet,
  CalendarCheck,
  Wallet,
  Database,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import {
  getMonthTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  deleteMultipleTransactions,
  toggleSettled,
  getFixedTemplates,
  saveFixedTemplates,
  applyFixedExpensesToMonth,
  calculateMonthSummary,
  syncDataWithCloud,
} from './services/storage';
import { subscribeToTransactions } from './services/supabase';
import { Transaction, FixedExpenseTemplate } from './types';
import { DashboardCards } from './components/DashboardCards';
import { MonthSelector } from './components/MonthSelector';
import { TransactionsList } from './components/TransactionsList';
import { AddTransactionModal } from './components/AddTransactionModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import { FixedExpensesModal } from './components/FixedExpensesModal';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';

export const App: React.FC = () => {
  // Imposta il mese iniziale al mese corrente
  const now = new Date();
  const initialYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(initialYM);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedTemplates, setFixedTemplates] = useState<FixedExpenseTemplate[]>(() => getFixedTemplates());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  // Modali
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isFixedOpen, setIsFixedOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Caricamento dati
  const loadData = () => {
    const txs = getMonthTransactions(selectedYearMonth);
    setTransactions(txs);
    setFixedTemplates(getFixedTemplates());
  };

  useEffect(() => {
    loadData();
  }, [selectedYearMonth]);

  // Sincronizzazione iniziale con Supabase e Realtime listener
  useEffect(() => {
    setSyncStatus('syncing');
    syncDataWithCloud()
      .then((res) => {
        if (res) {
          loadData();
          setSyncStatus('synced');
        } else {
          setSyncStatus('offline');
        }
      })
      .catch(() => setSyncStatus('offline'));

    const unsubscribe = subscribeToTransactions(() => {
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Calcolo KPI del mese
  const summary = calculateMonthSummary(transactions);

  // Formatta il nome del mese per l'UI
  let capitalizedMonthLabel = 'Tutti i Movimenti';
  if (selectedYearMonth !== 'ALL') {
    const [yStr, mStr] = selectedYearMonth.split('-');
    const dateObj = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, 1);
    const monthLabel = dateObj.toLocaleDateString('it-IT', {
      month: 'long',
      year: 'numeric',
    });
    capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  }

  // Handler Aggiungi Transazione
  const handleAddTransaction = (newTxData: any) => {
    addTransaction(newTxData);
    loadData();
  };

  // Handler Aggiorna Transazione Esistente
  const handleUpdateTransaction = (updatedTx: Transaction) => {
    updateTransaction(updatedTx);
    loadData();
    setEditingTransaction(null);
  };

  // Handler Elimina Singola
  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    loadData();
  };

  // Handler Elimina Multiple
  const handleDeleteMultipleTransactions = (ids: string[]) => {
    deleteMultipleTransactions(ids);
    loadData();
  };

  // Handler Toggle Contabilizzato
  const handleToggleSettled = (id: string) => {
    toggleSettled(id);
    loadData();
  };

  // Handler Applica Spese Fisse al Mese
  const handleApplyFixed = () => {
    if (selectedYearMonth === 'ALL') {
      alert('Seleziona un mese specifico per applicare le spese fisse.');
      return;
    }
    const result = applyFixedExpensesToMonth(selectedYearMonth);
    loadData();
    if (result.added > 0) {
      alert(`Aggiunte ${result.added} voci fisse a ${capitalizedMonthLabel}!`);
    } else {
      alert(`Tutte le voci fisse attive sono già presenti per ${capitalizedMonthLabel}.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-36 sm:pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base leading-tight tracking-tight text-white">
                Spese & Budget
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-300 font-medium">Fineco & Conti</p>
                <div className="flex items-center text-[11px]">
                  {syncStatus === 'syncing' && (
                    <span className="flex items-center gap-1 text-cyan-400 font-bold">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Cloud...
                    </span>
                  )}
                  {syncStatus === 'synced' && (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold" title="Sincronizzato con Supabase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Cloud
                    </span>
                  )}
                  {syncStatus === 'offline' && (
                    <span className="flex items-center gap-1 text-slate-400 font-semibold" title="Modalità locale">
                      <CloudOff className="w-2.5 h-2.5" /> Locale
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Pulsante Carica Movimenti (Excel / Storico) */}
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white active:scale-95 transition-all text-xs font-bold shadow-sm"
              title="Carica tutti i movimenti dallo storico Excel o file"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Carica Dati</span>
            </button>

            {/* Menu Spese Fisse */}
            <button
              onClick={() => setIsFixedOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white active:scale-95 transition-all text-xs font-bold shadow-sm"
              title="Personalizza le spese fisse e ricorrenti"
            >
              <CalendarCheck className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Spese Fisse</span>
            </button>

            {/* Esporta Excel */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white active:scale-95 transition-all"
              title="Esporta per Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-xl mx-auto px-3.5 sm:px-4 pt-3 space-y-3.5 sm:space-y-4">
        {/* Selettore del Mese */}
        <MonthSelector
          yearMonth={selectedYearMonth}
          onChange={setSelectedYearMonth}
        />

        {/* Cruscotto KPI (Hero Card con Spese Vive e Saldo) */}
        <DashboardCards summary={summary} />

        {/* Banner Rapido se la lista è vuota */}
        {transactions.length === 0 && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="text-xs text-slate-300 font-medium text-center sm:text-left">
              Nessun movimento presente. Puoi caricare lo storico completo dal tuo Excel o applicare le spese fisse.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shrink-0 active:scale-95 transition-all shadow-md"
              >
                Carica Storico Excel
              </button>
              {selectedYearMonth !== 'ALL' && (
                <button
                  onClick={handleApplyFixed}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs rounded-xl shrink-0 active:scale-95 transition-all"
                >
                  Carica Fisse
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista Movimenti */}
        <section className="pt-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs uppercase tracking-wider font-black text-slate-300">
              Movimenti Registrati ({transactions.length})
            </h2>
            <button
              onClick={() => setIsAddOpen(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-black flex items-center gap-1 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuovo</span>
            </button>
          </div>

          <TransactionsList
            transactions={transactions}
            onToggleSettled={handleToggleSettled}
            onDelete={handleDeleteTransaction}
            onDeleteMultiple={handleDeleteMultipleTransactions}
            onEdit={(tx) => setEditingTransaction(tx)}
          />
        </section>
      </main>

      {/* Floating Action Button (FAB) su Mobile */}
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-2xl shadow-emerald-500/50 flex items-center justify-center active:scale-90 transition-all"
          aria-label="Nuova Spesa"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Modale Nuovo Movimento */}
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddTransaction}
        defaultDate={
          selectedYearMonth === 'ALL'
            ? new Date().toISOString().split('T')[0]
            : selectedYearMonth + '-01'
        }
      />

      {/* Modale Modifica Movimento Esistente */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Menu Spese Fisse & Ricorrenti */}
      <FixedExpensesModal
        isOpen={isFixedOpen}
        onClose={() => setIsFixedOpen(false)}
        templates={fixedTemplates}
        onSaveTemplates={(updated) => {
          setFixedTemplates(updated);
          saveFixedTemplates(updated);
        }}
        onApplyToMonth={handleApplyFixed}
        currentMonthName={capitalizedMonthLabel}
      />

      {/* Modale Carica / Importa Movimenti */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={loadData}
      />

      {/* Modale Esporta per Excel */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        transactions={transactions}
        monthLabel={capitalizedMonthLabel}
      />
    </div>
  );
};

export default App;
