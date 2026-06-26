import { Icons } from '../components/ui/Icons';
import type { Transaction } from '../types';

interface WalletViewProps {
  summary: { pemasukan: number; pengeluaran: number; selisih: number };
  transactions: Transaction[];
  walletMonth: string;
  setWalletMonth: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  formatRupiah: (num: number) => string;
  triggerWalletAction: (type: 'pemasukan' | 'pengeluaran') => void;
}

export default function WalletView(props: WalletViewProps) {
  const { summary, transactions, walletMonth, setWalletMonth, searchQuery, setSearchQuery, formatRupiah, triggerWalletAction } = props;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      
      {/* Kolom Kiri: Ringkasan Saldo & Aksi Cepat */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-brand text-white border border-brand rounded-[20px] p-6 shadow-xl relative overflow-hidden">
          <p className="text-sm font-medium text-white/80 flex items-center gap-2"><Icons.Wallet /> Saldo Tersedia</p>
          <p className="text-4xl font-bold mt-4">{formatRupiah(summary.selisih)}</p>
          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10">
            <span className="flex items-center gap-1.5 text-xs text-white/80"><span className="w-2 h-2 rounded-full bg-accent"></span> In: {formatRupiah(summary.pemasukan)}</span>
            <span className="flex items-center gap-1.5 text-xs text-white/80"><span className="w-2 h-2 rounded-full bg-danger"></span> Out: {formatRupiah(summary.pengeluaran)}</span>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
        </div>

        {/* Tombol Aksi Cepat */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => triggerWalletAction('pemasukan')} className="flex flex-col items-center justify-center gap-2 p-4 bg-surface border border-border rounded-[20px] hover:border-accent transition group">
            <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white"><Icons.ArrowDownLeft /></div>
            <span className="text-xs font-bold text-primary">Deposit</span>
          </button>
          <button onClick={() => triggerWalletAction('pengeluaran')} className="flex flex-col items-center justify-center gap-2 p-4 bg-surface border border-border rounded-[20px] hover:border-accent transition group">
            <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center group-hover:bg-danger group-hover:text-white"><Icons.ArrowUpRight /></div>
            <span className="text-xs font-bold text-primary">Withdraw</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 bg-surface border border-border rounded-[20px] hover:border-accent transition group">
            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand dark:text-white flex items-center justify-center group-hover:bg-brand group-hover:text-white"><Icons.Send /></div>
            <span className="text-xs font-bold text-primary">Transfer</span>
          </button>
        </div>
      </div>

      {/* Kolom Kanan: Riwayat Detail dengan Filter */}
      <div className="lg:col-span-8 bg-surface rounded-2xl p-6 border border-border flex-1 flex flex-col h-150 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-lg font-bold text-primary">Riwayat Transaksi</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <input type="month" value={walletMonth} onChange={(e) => setWalletMonth(e.target.value)} className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:border-accent outline-none text-muted" />
            <div className="relative flex-1 sm:w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icons.Search /></span>
              <input type="text" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:border-accent outline-none" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {transactions
            .filter(trx => {
              const matchSearch = trx.category.toLowerCase().includes(searchQuery.toLowerCase()) || (trx.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
              const matchMonth = walletMonth ? trx.transaction_date.startsWith(walletMonth) : true;
              return matchSearch && matchMonth;
            })
            .map(trx => (
              <div key={trx.id} className="flex justify-between items-center p-4 bg-background border border-border rounded-xl hover:border-accent transition-all group">
                <div className="flex gap-4 items-center overflow-hidden">
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${trx.type === 'pemasukan' ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                    {trx.type === 'pemasukan' ? <Icons.ArrowDownLeft /> : <Icons.ArrowUpRight />}
                  </div>
                  <div className="min-w-0 pr-4">
                    <p className="font-bold text-sm text-primary truncate">
                      {trx.category === 'Lainnya' ? (trx.description || 'Transaksi Lainnya') : trx.category}
                    </p>
                    <p className="text-xs text-muted mt-0.5 flex gap-1.5 items-center">
                      {trx.category === 'Lainnya' && <span className="text-accent font-semibold text-[9px] bg-accent/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Lainnya</span>}
                      {new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${trx.type === 'pemasukan' ? 'text-accent' : 'text-danger'}`}>{trx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.amount)}</p>
                  <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Success</p>
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}