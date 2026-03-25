import { Pool, QueryResultRow } from 'pg';
import { config } from '../config';
import { AppData, FinanceSnapshot, PaymentRecord, User } from '../types';

const defaultData: AppData = {
  users: [
    {
      id: 'u-admin',
      email: 'admin@profitx.local',
      password: 'admin123',
      role: 'admin',
    },
  ],
  settings: {
    shopName: 'Your Shop Name',
    ownerName: 'Chief',
  },
  finance: {
    vendors: [],
  },
  saving: {
    cards: [],
  },
};

if (!config.databaseUrl) {
  throw new Error('Missing DATABASE_URL environment variable');
}

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
});

let isInitialized = false;

type UserRow = QueryResultRow & {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
};

type SettingsRow = QueryResultRow & {
  shop_name: string;
  owner_name: string;
};

type VendorRow = QueryResultRow & {
  id: string;
  user_id: string;
  name: string;
  loan_date: string;
  loan_amount: number | string;
};

type PaymentRow = QueryResultRow & {
  vendor_id: string;
  amount: number | string;
  month: string;
  year: string;
  paid_on: string;
  timestamp: number | string;
};

type CardRow = QueryResultRow & {
  id: string;
  user_id: string;
  name: string;
  started_on: string;
  initial_amount: number | string;
};

type VendorPatchInput = {
  name?: string;
  loanDate?: string;
  loanAmount?: number;
};

type CardPatchInput = {
  name?: string;
  startedOn?: string;
  initialAmount?: number;
};

type DepositRow = QueryResultRow & {
  card_id: string;
  amount: number | string;
  month: string;
  year: string;
  paid_on: string;
  timestamp: number | string;
};

type FinanceSnapshotRow = QueryResultRow & {
  income_rows: unknown;
  add_rows: unknown;
};

const EMPTY_FINANCE_SNAPSHOT: FinanceSnapshot = {
  incomeRows: [],
  addRows: [],
};

function normalizeFinanceSnapshot(value: unknown): FinanceSnapshot {
  if (!value || typeof value !== 'object') return EMPTY_FINANCE_SNAPSHOT;

  const parsed = value as Partial<FinanceSnapshot>;
  const incomeRows = Array.isArray(parsed.incomeRows) ? parsed.incomeRows : [];
  const addRows = Array.isArray(parsed.addRows) ? parsed.addRows : [];

  return {
    incomeRows: incomeRows
      .filter((row): row is FinanceSnapshot['incomeRows'][number] => !!row && typeof row === 'object')
      .map((row) => ({
        id: String((row as { id?: unknown }).id ?? ''),
        date: String((row as { date?: unknown }).date ?? ''),
        cash: String((row as { cash?: unknown }).cash ?? ''),
        gpay: String((row as { gpay?: unknown }).gpay ?? ''),
        malliKadai: String((row as { malliKadai?: unknown }).malliKadai ?? ''),
        market: String((row as { market?: unknown }).market ?? ''),
      })),
    addRows: addRows
      .filter((row): row is FinanceSnapshot['addRows'][number] => !!row && typeof row === 'object')
      .map((row) => ({
        id: String((row as { id?: unknown }).id ?? ''),
        date: String((row as { date?: unknown }).date ?? ''),
        egg: String((row as { egg?: unknown }).egg ?? ''),
        piece: String((row as { piece?: unknown }).piece ?? '0'),
        potato: String((row as { potato?: unknown }).potato ?? ''),
        gas: String((row as { gas?: unknown }).gas ?? ''),
        fuel: String((row as { fuel?: unknown }).fuel ?? ''),
      })),
  };
}

async function initializeData(): Promise<void> {
  if (isInitialized) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      shop_name TEXT NOT NULL,
      owner_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS finance_vendors (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      loan_date TEXT NOT NULL,
      loan_amount NUMERIC NOT NULL
    );

    CREATE TABLE IF NOT EXISTS finance_payments (
      id BIGSERIAL PRIMARY KEY,
      vendor_id TEXT NOT NULL REFERENCES finance_vendors(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      month TEXT NOT NULL,
      year TEXT NOT NULL,
      paid_on TEXT NOT NULL,
      timestamp BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saving_cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      started_on TEXT NOT NULL,
      initial_amount NUMERIC NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saving_deposits (
      id BIGSERIAL PRIMARY KEY,
      card_id TEXT NOT NULL REFERENCES saving_cards(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      month TEXT NOT NULL,
      year TEXT NOT NULL,
      paid_on TEXT NOT NULL,
      timestamp BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS finance_snapshots (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      income_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
      add_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at BIGINT NOT NULL
    );

    ALTER TABLE finance_vendors ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE saving_cards ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  `);

  const usersCountResult = await pool.query<{ c: string }>('SELECT COUNT(*)::text as c FROM users');
  const usersCount = Number(usersCountResult.rows[0]?.c ?? 0);
  if (usersCount === 0) {
    const seedUser = defaultData.users[0];
    await pool.query(
      'INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)',
      [seedUser.id, seedUser.email, seedUser.password, seedUser.role],
    );
  }

  await pool.query(
    `INSERT INTO settings (id, shop_name, owner_name)
     VALUES (1, $1, $2)
     ON CONFLICT (id) DO UPDATE
     SET shop_name = EXCLUDED.shop_name,
         owner_name = EXCLUDED.owner_name`,
    [defaultData.settings.shopName, defaultData.settings.ownerName],
  );

  isInitialized = true;
}

function toPaymentRecord(row: PaymentRow | DepositRow): PaymentRecord {
  return {
    amount: Number(row.amount),
    month: row.month,
    year: row.year,
    paidOn: row.paid_on,
    timestamp: Number(row.timestamp),
  };
}

export async function readData(): Promise<AppData> {
  await initializeData();

  const [usersResult, settingsResult, vendorsResult, paymentsResult, cardsResult, depositsResult] = await Promise.all([
    pool.query<UserRow>('SELECT id, email, password, role FROM users'),
    pool.query<SettingsRow>('SELECT shop_name, owner_name FROM settings WHERE id = 1 LIMIT 1'),
    pool.query<VendorRow>('SELECT id, user_id, name, loan_date, loan_amount FROM finance_vendors'),
    pool.query<PaymentRow>(
      'SELECT vendor_id, amount, month, year, paid_on, timestamp FROM finance_payments ORDER BY timestamp ASC',
    ),
    pool.query<CardRow>('SELECT id, user_id, name, started_on, initial_amount FROM saving_cards'),
    pool.query<DepositRow>(
      'SELECT card_id, amount, month, year, paid_on, timestamp FROM saving_deposits ORDER BY timestamp ASC',
    ),
  ]);

  const users: User[] = usersResult.rows.map((row) => ({
    id: row.id,
    email: row.email,
    password: row.password,
    role: row.role,
  }));

  const paymentMap = new Map<string, PaymentRecord[]>();
  paymentsResult.rows.forEach((row) => {
    const items = paymentMap.get(row.vendor_id) ?? [];
    items.push(toPaymentRecord(row));
    paymentMap.set(row.vendor_id, items);
  });

  const depositMap = new Map<string, PaymentRecord[]>();
  depositsResult.rows.forEach((row) => {
    const items = depositMap.get(row.card_id) ?? [];
    items.push(toPaymentRecord(row));
    depositMap.set(row.card_id, items);
  });

  const settingsRow = settingsResult.rows[0];

  return {
    users,
    settings: {
      shopName: settingsRow?.shop_name ?? defaultData.settings.shopName,
      ownerName: settingsRow?.owner_name ?? defaultData.settings.ownerName,
    },
    finance: {
      vendors: vendorsResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        loanDate: row.loan_date,
        loanAmount: Number(row.loan_amount),
        payments: paymentMap.get(row.id) ?? [],
      })),
    },
    saving: {
      cards: cardsResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        startedOn: row.started_on,
        initialAmount: Number(row.initial_amount),
        deposits: depositMap.get(row.id) ?? [],
      })),
    },
  };
}

export async function writeData(next: AppData): Promise<void> {
  await initializeData();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM finance_payments');
    await client.query('DELETE FROM finance_vendors');
    await client.query('DELETE FROM saving_deposits');
    await client.query('DELETE FROM saving_cards');
    await client.query('DELETE FROM users');

    for (const user of next.users) {
      await client.query('INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)', [
        user.id,
        user.email,
        user.password,
        user.role,
      ]);
    }

    await client.query(
      `INSERT INTO settings (id, shop_name, owner_name)
       VALUES (1, $1, $2)
       ON CONFLICT (id) DO UPDATE
       SET shop_name = EXCLUDED.shop_name,
           owner_name = EXCLUDED.owner_name`,
      [next.settings.shopName, next.settings.ownerName],
    );

    for (const vendor of next.finance.vendors) {
      await client.query(
        'INSERT INTO finance_vendors (id, name, loan_date, loan_amount) VALUES ($1, $2, $3, $4)',
        [vendor.id, vendor.name, vendor.loanDate, vendor.loanAmount],
      );

      for (const payment of vendor.payments) {
        await client.query(
          'INSERT INTO finance_payments (vendor_id, amount, month, year, paid_on, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
          [vendor.id, payment.amount, payment.month, payment.year, payment.paidOn, payment.timestamp],
        );
      }
    }

    for (const card of next.saving.cards) {
      await client.query(
        'INSERT INTO saving_cards (id, name, started_on, initial_amount) VALUES ($1, $2, $3, $4)',
        [card.id, card.name, card.startedOn, card.initialAmount],
      );

      for (const deposit of card.deposits) {
        await client.query(
          'INSERT INTO saving_deposits (card_id, amount, month, year, paid_on, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
          [card.id, deposit.amount, deposit.month, deposit.year, deposit.paidOn, deposit.timestamp],
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function createUser(user: User): Promise<boolean> {
  await initializeData();

  const result = await pool.query<{ id: string }>(
    `INSERT INTO users (id, email, password, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [user.id, user.email, user.password, user.role],
  );

  return result.rowCount === 1;
}

export async function findUserByCredentials(email: string, password: string): Promise<User | null> {
  await initializeData();

  const result = await pool.query<UserRow>(
    'SELECT id, email, password, role FROM users WHERE LOWER(email) = LOWER($1) AND password = $2 LIMIT 1',
    [email, password],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    password: row.password,
    role: row.role,
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  await initializeData();

  const result = await pool.query<UserRow>(
    'SELECT id, email, password, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    password: row.password,
    role: row.role,
  };
}

export async function createFinanceVendor(input: {
  userId: string;
  id: string;
  name: string;
  loanDate: string;
  loanAmount: number;
}): Promise<void> {
  await initializeData();

  await pool.query(
    'INSERT INTO finance_vendors (id, user_id, name, loan_date, loan_amount) VALUES ($1, $2, $3, $4, $5)',
    [input.id, input.userId, input.name, input.loanDate, input.loanAmount],
  );
}

export async function createSavingCard(input: {
  userId: string;
  id: string;
  name: string;
  startedOn: string;
  initialAmount: number;
}): Promise<void> {
  await initializeData();

  await pool.query(
    'INSERT INTO saving_cards (id, user_id, name, started_on, initial_amount) VALUES ($1, $2, $3, $4, $5)',
    [input.id, input.userId, input.name, input.startedOn, input.initialAmount],
  );
}

export async function listFinanceVendorsByUser(userId: string) {
  await initializeData();

  const [vendorsResult, paymentsResult] = await Promise.all([
    pool.query<VendorRow>(
      'SELECT id, user_id, name, loan_date, loan_amount FROM finance_vendors WHERE user_id = $1 ORDER BY id ASC',
      [userId],
    ),
    pool.query<PaymentRow>(
      `SELECT p.vendor_id, p.amount, p.month, p.year, p.paid_on, p.timestamp
       FROM finance_payments p
       INNER JOIN finance_vendors v ON v.id = p.vendor_id
       WHERE v.user_id = $1
       ORDER BY p.timestamp ASC`,
      [userId],
    ),
  ]);

  const paymentMap = new Map<string, PaymentRecord[]>();
  paymentsResult.rows.forEach((row) => {
    const items = paymentMap.get(row.vendor_id) ?? [];
    items.push(toPaymentRecord(row));
    paymentMap.set(row.vendor_id, items);
  });

  return vendorsResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    loanDate: row.loan_date,
    loanAmount: Number(row.loan_amount),
    payments: paymentMap.get(row.id) ?? [],
  }));
}

export async function patchFinanceVendorByUser(userId: string, vendorId: string, patch: VendorPatchInput) {
  await initializeData();

  const updates: string[] = [];
  const values: Array<string | number> = [];

  if (patch.name !== undefined) {
    updates.push(`name = $${values.length + 1}`);
    values.push(patch.name);
  }
  if (patch.loanDate !== undefined) {
    updates.push(`loan_date = $${values.length + 1}`);
    values.push(patch.loanDate);
  }
  if (patch.loanAmount !== undefined) {
    updates.push(`loan_amount = $${values.length + 1}`);
    values.push(patch.loanAmount);
  }

  if (updates.length > 0) {
    values.push(vendorId, userId);
    await pool.query(
      `UPDATE finance_vendors SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND user_id = $${values.length}`,
      values,
    );
  }

  const vendors = await listFinanceVendorsByUser(userId);
  return vendors.find((vendor) => vendor.id === vendorId) ?? null;
}

export async function addFinancePaymentByUser(
  userId: string,
  vendorId: string,
  payment: { amount: number; month: string; year: string; paidOn: string; timestamp: number },
) {
  await initializeData();

  const vendorResult = await pool.query<{ id: string }>(
    'SELECT id FROM finance_vendors WHERE id = $1 AND user_id = $2 LIMIT 1',
    [vendorId, userId],
  );
  if (vendorResult.rowCount !== 1) {
    return null;
  }

  await pool.query(
    'INSERT INTO finance_payments (vendor_id, amount, month, year, paid_on, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
    [vendorId, payment.amount, payment.month, payment.year, payment.paidOn, payment.timestamp],
  );

  return payment;
}

export async function listSavingCardsByUser(userId: string) {
  await initializeData();

  const [cardsResult, depositsResult] = await Promise.all([
    pool.query<CardRow>(
      'SELECT id, user_id, name, started_on, initial_amount FROM saving_cards WHERE user_id = $1 ORDER BY id ASC',
      [userId],
    ),
    pool.query<DepositRow>(
      `SELECT d.card_id, d.amount, d.month, d.year, d.paid_on, d.timestamp
       FROM saving_deposits d
       INNER JOIN saving_cards c ON c.id = d.card_id
       WHERE c.user_id = $1
       ORDER BY d.timestamp ASC`,
      [userId],
    ),
  ]);

  const depositMap = new Map<string, PaymentRecord[]>();
  depositsResult.rows.forEach((row) => {
    const items = depositMap.get(row.card_id) ?? [];
    items.push(toPaymentRecord(row));
    depositMap.set(row.card_id, items);
  });

  return cardsResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    startedOn: row.started_on,
    initialAmount: Number(row.initial_amount),
    deposits: depositMap.get(row.id) ?? [],
  }));
}

export async function patchSavingCardByUser(userId: string, cardId: string, patch: CardPatchInput) {
  await initializeData();

  const updates: string[] = [];
  const values: Array<string | number> = [];

  if (patch.name !== undefined) {
    updates.push(`name = $${values.length + 1}`);
    values.push(patch.name);
  }
  if (patch.startedOn !== undefined) {
    updates.push(`started_on = $${values.length + 1}`);
    values.push(patch.startedOn);
  }
  if (patch.initialAmount !== undefined) {
    updates.push(`initial_amount = $${values.length + 1}`);
    values.push(patch.initialAmount);
  }

  if (updates.length > 0) {
    values.push(cardId, userId);
    await pool.query(
      `UPDATE saving_cards SET ${updates.join(', ')} WHERE id = $${values.length - 1} AND user_id = $${values.length}`,
      values,
    );
  }

  const cards = await listSavingCardsByUser(userId);
  return cards.find((card) => card.id === cardId) ?? null;
}

export async function addSavingDepositByUser(
  userId: string,
  cardId: string,
  deposit: { amount: number; month: string; year: string; paidOn: string; timestamp: number },
) {
  await initializeData();

  const cardResult = await pool.query<{ id: string }>(
    'SELECT id FROM saving_cards WHERE id = $1 AND user_id = $2 LIMIT 1',
    [cardId, userId],
  );
  if (cardResult.rowCount !== 1) {
    return null;
  }

  await pool.query(
    'INSERT INTO saving_deposits (card_id, amount, month, year, paid_on, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
    [cardId, deposit.amount, deposit.month, deposit.year, deposit.paidOn, deposit.timestamp],
  );

  return deposit;
}

export async function getFinanceSnapshotByUser(userId: string): Promise<FinanceSnapshot> {
  await initializeData();

  const result = await pool.query<FinanceSnapshotRow>(
    'SELECT income_rows, add_rows FROM finance_snapshots WHERE user_id = $1 LIMIT 1',
    [userId],
  );

  const row = result.rows[0];
  if (!row) return EMPTY_FINANCE_SNAPSHOT;

  return normalizeFinanceSnapshot({
    incomeRows: row.income_rows,
    addRows: row.add_rows,
  });
}

export async function saveFinanceSnapshotByUser(userId: string, snapshot: FinanceSnapshot): Promise<void> {
  await initializeData();

  const normalized = normalizeFinanceSnapshot(snapshot);

  await pool.query(
    `INSERT INTO finance_snapshots (user_id, income_rows, add_rows, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, $4)
     ON CONFLICT (user_id)
     DO UPDATE SET
       income_rows = EXCLUDED.income_rows,
       add_rows = EXCLUDED.add_rows,
       updated_at = EXCLUDED.updated_at`,
    [userId, JSON.stringify(normalized.incomeRows), JSON.stringify(normalized.addRows), Date.now()],
  );
}
