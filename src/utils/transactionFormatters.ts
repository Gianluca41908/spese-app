/**
 * Utility per rendere parlanti le descrizioni generiche dei movimenti bancari (Fineco),
 * estraendo merchant, causale e dettagli dai campi 'description' e 'notes'.
 */

function cleanSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export function getSmartTitle(description: string, notes?: string): string {
  if (!notes || !notes.trim()) {
    return description;
  }

  const n = notes.trim();
  const d = description.trim();

  // 1. Prelievi Bancomat
  if (/prelievo|prelevamento/i.test(d) || /prelevamento/i.test(n)) {
    if (/unicredit/i.test(n)) return 'Prelievo Bancomat Unicredit';
    return 'Prelievo Bancomat';
  }

  // 2. Bollettini CBill & PagoPA
  if (/bollettino CBill/i.test(n) || /CBILL/i.test(d)) {
    const cbMatch = n.match(/CBill:\s*(?:[A-Z0-9]+-)?([^\n\r]+)/i);
    const ente = cbMatch
      ? cbMatch[1].replace(/COMU\s*NE/i, 'Comune').replace(/DI\s+BARI/i, 'di Bari').trim()
      : 'PagoPA';
    if (/commiss/i.test(d) || /commiss/i.test(n)) {
      return `Comm. Bollettino ${ente}`;
    }
    return `Bollettino ${ente}`;
  }

  // 3. Modello F24
  if (/f24/i.test(d) || /f24/i.test(n)) {
    return 'Pagamento F24';
  }

  // 4. Bancomat / POS / Carte di debito: pattern 'presso: [ESERCENTE] [INDIRIZZO]'
  const pressoMatch = n.match(
    /presso:\s*([^,\n]+?)(?:\s+(?:VIA|VIALE|CORSO|PIAZZA|PIAZZALE|STRADA|CARTA\s+N|NESSUNA|NUM\.|BA\s*RI\b)\b|$)/i
  );
  if (pressoMatch && pressoMatch[1]) {
    const raw = cleanSpaces(pressoMatch[1]);
    if (/iper\s*(?:bari\s*)?pasteur|9086\s*bari\s*pasteur/i.test(raw)) return 'Spesa Ipercoop Pasteur';
    if (/ipercoop|coop\s+superstore/i.test(raw)) return 'Spesa Ipercoop';
    if (/zara/i.test(raw)) return 'Spesa Zara';
    if (/fami\s*la/i.test(raw)) return 'Spesa Famila';
    if (/rossotono/i.test(raw)) return 'Spesa Rossotono';
    if (/carrefour/i.test(raw)) return 'Spesa Carrefour';
    if (/partipilo/i.test(raw)) return 'Studio Dentistico Partipilo';
    if (/zodiaco/i.test(raw)) return 'Ristorante Lo Zodiaco';
    if (/tecnedil/i.test(raw)) return 'Auto Tecnedil';
    if (/pino\s+ladisa/i.test(raw)) return 'Pasticceria Pino Ladisa';
    if (/oliver\s+jeans|fortyfive/i.test(raw)) return 'Oliver Jeans';
    if (/pneumatici|di\s+gioia/i.test(raw)) return 'Di Gioia Pneumatici';
    if (/euro\s*gomme/i.test(raw)) return 'Eurogomme Santoro';
    if (/leroy\s+merlin/i.test(raw)) return 'Leroy Merlin';
    if (/unieuro/i.test(raw)) return 'Unieuro';
    if (/siem|euronics/i.test(raw)) return 'Siem Euronics';
    if (/bassetti/i.test(raw)) return 'Bassetti Italia';
    if (/lube\s+store/i.test(raw)) return 'Cucine Lube Store';
    if (/pv\s+ip\b/i.test(raw)) return 'Rifornimento IP';
    if (/marchegiani/i.test(raw)) return 'Ottica Marchegiani';
    if (/sicolo/i.test(raw)) return 'Vincenzo Sicolo Arredamenti';
    if (/hfb/i.test(raw)) return 'Bari HFB';
    if (/gas\s+e\s+bari/i.test(raw)) return 'Gas e Luce Bari';
    return raw;
  }

  // Visa Debit direct merchant check
  if (/visa/i.test(d)) {
    if (/iper\s*(?:bari\s*)?pasteur/i.test(n)) return 'Spesa Ipercoop Pasteur';
    if (/ipercoop/i.test(n)) return 'Spesa Ipercoop';
  }

  // 5. SDD / Domiciliazioni Bancarie
  if (/telecomitalia/i.test(n) || /tim\s*s\.?p\.?a/i.test(n)) return 'TIM Telefono / Fibra';
  if (/nexta\s*energia/i.test(n)) return 'Nexta Luce & Gas';
  if (/unipol\s*assicurazioni/i.test(n)) return 'Unipol Assicurazioni';

  // 6. Bonifici SEPA & Bonifici Istantanei
  if (/bonifico/i.test(d)) {
    // INPS (Stipendio / NASpI / Trattamento integrativo)
    if (/Ord:\s*INPS/i.test(n)) {
      if (/NASPI/i.test(n)) return 'Indennità NASpI INPS';
      if (/TRATTAMENTO\s+INTEGRATIVO/i.test(n)) return 'Trattamento Integrativo INPS';
      return 'Bonifico INPS';
    }

    // Stipendi da datore di lavoro (es. TEMPO SRL)
    const ordMatch = n.match(/Ord:\s*([^\n;]+?)(?:\s+Ben:|\s+Dt-ord:|$)/i);
    if (ordMatch && ordMatch[1]) {
      const ord = cleanSpaces(ordMatch[1]);
      if (/stipend/i.test(n)) return `Stipendio ${ord}`;
      return `Bonifico da ${ord}`;
    }

    // Ricarica Genius Card
    if (/ricarica genius/i.test(n)) {
      return 'Ricarica Genius Card';
    }

    // Condominio The Bridge
    if (/condominio the bridge/i.test(n)) {
      return 'Condominio The Bridge';
    }

    // Beneficiario e Causale
    const benMatch = n.match(/(?:Beneficiario|Ben):\s*([^\n;]+?)(?:\s+IBAN:|\s+Ins:|\s+Dt-|\s+Da:|$)/i);
    const cauMatch = n.match(/(?:Causale|Cau):\s*([^\n;]+?)(?:\s+TRN:|\s+TransID:|$)/i);

    if (benMatch && benMatch[1]) {
      const ben = cleanSpaces(benMatch[1]);
      if (/unipol/i.test(ben)) return 'Unipol Assicurazioni (Polizza Auto)';
      if (cauMatch && cauMatch[1]) {
        let cau = cleanSpaces(cauMatch[1].replace(/List\s*a\s*/i, 'Lista '));
        if (/netflix/i.test(cau)) return `${ben} (Quota Netflix)`;
        if (/regalo/i.test(cau)) return `${ben} (${cau})`;
        if (/lista/i.test(cau)) return `Regalo ${cau}`;
        if (cau.length < 32 && !cau.toUpperCase().includes('TRN')) {
          return `${ben} (${cau})`;
        }
      }
      return `Bonifico a ${ben}`;
    }
  }

  // 7. Investimenti (BOT / PAC / Titoli)
  if (/BOT-\w+/i.test(n) || /rimborso titoli/i.test(d)) {
    const botMatch = n.match(/BOT-([A-Z0-9]+)/i);
    return botMatch ? `Rimborso ${botMatch[0]}` : 'Rimborso BOT Titoli';
  }

  return d;
}
