import { createClient } from '@supabase/supabase-js';
import { Transaction, FixedExpenseTemplate } from '../types';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://uryfwvbtqsyigsgvtfkb.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyeWZ3dmJ0cXN5aWdzZ3Z0ZmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4Mjc4MTUsImV4cCI6MjEwOTQwMzgxNX0.pMVS1tsdmRuH0PxPWoMobS6SAENoZzSyXvQbx4tSZZU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mappers
export function toDbTransaction(tx: Transaction) {
  return {
    id: tx.id,
    date: tx.date,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    category: tx.category,
    is_investment: tx.isInvestment,
    is_fixed: tx.isFixed,
    is_settled: tx.isSettled,
    notes: tx.notes || null,
  };
}

export function fromDbTransaction(row: any): Transaction {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    category: row.category,
    isInvestment: Boolean(row.is_investment),
    isFixed: Boolean(row.is_fixed),
    isSettled: Boolean(row.is_settled),
    notes: row.notes || undefined,
  };
}

export function toDbTemplate(tpl: FixedExpenseTemplate) {
  return {
    id: tpl.id,
    name: tpl.name,
    amount: tpl.amount,
    type: tpl.type,
    category: tpl.category,
    is_investment: tpl.isInvestment,
    default_day: tpl.defaultDay,
    active: tpl.active,
  };
}

export function fromDbTemplate(row: any): FixedExpenseTemplate {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    isInvestment: Boolean(row.is_investment),
    defaultDay: Number(row.default_day),
    active: Boolean(row.active),
  };
}

// Fetch all from cloud
export async function fetchTransactionsFromCloud(): Promise<Transaction[] | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Errore lettura transazioni da Supabase:', error.message);
      return null;
    }
    return (data || []).map(fromDbTransaction);
  } catch (err) {
    console.warn('Supabase offline o non raggiungibile:', err);
    return null;
  }
}

// Fetch templates from cloud
export async function fetchTemplatesFromCloud(): Promise<FixedExpenseTemplate[] | null> {
  try {
    const { data, error } = await supabase
      .from('fixed_expense_templates')
      .select('*')
      .order('default_day', { ascending: true });

    if (error) {
      console.warn('Errore lettura templates da Supabase:', error.message);
      return null;
    }
    return (data || []).map(fromDbTemplate);
  } catch (err) {
    console.warn('Supabase offline o non raggiungibile:', err);
    return null;
  }
}

// Upsert a single transaction
export async function saveTransactionToCloud(tx: Transaction): Promise<void> {
  try {
    await supabase.from('transactions').upsert(toDbTransaction(tx));
  } catch (err) {
    console.error('Errore salvataggio transazione su cloud:', err);
  }
}

// Upsert batch transactions
export async function saveTransactionsBatchToCloud(txs: Transaction[]): Promise<void> {
  if (txs.length === 0) return;
  try {
    const dbRows = txs.map(toDbTransaction);
    // Split into chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < dbRows.length; i += chunkSize) {
      const chunk = dbRows.slice(i, i + chunkSize);
      await supabase.from('transactions').upsert(chunk);
    }
  } catch (err) {
    console.error('Errore batch transazioni su cloud:', err);
  }
}

// Delete single transaction
export async function deleteTransactionFromCloud(id: string): Promise<void> {
  try {
    await supabase.from('transactions').delete().eq('id', id);
  } catch (err) {
    console.error('Errore eliminazione transazione su cloud:', err);
  }
}

// Delete multiple transactions
export async function deleteTransactionsBatchFromCloud(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    await supabase.from('transactions').delete().in('id', ids);
  } catch (err) {
    console.error('Errore eliminazione batch su cloud:', err);
  }
}

// Save templates to cloud
export async function saveTemplatesToCloud(templates: FixedExpenseTemplate[]): Promise<void> {
  try {
    const dbRows = templates.map(toDbTemplate);
    await supabase.from('fixed_expense_templates').upsert(dbRows);
  } catch (err) {
    console.error('Errore salvataggio templates su cloud:', err);
  }
}

// Realtime listener
export function subscribeToTransactions(onChange: () => void): () => void {
  const channel = supabase
    .channel('public:transactions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
      onChange();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
