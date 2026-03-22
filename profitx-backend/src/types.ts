export type PaymentRecord = {
  amount: number;
  month: string;
  year: string;
  paidOn: string;
  timestamp: number;
};

export type FinanceVendor = {
  id: string;
  name: string;
  loanDate: string;
  loanAmount: number;
  payments: PaymentRecord[];
};

export type SavingCard = {
  id: string;
  name: string;
  startedOn: string;
  initialAmount: number;
  deposits: PaymentRecord[];
};

export type AppSettings = {
  shopName: string;
  ownerName: string;
};

export type User = {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
};

export type AppData = {
  users: User[];
  settings: AppSettings;
  finance: {
    vendors: FinanceVendor[];
  };
  saving: {
    cards: SavingCard[];
  };
};
