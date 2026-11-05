import { PortfolioData, PortfolioAsset } from '../types';

const PORTFOLIO_STORAGE_KEY = 'spese_gianluca_portfolio_v1';

// Dati iniziali reali estratti direttamente dal foglio 'wallet-25' dell'Excel (snapshot al 27/10/2026)
export const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  liquidita: 38117.0, // Liquidità conto Fineco dopo rimborso BOT 20k
  lastUpdated: '2026-10-27',
  assets: [
    {
      id: 'asset-btp37',
      name: 'BTP 2037 4.0%',
      symbol: 'BTP37',
      type: 'obbligazioni',
      invested: 9875.8,
      currentValue: 10627.1,
      notes: 'BTP Scadenza 2037 con cedola semestrale',
      lastUpdated: '2026-10-27',
    },
    {
      id: 'asset-btp49',
      name: 'BTP 2049 3.85%',
      symbol: 'BTP49',
      type: 'obbligazioni',
      invested: 10341.6,
      currentValue: 10338.0,
      notes: 'BTP Scadenza 2049 con cedola semestrale',
      lastUpdated: '2026-10-27',
    },
    {
      id: 'asset-msciw-100',
      name: 'MSCI World FAM (PAC 100€)',
      symbol: 'MSCIW (PAC 100)',
      type: 'etf',
      invested: 5326.4,
      currentValue: 7257.38,
      notes: 'Piano di accumulo storico Fineco da 100€/mese',
      lastUpdated: '2026-10-27',
    },
    {
      id: 'asset-msciw-1000',
      name: 'MSCI World FAM (PAC 1000€)',
      symbol: 'MSCIW (PAC 1000)',
      type: 'etf',
      invested: 4007.8,
      currentValue: 4071.28,
      notes: 'Nuovo piano di accumulo Fineco da 1.000€/mese',
      lastUpdated: '2026-10-27',
    },
    {
      id: 'asset-etf-difesa',
      name: 'ETF Difesa & Sicurezza',
      symbol: 'ETF DIFESA',
      type: 'etf',
      invested: 2993.1,
      currentValue: 2880.35,
      notes: 'ETF tematico settore difesa aerospaziale',
      lastUpdated: '2026-10-27',
    },
    {
      id: 'asset-intel',
      name: 'Intel Corp',
      symbol: 'INTEL',
      type: 'azioni',
      invested: 4011.93,
      currentValue: 9778.8,
      notes: 'Azioni Intel (NASDAQ: INTC)',
      lastUpdated: '2026-10-27',
    },
    {
      id: 'asset-enel',
      name: 'Enel S.p.A.',
      symbol: 'ENEL',
      type: 'azioni',
      invested: 2000.97,
      currentValue: 3242.66,
      notes: 'Azioni Enel con dividendi a gennaio e luglio',
      lastUpdated: '2026-10-27',
    },
    {
      id: 'asset-stellantis',
      name: 'Stellantis N.V.',
      symbol: 'STELLANTIS',
      type: 'azioni',
      invested: 4010.57,
      currentValue: 1539.44,
      notes: 'Azioni Stellantis',
      lastUpdated: '2026-10-27',
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
