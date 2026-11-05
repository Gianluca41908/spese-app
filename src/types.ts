export type TransactionType = 'entrata' | 'uscita';

export type CategoryKey =
  | 'supermercato'
  | 'condominio'
  | 'utenze'
  | 'assicurazioni'
  | 'auto'
  | 'svago'
  | 'shopping'
  | 'investimenti'
  | 'trasferimenti'
  | 'stipendio'
  | 'rendite'
  | 'altro';

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  icon: string;
  color: string;
  defaultType: TransactionType;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number;
  description: string;
  category: CategoryKey;
  isInvestment: boolean; // Se vero, escluso da "Differenza Senza Investimenti"
  isFixed: boolean; // Se è una spesa fissa ricorrente programmata
  isSettled: boolean; // Se è già stata effettivamente addebitata / contabilizzata
  notes?: string;
}

export interface FixedExpenseTemplate {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: CategoryKey;
  isInvestment: boolean;
  defaultDay: number;
  active: boolean;
}

export interface MonthSummary {
  totalEntrate: number;
  totalUscite: number;
  saldoNetto: number; // Entrate - Uscite
  totalInvestimenti: number;
  entrateInvestimenti?: number;
  saldoSenzaInvestimenti: number; // Entrate ordinarie - Spese vive (esclusi tutti gli investimenti)
  speseFissePreviste: number;
  speseVariabili: number;
}

export type AssetClassType = 'liquidita' | 'obbligazioni' | 'etf' | 'azioni' | 'altro';

export interface PortfolioAsset {
  id: string;
  name: string;
  symbol: string;
  type: AssetClassType;
  quantity?: number; // Q.tà quote o valore nominale (es. 348 azioni, 11000 nominale)
  marketPrice?: number; // Prezzo unitario di mercato (es. 9.768 € per azione o 97.99 per obbligazione)
  averagePrice?: number; // Prezzo medio di carico PMC (es. 5.75 €)
  isin?: string; // Codice ISIN strumento (es. IT0003128367)
  invested: number; // Totale capitale investito (€)
  currentValue: number; // Controvalore attuale di mercato (€)
  notes?: string;
  lastUpdated?: string;
}

export interface PortfolioData {
  liquidita: number;
  assets: PortfolioAsset[];
  lastUpdated: string;
}

