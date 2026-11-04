import React, { useState } from 'react';
import {
  X,
  Upload,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import { importMasterExcelDataset, parseAndImportFile } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [mode, setMode] = useState<'replace' | 'merge'>('merge');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoadMaster = () => {
    if (
      mode === 'replace' &&
      !confirm('Sei sicuro di voler sostituire tutti i dati attuali con lo storico Excel?')
    ) {
      return;
    }

    try {
      setLoading(true);
      const res = importMasterExcelDataset(mode);
      setResultMsg(`Caricati con successo ${res.count} movimenti! Totale in archivio: ${res.total}`);
      onImportSuccess();
    } catch (err: any) {
      alert('Errore durante il caricamento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      mode === 'replace' &&
      !confirm('Sei sicuro di voler sostituire tutti i dati attuali con i dati di questo file?')
    ) {
      return;
    }

    try {
      setLoading(true);
      const res = await parseAndImportFile(file, mode);
      setResultMsg(`Importati con successo ${res.count} movimenti da ${file.name}! Totale in archivio: ${res.total}`);
      onImportSuccess();
    } catch (err: any) {
      alert('Errore nella lettura del file Excel: ' + err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg text-white">Carica Movimenti</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Modalità: Merge vs Sostituisci */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Modalità di Caricamento
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMode('merge')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  mode === 'merge'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-semibold">Unisci ai dati attuali</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Non cancella le spese già presenti</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('replace')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  mode === 'replace'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300 font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-semibold">Sostituisci tutto</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Riparte da zero con i nuovi dati</div>
              </button>
            </div>
          </div>

          {/* Opzione 1: Carica Storico Completo 2022 - 2026 */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Storico Excel 2022 - 2026</h3>
                <p className="text-xs text-emerald-300/80">953 movimenti già estratti e categorizzati</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Carica istantaneamente tutti i movimenti del tuo file master <code className="text-emerald-400">MOVIMENTI CONTO 2022 - 2026.xlsx</code> (inclusi PAC, spese supermercato, utenze, stipendi).
            </p>

            <button
              type="button"
              onClick={handleLoadMaster}
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-98"
            >
              <Database className="w-4 h-4" />
              <span>{loading ? 'Caricamento in corso...' : 'Carica Tutti i 953 Movimenti'}</span>
            </button>
          </div>

          {/* Opzione 2: Carica file dal dispositivo */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <FileUp className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                Importa da un File Excel (.xlsx / .xls)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Seleziona un estratto conto o un file Excel dal tuo smartphone o PC:
            </p>

            <label className="block w-full cursor-pointer">
              <div className="w-full py-3 px-3 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl text-center text-xs text-slate-300 font-semibold flex items-center justify-center gap-2 transition-all">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Scegli file dal telefono o PC</span>
              </div>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>

          {/* Messaggio di successo */}
          {resultMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{resultMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
