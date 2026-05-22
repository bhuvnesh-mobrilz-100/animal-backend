export interface Transaction {
  transaction_id: number;
  user_id: number;
  amount: number;
  status: string;
  payment_reference: string;
  created_at: string;
  object: any;
  user?: {
    user_id: number;
    user_name: string;
    email: string;
  };
}
