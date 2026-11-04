import React, { useState } from 'react';
import { X, FileSpreadsheet, Copy, Check, Download } from 'lucide-react';
import { Transaction } from '../types';
import { exportMonthToExcel, copyTransactionsForExcelClipboard } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  monthLabel: string;
}

export const ExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  transactions,
  monthLabel,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadExcel = () => {
    exportMonthToExcel(transactions, monthLabel);
  };

  const handleCopyClipboard = async () => {
    const text = copyTransactionsForExcelClipboard(transactions);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Impossibile copiare negli appunti:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-lg text-white">Esporta per Excel</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            I dati di <strong className="text-white">{monthLabel}</strong> ({transactions.length} movimenti) sono formattati esattamente con le colonne del tuo file <code className="text-emerald-400">MOVIMENTI CONTO</code> (Data, Entrate, Uscite, Descrizione).
          </p>

          {/* Opzione 1: Scarica File .XLSX */}
          <button
            onClick={handleDownloadExcel}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-98 transition-all"
          >
            <Download className="w-5 h-5" />
            <span>Scarica File .XLSX</span>
          </button>

          {/* Opzione 2: Copia negli appunti */}
          <button
            onClick={handleCopyClipboard}
            className={`w-full py-3 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Copiato! Incolla direttamente su Excel</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 text-slate-400" />
                <span>Copia Tabella per Incolla Rapido</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
