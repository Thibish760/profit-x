import AsyncStorage from '@react-native-async-storage/async-storage';

export type IncomeRow = {
  id: string;
  date: string;
  cash: string;
  gpay: string;
  malliKadai: string;
  market: string;
};

export type AdditionalRow = {
  id: string;
  date: string;
  egg: string;
  piece: string;
  potato: string;
  gas: string;
  fuel: string;
};

export type FinanceSnapshot = {
  incomeRows: IncomeRow[];
  addRows: AdditionalRow[];
};

export const FINANCE_STORAGE_KEY = 'profitx_finance_snapshot_v1';

export async function saveFinanceSnapshot(snapshot: FinanceSnapshot): Promise<void> {
  await AsyncStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(snapshot));
}

export async function loadFinanceSnapshot(): Promise<FinanceSnapshot> {
  const raw = await AsyncStorage.getItem(FINANCE_STORAGE_KEY);
  if (!raw) {
    return { incomeRows: [], addRows: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FinanceSnapshot>;
    const normalizedAddRows = Array.isArray(parsed.addRows)
      ? parsed.addRows.map((row) => ({
          ...row,
          piece: typeof row?.piece === 'string' ? row.piece : '0',
        }))
      : [];

    return {
      incomeRows: Array.isArray(parsed.incomeRows) ? parsed.incomeRows : [],
      addRows: normalizedAddRows,
    };
  } catch {
    return { incomeRows: [], addRows: [] };
  }
}
