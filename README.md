# Spese & Budget PWA (Fineco Edition)

Web App / PWA per il tracciamento e monitoraggio spese personali da smartphone e PC, progettata su misura sulle abitudini e colonne del file Excel `MOVIMENTI CONTO 2022 - 2026.xlsx`.

## Funzionalità Principali
- **Margine del Mese Senza Investimenti**: calcolo automatico del saldo reale sulle spese vive, scorporando acquisti di PAC/titoli e rimborsi straordinari (BOT/BTP).
- **Gestione Spese Fisse**: menu dedicato per configurare e applicare in 1 click le spese ricorrenti (TIM, Unipol, Condominio, Stage, NASpI, PAC).
- **Modifica Completa Movimenti**: ogni movimento è modificabile in ogni suo parametro (importo, data, categoria, note, flag investimento e contabilizzazione).
- **Selezione Multipla ed Eliminazione in Blocco**: selezione singola o totale per cancellare movimenti in massa.
- **Importazione ed Esportazione Excel**:
  - Esporta in `.xlsx` o copia negli appunti.
  - Carica con 1 click l'intero archivio storico 2022-2026 o importa qualsiasi file `.xlsx` scaricato da Fineco.

## Deploy su Render
1. Collega questo repository a Render.
2. Crea un **Static Site** (o usa il file `render.yaml` incluso).
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
