export interface User {
  id: string;
  email: string;
  role: 'admin' | 'vendor';
  name: string;
}

export interface Transaction {
  id: string;
  date: string;
  voucherCode: string;
  customerName: string;
  amount: number;
  status: 'Redeemed' | 'Pending';
}

export interface DashboardStats {
  totalVouchersSold: number;
  totalEarnings: number;
  pendingBalance: number;
  totalRedemptions: number;
}