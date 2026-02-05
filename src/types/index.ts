export interface Trade {
  date: string;
  symbol: string;
  underlying: string;
  quantity: number;
  price: number;
  commission: number;
  type: 'CALL' | 'PUT';
  strike: number;
  expiry: string;
  action: 'BUY' | 'SELL';
  proceeds: number; // Total proceeds (positive for sell, negative for buy)
}

export interface Combo {
  id: string;
  name: string; // e.g., "SPY 500/505 Call Spread"
  strategy: string; // "Vertical Spread", "Iron Condor", "Single Option", etc.
  underlying: string;
  entryType: 'Credit' | 'Debit';
  entryAmount: number;
  creditDay: string; // Date when credit received
  debitDay: string; // Date when debit paid
  commission: number;
  netRealized: number;
  legs: Trade[];
  openDate: string;
  closeDate: string;
}

export interface Filters {
  dateFrom?: string;
  dateTo?: string;
  underlying?: string;
  strategy?: string;
  period?: string;
}

export interface ComboMetrics {
  totalProceeds: number;
  totalCommission: number;
  netRealized: number;
  entryType: 'Credit' | 'Debit';
  entryAmount: number;
}
