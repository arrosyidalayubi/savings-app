import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartSummaryData {
  date: string;
  pemasukan: number;
  pengeluaran: number;
  selisih: number;
}

interface WaveChartProps {
  data: ChartSummaryData[];
  loading: boolean;
  filterType: string;
}

export default function WaveChart({ data, loading, filterType }: WaveChartProps) {
  if (loading) {
    return <div className="w-full h-full flex items-center justify-center text-muted font-medium animate-pulse">Memuat visualisasi data...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-muted font-medium border border-dashed border-border rounded-xl">Belum ada data transaksi</div>;
  }

  // Format angka ke Rupiah untuk Tooltip saat di-hover
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  // Format sumbu Y (agar tidak terlalu panjang, misal: Rp 10.000 menjadi 10k)
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${value / 1000000}M`;
    if (value >= 1000) return `${value / 1000}k`;
    return value.toString();
  };

  // Format tanggal di Sumbu X menyesuaikan filter
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    if (filterType === 'tahunan') return date.getFullYear().toString();
    if (filterType === 'bulanan') return date.toLocaleDateString('id-ID', { month: 'short' });
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); // harian
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        {/* Definisi Warna Gradasi Halus */}
        <defs>
          <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Garis Latar Belakang (Grid) */}
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
        
        {/* Sumbu X (Tanggal) & Y (Jumlah) */}
        <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fontSize: 12, fill: '#888' }} tickLine={false} axisLine={false} dy={10} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: '#888' }} tickLine={false} axisLine={false} />
        
        {/* Kotak Informasi Saat Disentuh/Hover */}
        <Tooltip 
          formatter={(value: unknown, name: unknown) => {
            // Jika Recharts melempar array, ambil angka pertamanya. Jika bukan, ambil langsung.
            const rawValue = Array.isArray(value) ? value[0] : value;
            return [formatRupiah(Number(rawValue) || 0), String(name || '')];
          }}
          labelFormatter={(label: unknown) => `Tanggal: ${formatXAxis(String(label || ''))}`}
          contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-primary)' }}
          itemStyle={{ fontWeight: 'bold' }}
        />

        {/* 1. GELOMBANG MERAH (PENGELUARAN) */}
        <Area 
          type="monotone" 
          dataKey="pengeluaran" 
          name="Pengeluaran" 
          stroke="#ef4444" 
          strokeWidth={3} 
          fill="url(#colorKeluar)" 
          activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }} 
        />

        {/* 2. GELOMBANG HIJAU (PEMASUKAN) */}
        <Area 
          type="monotone" 
          dataKey="pemasukan" 
          name="Pemasukan" 
          stroke="#10b981" 
          strokeWidth={3} 
          fill="url(#colorMasuk)" 
          activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}