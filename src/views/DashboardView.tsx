import type { ChangeEvent, SyntheticEvent } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { Icons } from '../components/ui/Icons';
import WaveChart from '../components/ui/WaveChart';
import DistributionChart from '../components/ui/DistributionChart';
import type { FilterType, Transaction, ChartSummaryData, TransactionFormData } from '../types';


interface DashboardViewProps {
  filterType: FilterType;
  setFilterType: (val: FilterType) => void;
  openGoalModal: () => void;
  isLoadingChart: boolean;
  summary: { pemasukan: number; pengeluaran: number; selisih: number };
  chartData: ChartSummaryData[];
  distributionData: { name: string; value: number }[];
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  formData: TransactionFormData;
  setFormData: React.Dispatch<React.SetStateAction<TransactionFormData>>;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleFormSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
  submitTransaction: UseMutationResult<Transaction, Error, { id: number | null; data: Omit<Transaction, 'id'> }>;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isLoadingTransactions: boolean;
  filteredTransactions: Transaction[];
  startEdit: (trx: Transaction) => void;
  handleDelete: (id: number) => void;
  formatRupiah: (num: number) => string;
}

export default function DashboardView(props: DashboardViewProps) {
  const { filterType, setFilterType, openGoalModal, isLoadingChart, summary, chartData, distributionData, editingId, setEditingId, formData, setFormData, handleInputChange, handleFormSubmit, submitTransaction, searchQuery, setSearchQuery, isLoadingTransactions, filteredTransactions, startEdit, handleDelete, formatRupiah } = props;

  return (
    <>
      {/* KONTROL ATAS */}
      <div className="flex items-center justify-between pb-2 gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['harian', 'bulanan', 'tahunan'] as FilterType[]).map((type) => (
            <button key={type} onClick={() => setFilterType(type)} className={`px-5 py-2 text-sm font-semibold rounded-full capitalize transition-all ${filterType === type ? 'bg-accent text-white shadow-md' : 'bg-surface border border-border text-muted hover:text-primary'}`}>{type}</button>
          ))}
        </div>
        <button onClick={() => openGoalModal()} className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg shadow-md hover:opacity-90 flex items-center gap-2 shrink-0">
          <Icons.Plus /> <span className="hidden sm:inline">Tambah Target</span>
        </button>
      </div>

      {/* KARTU RINGKASAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-muted">Total Pemasukan</p><div className="p-1.5 bg-accent/10 text-accent rounded-lg"><Icons.ArrowDownLeft /></div></div>
          <p className="text-3xl font-bold text-primary">{isLoadingChart ? '...' : formatRupiah(summary.pemasukan)}</p>
        </div>
        <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4"><p className="text-sm font-medium text-muted">Total Pengeluaran</p><div className="p-1.5 bg-danger/10 text-danger rounded-lg"><Icons.ArrowUpRight /></div></div>
          <p className="text-3xl font-bold text-primary">{isLoadingChart ? '...' : formatRupiah(summary.pengeluaran)}</p>
        </div>
        <div className="bg-brand text-white border border-brand rounded-[20px] p-6 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80">Total Savings (Neto)</p>
            <p className="text-3xl font-bold mt-3">{isLoadingChart ? '...' : formatRupiah(summary.selisih)}</p>
            <p className="text-xs text-white/60 mt-2 mb-4">Status keuangan saat ini</p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/30 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* CHART GELOMBANG & FORM TRANSAKSI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-surface border border-border rounded-[20px] p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-primary">Analisis</h3></div>
          <div className="flex-1 w-full min-h-62.5"><WaveChart data={chartData} loading={isLoadingChart} filterType={filterType} /></div>
        </div>

        <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-primary mb-6">{editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-background p-1.5 rounded-xl border border-border">
              <button type="button" onClick={() => setFormData({ ...formData, type: 'pemasukan', category: '' })} className={`py-2 text-sm font-semibold rounded-lg ${formData.type === 'pemasukan' ? 'bg-surface text-accent shadow-sm' : 'text-muted'}`}>Masuk</button>
              <button type="button" onClick={() => setFormData({ ...formData, type: 'pengeluaran', category: '' })} className={`py-2 text-sm font-semibold rounded-lg ${formData.type === 'pengeluaran' ? 'bg-surface text-danger shadow-sm' : 'text-muted'}`}>Keluar</button>
            </div>
            <div><input type="number" name="amount" placeholder="Jumlah Uang" value={formData.amount} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:border-accent outline-none" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none appearance-none" required>
                <option value="" disabled>Kategori...</option>
                {formData.type === 'pemasukan' ? (
                  <><option value="Gaji">Gaji</option><option value="Freelance">Freelance</option><option value="Lainnya">Lainnya</option></>
                ) : (
                  <><option value="Makanan">Makanan</option><option value="Transportasi">Transport</option><option value="Lainnya">Lainnya</option></>
                )}
              </select>
              <input type="date" name="transaction_date" value={formData.transaction_date} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none" required />
            </div>
            
            <div>
              <input type="text" name="description" placeholder="Keterangan..." value={formData.description} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:border-accent outline-none" required={formData.category === 'Lainnya'} />
              {formData.category === 'Lainnya' && !formData.description.trim() && (
                <p className="text-[11px] text-danger mt-1.5 ml-1 font-medium animate-in slide-in-from-top-1">* Silakan sebutkan rincian untuk kategori Lainnya</p>
              )}
            </div>
            
            <div className="flex gap-2">
              {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] }); }} className="flex-1 py-2.5 bg-background border border-border text-muted rounded-lg text-sm font-semibold">Batal</button>}
              <button type="submit" disabled={submitTransaction.isPending} className="flex-1 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold shadow-md">{submitTransaction.isPending ? 'Loading...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* TABEL TRANSAKSI & DISTRIBUSI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-surface border border-border rounded-[20px] p-6 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">Aktivitas Terkini</h3>
            <div className="flex items-center bg-background border border-border rounded-lg px-3 py-1.5 w-48">
              <span className="text-muted mr-2"><Icons.Search /></span>
              <input type="text" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent outline-none text-xs w-full text-primary" />
            </div>
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className="pb-3 font-medium w-32">Kategori</th>
                  <th className="pb-3 font-medium">Keterangan</th>
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 font-medium text-right">Jumlah</th>
                  <th className="pb-3 font-medium text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingTransactions ? (
                  <tr><td colSpan={5} className="py-6 text-center text-muted font-medium">Memuat data...</td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-muted">Data tidak ditemukan.</td></tr>
                ) : filteredTransactions.slice(0, 15).map((trx) => (
                  <tr key={trx.id} className="group hover:bg-background/50 transition">
                    <td className="py-4 font-semibold text-primary">{trx.category}</td>
                    <td className="py-4 text-muted truncate max-w-37.5">{trx.description || '-'}</td>
                    <td className="py-4 text-muted">{new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className={`py-4 font-bold text-right ${trx.type === 'pemasukan' ? 'text-accent' : 'text-danger'}`}>
                      {trx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.amount)}
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(trx)} className="text-muted hover:text-primary transition font-medium">Edit</button>
                        <button onClick={() => handleDelete(trx.id)} className="text-danger hover:opacity-80 transition font-medium">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tampilan Mobile */}
          <div className="lg:hidden flex flex-col gap-3">
            {isLoadingTransactions ? (
              <div className="py-6 text-center text-muted text-sm">Memuat data...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-6 text-center text-muted text-sm">Data tidak ditemukan.</div>
            ) : filteredTransactions.slice(0, 15).map((trx) => (
              <div key={trx.id} className="bg-background border border-border p-4 rounded-xl flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <p className="font-bold text-sm text-primary">{trx.category === 'Lainnya' ? (trx.description || 'Lainnya') : trx.category}</p>
                    <p className="text-[10px] text-muted">{new Date(trx.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <p className="text-xs text-muted wrap-break-word leading-relaxed">
                    {trx.category === 'Lainnya' ? <span className="text-accent">Kategori: Lainnya</span> : (trx.description || '-')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className={`font-bold text-sm ${trx.type === 'pemasukan' ? 'text-accent' : 'text-danger'}`}>
                    {trx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.amount)}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(trx)} className="text-[10px] text-muted hover:text-primary underline">Edit</button>
                    <button onClick={() => handleDelete(trx.id)} className="text-[10px] text-danger hover:opacity-80 underline">Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-surface border border-border rounded-[20px] p-6 shadow-sm">
          <DistributionChart data={distributionData} />
        </div>
      </div>
    </>
  );
}