export type FilterType = 'harian' | 'bulanan' | 'tahunan';
export type MenuType = 'dashboard' | 'goals' | 'wallet' | 'settings';
export interface Transaction { id: number; type: 'pemasukan' | 'pengeluaran'; amount: number; category: string; description: string; transaction_date: string; }
export interface Goal { id: number; name: string; target_amount: number; saved_amount: number; deadline: string; icon: string; status: 'Active' | 'Completed'; }
export interface ChartSummaryData { date: string; pemasukan: number; pengeluaran: number; selisih: number; }
export interface TransactionFormData { type: 'pemasukan' | 'pengeluaran'; amount: string; category: string; description: string; transaction_date: string; }
export interface GoalFormData { id: number | null; name: string; target_amount: string; saved_amount: number; deadline: string; icon: string; status: 'Active' | 'Completed'; }
export interface UserProfile { name: string; email: string; avatar: string | null; }
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}