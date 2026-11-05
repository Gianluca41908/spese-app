import { PortfolioData, PortfolioAsset } from '../types';

const PORTFOLIO_STORAGE_KEY = 'spese_gianluca_portfolio_v3';

// Dati reali completi con quantità esatte, ISIN, PMC e prezzi di mercato aggiornati
export const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  liquidita: 38117.0, // Liquidità conto Fineco (post rimborso BOT 20.000€)
  lastUpdated: new Date().toISOString().split('T')[0],
  assets: [
    {
      id: 'asset-btp37',
      name: 'BTP 2037 4.0%',
      symbol: 'BTP37',
      isin: 'IT0003934657',
      type: 'obbligazioni',
      quantity: 11000,
      averagePrice: 89.78,
      marketPrice: 97.99,
      invested: 9875.8,
      currentValue: 10778.9, // 11000 * 0.9799
      notes: 'BTP Scadenza 01/02/2037 con cedola semestrale 4% (Feb/Ago)',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'asset-btp49',
      name: 'BTP 2049 3.85%',
      symbol: 'BTP49',
      isin: 'IT0005363111',
      type: 'obbligazioni',
      quantity: 12000,
      averagePrice: 86.18,
      marketPrice: 87.55,
      invested: 10341.6,
      currentValue: 10506.0, // 12000 * 0.8755
      notes: 'BTP Scadenza 01/09/2049 con cedola semestrale 3.85% (Mar/Set)',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'asset-msciw-100',
      name: 'MSCI World FAM (PAC 100€)',
      symbol: 'MSCIW (PAC 100)',
      isin: 'IE00BD2PJJ59',
      type: 'etf',
      quantity: 42.953,
      averagePrice: 124.005,
      marketPrice: 170.5,
      invested: 5326.4,
      currentValue: 7323.49, // 42.953 * 170.50
      notes: 'Mandato 1: PAC storico Fineco FAM MSCI World',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'asset-msciw-1000',
      name: 'MSCI World FAM (PAC 1000€)',
      symbol: 'MSCIW (PAC 1000)',
      isin: 'IE00BD2PJJ59',
      type: 'etf',
      quantity: 24.096,
      averagePrice: 166.326,
      marketPrice: 170.5,
      invested: 4007.8,
      currentValue: 4108.37, // 24.096 * 170.50
      notes: 'Mandato 2: PAC 1.000€/mese avviato a giugno 2026',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'asset-enel',
      name: 'Enel S.p.A.',
      symbol: 'ENEL',
      isin: 'IT0003128367',
      type: 'azioni',
      quantity: 348,
      averagePrice: 5.75,
      marketPrice: 9.768,
      invested: 2000.97,
      currentValue: 3399.26, // 348 * 9.768
      notes: 'Azioni Enel Borsa Italiana - Dividendi a gennaio e luglio',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'asset-intel',
      name: 'Intel Corp',
      symbol: 'INTEL',
      isin: 'US4581401001',
      type: 'azioni',
      quantity: 116,
      averagePrice: 34.586,
      marketPrice: 49.47, // Prezzo corrente effettivo Fineco (era 84.30 nel vecchio screenshot)
      invested: 4011.93,
      currentValue: 5738.52, // 116 * 49.47
      notes: 'Azioni Intel Corp (NASDAQ)',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'asset-etf-difesa',
      name: 'VanEck Defense UCITS ETF',
      symbol: 'ETF DIFESA',
      isin: 'IE000YYE6WK5',
      type: 'etf',
      quantity: 55,
      averagePrice: 54.42,
      marketPrice: 48.45,
      invested: 2993.1,
      currentValue: 2664.75, // 55 * 48.45
      notes: 'ETF Tematico Difesa & Aerospazio (Borsa Italiana: DFNS)',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'asset-stellantis',
      name: 'Stellantis N.V.',
      symbol: 'STELLANTIS',
      isin: 'NL00150001Q9',
      type: 'azioni',
      quantity: 415,
      averagePrice: 9.664,
      marketPrice: 3.968,
      invested: 4010.57,
      currentValue: 1646.72, // 415 * 3.968
      notes: 'Azioni Stellantis (Borsa Italiana)',
      lastUpdated: new Date().toISOString().split('T')[0],
    },
  ],
};

export function getPortfolioData(): PortfolioData {
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.assets)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Errore nel recupero del portafoglio da localStorage:', e);
  }
  // Se non presente, salva e ritorna il default iniziale
  savePortfolioData(DEFAULT_PORTFOLIO_DATA);
  return DEFAULT_PORTFOLIO_DATA;
}

export function savePortfolioData(data: PortfolioData): void {
  try {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Errore nel salvataggio del portafoglio in localStorage:', e);
  }
}

export function updateLiquidity(amount: number): PortfolioData {
  const current = getPortfolioData();
  const updated: PortfolioData = {
    ...current,
    liquidita: amount,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
  savePortfolioData(updated);
  return updated;
}

export function upsertAsset(asset: PortfolioAsset): PortfolioData {
  const current = getPortfolioData();
  const index = current.assets.findIndex((a) => a.id === asset.id);
  let newAssets: PortfolioAsset[];

  if (index >= 0) {
    newAssets = [...current.assets];
    newAssets[index] = {
      ...asset,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  } else {
    newAssets = [
      ...current.assets,
      {
        ...asset,
        id: asset.id || `asset-${Date.now()}`,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    ];
  }

  const updated: PortfolioData = {
    ...current,
    assets: newAssets,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
  savePortfolioData(updated);
  return updated;
}

export function deleteAsset(id: string): PortfolioData {
  const current = getPortfolioData();
  const updated: PortfolioData = {
    ...current,
    assets: current.assets.filter((a) => a.id !== id),
    lastUpdated: new Date().toISOString().split('T')[0],
  };
  savePortfolioData(updated);
  return updated;
}

export function resetPortfolioToDefault(): PortfolioData {
  savePortfolioData(DEFAULT_PORTFOLIO_DATA);
  return DEFAULT_PORTFOLIO_DATA;
}
