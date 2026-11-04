import * as XLSX from 'xlsx';
import { Transaction, FixedExpenseTemplate, MonthSummary } from '../types';
import { DEFAULT_FIXED_TEMPLATES } from '../constants';
import masterExcelData from '../data/allTransactions.json';

const TX_STORAGE_KEY = 'spese_gianluca_tx_v1';
const TEMPLATES_STORAGE_KEY = 'spese_gianluca_templates_v1';

// Inizializza i dati mock se è la prima apertura (usando i dati reali del tuo Excel di Ottobre 2026!)
function getInitialTransactions(): Transaction[] {
  const seedYearMonth = '2026-10';
  return [
    {
      id: 'seed-stage',
      date: `${seedYearMonth}-15`,
      type: 'entrata',
      amount: 800.0,
      description: 'Compenso Stage Web Dev',
      category: 'stipendio',
      isInvestment: false,
      isFixed: true,
      isSettled: true,
    },
    {
      id: 'seed-naspi',
      date: `${seedYearMonth}-10`,
      type: 'entrata',
      amount: 880.21,
      description: 'Indennità NASpI Ottobre',
      category: 'stipendio',
      isInvestment: false,
      isFixed: true,
      isSettled: true,
    },
    {
      id: 'seed-pac',
      date: `${seedYearMonth}-01`,
      type: 'uscita',
      amount: 1000.6,
      description: 'Rata PAC Fineco FAM MSCI World',
      category: 'investimenti',
      isInvestment: true,
      isFixed: true,
      isSettled: true,
    },
    {
      id: 'seed-tim',
      date: `${seedYearMonth}-08`,
      type: 'uscita',
      amount: 24.9,
      description: 'TIM Fibra Casa',
      category: 'utenze',
      isInvestment: false,
      isFixed: true,
      isSettled: true,
    },
    {
      id: 'seed-unipol',
      date: `${seedYearMonth}-17`,
      type: 'uscita',
      amount: 112.58,
      description: 'Unipol Assicurazioni',
      category: 'assicurazioni',
      isInvestment: false,
      isFixed: true,
      isSettled: true,
    },
    {
      id: 'seed-condominio',
      date: `${seedYearMonth}-01`,
      type: 'uscita',
      amount: 156.0,
      description: 'Condominio The Bridge Ordinario',
      category: 'condominio',
      isInvestment: false,
      isFixed: true,
      isSettled: true,
    },
    {
      id: 'seed-genius',
      date: `${seedYearMonth}-05`,
      type: 'uscita',
      amount: 300.0,
      description: 'Ricarica Genius Card',
      category: 'trasferimenti',
      isInvestment: false,
      isFixed: true,
      isSettled: true,
    },
    {
      id: 'seed-prelievo',
      date: `${seedYearMonth}-07`,
      type: 'uscita',
      amount: 200.0,
      description: 'Prelievo Bancomat',
      category: 'trasferimenti',
      isInvestment: false,
      isFixed: true,
      isSettled: true,
    },
    {
      id: 'seed-spesa1',
      date: `${seedYearMonth}-12`,
      type: 'uscita',
      amount: 269.56,
      description: '4 Spese Supermercato Ipercoop',
      category: 'supermercato',
      isInvestment: false,
      isFixed: false,
      isSettled: true,
    },
    {
      id: 'seed-zara',
      date: `${seedYearMonth}-18`,
      type: 'uscita',
      amount: 179.8,
      description: 'Abbigliamento Zara',
      category: 'shopping',
      isInvestment: false,
      isFixed: false,
      isSettled: true,
    },
    {
      id: 'seed-tari',
      date: `${seedYearMonth}-24`,
      type: 'uscita',
      amount: 194.95,
      description: 'TARI Comune di Bari',
      category: 'utenze',
      isInvestment: false,
      isFixed: true,
      isSettled: true,
    },
  ];
}

// Caricamento Transazioni da LocalStorage
export function getAllTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TX_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialTransactions();
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Errore nel recupero delle transazioni da localStorage:', err);
    return [];
  }
}

// Salvataggio Transazioni
export function saveAllTransactions(txs: Transaction[]): void {
  try {
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(txs));
    // -------------------------------------------------------------
    // FASE B: Qui si aggancerà il salvataggio automatico su Supabase!
    // syncWithSupabase(txs);
    // -------------------------------------------------------------
  } catch (err) {
    console.error('Errore nel salvataggio delle transazioni:', err);
  }
}

// Filtra per mese (formato "YYYY-MM") o restituisce tutto con "ALL"
export function getMonthTransactions(yearMonth: string): Transaction[] {
  const all = getAllTransactions();
  if (yearMonth === 'ALL') {
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return all
    .filter((t) => t.date.startsWith(yearMonth))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Aggiunge una transazione
export function addTransaction(
  tx: Omit<Transaction, 'id'>
): Transaction {
  const all = getAllTransactions();
  const newTx: Transaction = {
    ...tx,
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
  };
  saveAllTransactions([newTx, ...all]);
  return newTx;
}

// Aggiorna una transazione esistente
export function updateTransaction(updatedTx: Transaction): void {
  const all = getAllTransactions();
  const index = all.findIndex((t) => t.id === updatedTx.id);
  if (index !== -1) {
    all[index] = updatedTx;
    saveAllTransactions([...all]);
  }
}

// Elimina una transazione
export function deleteTransaction(id: string): void {
  const all = getAllTransactions();
  const filtered = all.filter((t) => t.id !== id);
  saveAllTransactions(filtered);
}

// Elimina movimenti multipli in blocco
export function deleteMultipleTransactions(ids: string[]): void {
  const idSet = new Set(ids);
  const all = getAllTransactions();
  const filtered = all.filter((t) => !idSet.has(t.id));
  saveAllTransactions(filtered);
}

// Elimina tutti i movimenti del mese o tutti in assoluto
export function clearTransactions(yearMonth?: string): void {
  if (!yearMonth || yearMonth === 'ALL') {
    saveAllTransactions([]);
  } else {
    const all = getAllTransactions();
    const filtered = all.filter((t) => !t.date.startsWith(yearMonth));
    saveAllTransactions(filtered);
  }
}

// Carica lo storico completo da MOVIMENTI CONTO 2022 - 2026.xlsx
export function importMasterExcelDataset(mode: 'replace' | 'merge'): { count: number; total: number } {
  const masterTxs = masterExcelData as Transaction[];
  if (mode === 'replace') {
    saveAllTransactions(masterTxs);
    return { count: masterTxs.length, total: masterTxs.length };
  } else {
    const existing = getAllTransactions();
    const existingSet = new Set(
      existing.map((t) => `${t.date}_${t.amount}_${t.description.toLowerCase().trim()}`)
    );
    const toAdd = masterTxs.filter(
      (t) => !existingSet.has(`${t.date}_${t.amount}_${t.description.toLowerCase().trim()}`)
    );
    const merged = [...toAdd, ...existing].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    saveAllTransactions(merged);
    return { count: toAdd.length, total: merged.length };
  }
}

// Importa da file Excel (.xlsx / .xls) caricato dall'utente
export async function parseAndImportFile(
  file: File,
  mode: 'replace' | 'merge'
): Promise<{ count: number; total: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const parsedTxs: Transaction[] = [];

        for (const sheetName of wb.SheetNames) {
          if (sheetName.toLowerCase().includes('wallet')) continue;
          const ws = wb.Sheets[sheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          const hIdx = rows.findIndex(
            (r) =>
              Array.isArray(r) &&
              r.some((c) => String(c).toLowerCase().includes('data')) &&
              r.some(
                (c) =>
                  String(c).toLowerCase().includes('entrat') ||
                  String(c).toLowerCase().includes('uscit')
              )
          );
          if (hIdx === -1) continue;

          const headerRow = rows[hIdx];
          const headers = headerRow.map((h: any) => String(h || '').trim().toLowerCase());
          const dateCol = headers.findIndex((h: string) => h.includes('data'));
          const entrateCol = headers.findIndex((h: string) => h.includes('entrat'));
          const usciteCol = headers.findIndex((h: string) => h.includes('uscit'));
          const descCol = headers.findIndex(
            (h: string) => h === 'descrizione' || (h.includes('descriz') && !h.includes('completa'))
          );
          const fullDescCol = headers.findIndex(
            (h: string, idx: number) => idx !== descCol && h.includes('descriz')
          );
          const statoCol = headers.findIndex((h: string) => h.includes('stato'));

          for (let i = hIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;
            const dateCell = dateCol !== -1 ? row[dateCol] : row[0];
            if (!dateCell) continue;

            let dateStr: string | null = null;
            if (typeof dateCell === 'number') {
              const d = XLSX.SSF.parse_date_code(dateCell);
              dateStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
            } else if (typeof dateCell === 'string') {
              const parts = dateCell.trim().split('/');
              if (parts.length === 3) {
                dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
            if (!dateStr) continue;

            const entCell = entrateCol !== -1 ? row[entrateCol] : row[1];
            const uscCell = usciteCol !== -1 ? row[usciteCol] : row[2];

            const entrate =
              typeof entCell === 'number'
                ? Math.abs(entCell)
                : entCell
                ? Math.abs(parseFloat(String(entCell).replace(',', '.')))
                : 0;
            const uscite =
              typeof uscCell === 'number'
                ? Math.abs(uscCell)
                : uscCell
                ? Math.abs(parseFloat(String(uscCell).replace(',', '.')))
                : 0;

            const isEntrata = entrate > 0 && uscite === 0;
            const amount = isEntrata ? entrate : uscite;
            if (isNaN(amount) || amount <= 0) continue;

            const desc = (
              descCol !== -1 && row[descCol] ? row[descCol] : row[3] || 'Movimento'
            )
              .toString()
              .trim();
            const fullDesc = (
              fullDescCol !== -1 && row[fullDescCol] ? row[fullDescCol] : row[4] || ''
            )
              .toString()
              .trim();

            const isContabilizzato =
              statoCol !== -1 && row[statoCol]
                ? String(row[statoCol]).toLowerCase().includes('contabilizzato')
                : true;

            const text = (desc + ' ' + fullDesc).toLowerCase();
            const isInv =
              text.includes('msci world') ||
              text.includes('pac') ||
              text.includes('titoli') ||
              text.includes('stellantis') ||
              text.includes('intel') ||
              text.includes('fondi') ||
              text.includes('dossier titoli') ||
              text.includes('btp');

            let cleanDesc = desc;
            if (fullDesc && (desc === 'Pagamento Bancomat' || desc === 'BANCOMAT' || desc === 'SEPA Direct Debit' || desc === 'Bonifico SEPA Italia' || desc === 'Bonifico Istantaneo' || desc === 'Compravendita Titoli' || desc === 'Dividendo Italia')) {
              if (fullDesc.includes('IPERCOOP')) cleanDesc = 'Supermercato Ipercoop';
              else if (fullDesc.includes('NEXTA ENERGIA')) cleanDesc = 'Nexta Energia Luce';
              else if (fullDesc.includes('UNIPOL')) cleanDesc = 'Unipol Assicurazioni';
              else if (fullDesc.includes('Condominio The Bridge')) cleanDesc = 'Condominio The Bridge';
              else if (fullDesc.includes('Rata Pac')) cleanDesc = 'Rata PAC Fineco FAM MSCI World';
              else if (fullDesc.includes('INDENNITA NASPI')) cleanDesc = 'Indennità NASpI INPS';
              else if (fullDesc.includes('Ricarica genius')) cleanDesc = 'Ricarica Genius Card';
              else if (fullDesc.includes('STELLANTIS')) cleanDesc = 'Acquisto Azioni Stellantis';
              else if (fullDesc.includes('INTEL')) cleanDesc = 'Acquisto Azioni Intel';
              else if (fullDesc.includes('ENEL')) cleanDesc = 'Dividendo ENEL';
              else if (fullDesc.includes('COMUNE DI BARI')) cleanDesc = 'TARI Comune di Bari';
              else cleanDesc = desc;
            }

            parsedTxs.push({
              id: 'tx-imp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              date: dateStr,
              type: isEntrata ? 'entrata' : 'uscita',
              amount: Math.round(amount * 100) / 100,
              description: cleanDesc,
              category: text.includes('ipercoop') || text.includes('supermercato')
                ? 'supermercato'
                : isInv
                ? 'investimenti'
                : text.includes('unipol')
                ? 'assicurazioni'
                : text.includes('condominio')
                ? 'condominio'
                : text.includes('tim') || text.includes('nexta') || text.includes('tari')
                ? 'utenze'
                : text.includes('stipendio') || text.includes('naspi') || text.includes('stage')
                ? 'stipendio'
                : 'altro',
              isInvestment: isInv,
              isFixed: text.includes('condominio') || text.includes('unipol') || text.includes('tim'),
              isSettled: isContabilizzato,
              notes: fullDesc || undefined,
            });
          }
        }

        if (mode === 'replace') {
          saveAllTransactions(parsedTxs);
          resolve({ count: parsedTxs.length, total: parsedTxs.length });
        } else {
          const existing = getAllTransactions();
          const existingKeys = new Set(
            existing.map((t) => `${t.date}_${t.amount}_${t.description.toLowerCase().trim()}`)
          );
          const toAdd = parsedTxs.filter(
            (t) => !existingKeys.has(`${t.date}_${t.amount}_${t.description.toLowerCase().trim()}`)
          );
          const merged = [...toAdd, ...existing].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          saveAllTransactions(merged);
          resolve({ count: toAdd.length, total: merged.length });
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Spunta o toglie la spunta (isSettled)
export function toggleSettled(id: string): void {
  const all = getAllTransactions();
  const tx = all.find((t) => t.id === id);
  if (tx) {
    tx.isSettled = !tx.isSettled;
    saveAllTransactions([...all]);
  }
}

// Template Spese Fisse
export function getFixedTemplates(): FixedExpenseTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_FIXED_TEMPLATES));
      return DEFAULT_FIXED_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_FIXED_TEMPLATES));
      return DEFAULT_FIXED_TEMPLATES;
    }
    return parsed;
  } catch (err) {
    return DEFAULT_FIXED_TEMPLATES;
  }
}

export function resetFixedTemplatesToDefault(): FixedExpenseTemplate[] {
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_FIXED_TEMPLATES));
  return DEFAULT_FIXED_TEMPLATES;
}

export function saveFixedTemplates(templates: FixedExpenseTemplate[]): void {
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

// Applica le spese fisse al mese indicato se non già presenti
export function applyFixedExpensesToMonth(yearMonth: string): { added: number } {
  const all = getAllTransactions();
  const templates = getFixedTemplates().filter((t) => t.active);
  const currentMonthTxs = all.filter((t) => t.date.startsWith(yearMonth));

  let addedCount = 0;
  const newTxs: Transaction[] = [];

  for (const tmpl of templates) {
    // Verifica se esiste già una spesa con lo stesso nome nel mese
    const alreadyExists = currentMonthTxs.some(
      (t) => t.description.toLowerCase().trim() === tmpl.name.toLowerCase().trim()
    );

    if (!alreadyExists) {
      const dayStr = String(tmpl.defaultDay).padStart(2, '0');
      newTxs.push({
        id: 'fix-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        date: `${yearMonth}-${dayStr}`,
        type: tmpl.type,
        amount: tmpl.amount,
        description: tmpl.name,
        category: tmpl.category,
        isInvestment: tmpl.isInvestment,
        isFixed: true,
        isSettled: false,
      });
      addedCount++;
    }
  }

  if (addedCount > 0) {
    saveAllTransactions([...newTxs, ...all]);
  }

  return { added: addedCount };
}

// Calcola i KPI esatti del tuo Excel
export function calculateMonthSummary(transactions: Transaction[]): MonthSummary {
  let totalEntrate = 0;
  let totalUscite = 0;
  let usciteInvestimenti = 0;
  let entrateInvestimenti = 0;
  let speseFissePreviste = 0;
  let speseVariabili = 0;

  for (const t of transactions) {
    if (t.type === 'entrata') {
      totalEntrate += t.amount;
      if (t.isInvestment) {
        entrateInvestimenti += t.amount;
      }
    } else {
      totalUscite += t.amount;
      if (t.isInvestment) {
        usciteInvestimenti += t.amount;
      }
      if (t.isFixed) {
        speseFissePreviste += t.amount;
      } else {
        speseVariabili += t.amount;
      }
    }
  }

  const saldoNetto = totalEntrate - totalUscite;
  // Margine del mese esclusi gli investimenti finanziari:
  // (Entrate ordinarie) - (Spese vive ordinarie)
  const entrateOrdinarie = totalEntrate - entrateInvestimenti;
  const speseVive = totalUscite - usciteInvestimenti;
  const saldoSenzaInvestimenti = entrateOrdinarie - speseVive;

  return {
    totalEntrate,
    totalUscite,
    saldoNetto,
    totalInvestimenti: usciteInvestimenti,
    entrateInvestimenti,
    saldoSenzaInvestimenti,
    speseFissePreviste,
    speseVariabili,
  };
}

// Genera il file .XLSX compatibile al 100% con MOVIMENTI CONTO
export function exportMonthToExcel(transactions: Transaction[], monthLabel: string): void {
  // Ordina per data crescente per l'Excel
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rows = sorted.map((t) => {
    // Formatta la data in DD/MM/YYYY come il tuo Excel
    const [y, m, d] = t.date.split('-');
    const dateFormatted = `${d}/${m}/${y}`;

    return {
      Data: dateFormatted,
      Entrate: t.type === 'entrata' ? t.amount : '',
      Uscite: t.type === 'uscita' ? -t.amount : '',
      Descrizione: t.description,
      Categoria: t.category.toUpperCase(),
      Investimento: t.isInvestment ? 'SI' : 'NO',
      Contabilizzato: t.isSettled ? 'SI' : 'NO',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, monthLabel);

  XLSX.writeFile(workbook, `Movimenti_${monthLabel.replace(/\s+/g, '_')}.xlsx`);
}

// Copia negli appunti in formato testo tabellare (TSV) pronto da incollare direttamente in Excel
export function copyTransactionsForExcelClipboard(transactions: Transaction[]): string {
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const header = ['Data', 'Entrate', 'Uscite', 'Descrizione'].join('\t');
  const lines = sorted.map((t) => {
    const [y, m, d] = t.date.split('-');
    const dateFormatted = `${d}/${m}/${y}`;
    const ent = t.type === 'entrata' ? t.amount.toFixed(2).replace('.', ',') : '';
    const usc = t.type === 'uscita' ? (-t.amount).toFixed(2).replace('.', ',') : '';
    return [dateFormatted, ent, usc, t.description].join('\t');
  });

  return [header, ...lines].join('\n');
}
