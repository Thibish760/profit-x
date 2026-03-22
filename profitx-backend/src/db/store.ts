import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { AppData, PaymentRecord, User } from '../types';

const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.resolve(dataDir, 'app.db');
const legacyJsonPath = path.resolve(dataDir, 'app-data.json');

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

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    shop_name TEXT NOT NULL,
    owner_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS finance_vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    loan_date TEXT NOT NULL,
    loan_amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS finance_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id TEXT NOT NULL,
    amount REAL NOT NULL,
    month TEXT NOT NULL,
    year TEXT NOT NULL,
    paid_on TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY(vendor_id) REFERENCES finance_vendors(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS saving_cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    started_on TEXT NOT NULL,
    initial_amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS saving_deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT NOT NULL,
    amount REAL NOT NULL,
    month TEXT NOT NULL,
    year TEXT NOT NULL,
    paid_on TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY(card_id) REFERENCES saving_cards(id) ON DELETE CASCADE
  );
`);

const userCountRow = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c?: number } | undefined;
const userCount = Number(userCountRow?.c ?? 0);
if (userCount === 0) {
  db.prepare('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)')
    .run('u-admin', 'admin@profitx.local', 'admin123', 'admin');
}

const settingsCountRow = db.prepare('SELECT COUNT(*) as c FROM settings').get() as { c?: number } | undefined;
const settingsCount = Number(settingsCountRow?.c ?? 0);
if (settingsCount === 0) {
  db.prepare('INSERT INTO settings (id, shop_name, owner_name) VALUES (1, ?, ?)')
    .run(defaultData.settings.shopName, defaultData.settings.ownerName);
}

if (fs.existsSync(legacyJsonPath)) {
  try {
    const rawLegacy = fs.readFileSync(legacyJsonPath, 'utf-8');
    const parsedLegacy = JSON.parse(rawLegacy) as AppData;
    const financeCountRow = db.prepare('SELECT COUNT(*) as c FROM finance_vendors').get() as { c?: number } | undefined;
    const savingCountRow = db.prepare('SELECT COUNT(*) as c FROM saving_cards').get() as { c?: number } | undefined;
    const financeCount = Number(financeCountRow?.c ?? 0);
    const savingCount = Number(savingCountRow?.c ?? 0);

    if (financeCount === 0 && savingCount === 0 && Array.isArray(parsedLegacy.users)) {
      writeData(parsedLegacy);
      fs.renameSync(legacyJsonPath, `${legacyJsonPath}.migrated`);
    }
  } catch {
    // Ignore legacy migration issues; database remains source of truth.
  }
}

export function readData(): AppData {
  const users = db.prepare('SELECT id, email, password, role FROM users').all() as User[];
  const settingsRow = db.prepare('SELECT shop_name, owner_name FROM settings WHERE id = 1').get() as
    | { shop_name: string; owner_name: string }
    | undefined;

  const vendorRows = db.prepare('SELECT id, name, loan_date, loan_amount FROM finance_vendors').all() as Array<{
    id: string;
    name: string;
    loan_date: string;
    loan_amount: number;
  }>;

  const paymentRows = db.prepare(
    'SELECT vendor_id, amount, month, year, paid_on, timestamp FROM finance_payments ORDER BY timestamp ASC',
  ).all() as Array<{
    vendor_id: string;
    amount: number;
    month: string;
    year: string;
    paid_on: string;
    timestamp: number;
  }>;

  const paymentMap = new Map<string, PaymentRecord[]>();
  paymentRows.forEach((row) => {
    const items = paymentMap.get(row.vendor_id) ?? [];
    items.push({
      amount: Number(row.amount),
      month: row.month,
      year: row.year,
      paidOn: row.paid_on,
      timestamp: Number(row.timestamp),
    });
    paymentMap.set(row.vendor_id, items);
  });

  const cardRows = db.prepare('SELECT id, name, started_on, initial_amount FROM saving_cards').all() as Array<{
    id: string;
    name: string;
    started_on: string;
    initial_amount: number;
  }>;

  const depositRows = db.prepare(
    'SELECT card_id, amount, month, year, paid_on, timestamp FROM saving_deposits ORDER BY timestamp ASC',
  ).all() as Array<{
    card_id: string;
    amount: number;
    month: string;
    year: string;
    paid_on: string;
    timestamp: number;
  }>;

  const depositMap = new Map<string, PaymentRecord[]>();
  depositRows.forEach((row) => {
    const items = depositMap.get(row.card_id) ?? [];
    items.push({
      amount: Number(row.amount),
      month: row.month,
      year: row.year,
      paidOn: row.paid_on,
      timestamp: Number(row.timestamp),
    });
    depositMap.set(row.card_id, items);
  });

  return {
    users,
    settings: {
      shopName: settingsRow?.shop_name ?? defaultData.settings.shopName,
      ownerName: settingsRow?.owner_name ?? defaultData.settings.ownerName,
    },
    finance: {
      vendors: vendorRows.map((row) => ({
        id: row.id,
        name: row.name,
        loanDate: row.loan_date,
        loanAmount: Number(row.loan_amount),
        payments: paymentMap.get(row.id) ?? [],
      })),
    },
    saving: {
      cards: cardRows.map((row) => ({
        id: row.id,
        name: row.name,
        startedOn: row.started_on,
        initialAmount: Number(row.initial_amount),
        deposits: depositMap.get(row.id) ?? [],
      })),
    },
  };
}

export function writeData(next: AppData): void {
  const tx = db.transaction((snapshot: AppData) => {
    db.exec('DELETE FROM finance_payments; DELETE FROM finance_vendors; DELETE FROM saving_deposits; DELETE FROM saving_cards; DELETE FROM users;');

    const insertUser = db.prepare('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)');
    snapshot.users.forEach((user) => {
      insertUser.run(user.id, user.email, user.password, user.role);
    });

    db.prepare('INSERT INTO settings (id, shop_name, owner_name) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET shop_name=excluded.shop_name, owner_name=excluded.owner_name')
      .run(snapshot.settings.shopName, snapshot.settings.ownerName);

    const insertVendor = db.prepare('INSERT INTO finance_vendors (id, name, loan_date, loan_amount) VALUES (?, ?, ?, ?)');
    const insertPayment = db.prepare(
      'INSERT INTO finance_payments (vendor_id, amount, month, year, paid_on, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    );

    snapshot.finance.vendors.forEach((vendor) => {
      insertVendor.run(vendor.id, vendor.name, vendor.loanDate, vendor.loanAmount);
      vendor.payments.forEach((payment) => {
        insertPayment.run(vendor.id, payment.amount, payment.month, payment.year, payment.paidOn, payment.timestamp);
      });
    });

    const insertCard = db.prepare('INSERT INTO saving_cards (id, name, started_on, initial_amount) VALUES (?, ?, ?, ?)');
    const insertDeposit = db.prepare(
      'INSERT INTO saving_deposits (card_id, amount, month, year, paid_on, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
    );

    snapshot.saving.cards.forEach((card) => {
      insertCard.run(card.id, card.name, card.startedOn, card.initialAmount);
      card.deposits.forEach((deposit) => {
        insertDeposit.run(card.id, deposit.amount, deposit.month, deposit.year, deposit.paidOn, deposit.timestamp);
      });
    });
  });

  tx(next);
}
