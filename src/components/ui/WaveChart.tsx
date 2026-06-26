import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartSummaryData, FilterType } from '../../types';

// 1. Pindahkan fungsi formatXAxis ke LUAR agar bisa diakses secara global
const formatXAxis = (tickItem: string, filterType: FilterType) => {
  const date = new Date(tickItem);
  if (isNaN(date.getTime())) return tickItem;

  if (filterType === 'tahunan') {
    return date.toLocaleDateString('id-ID', { month: 'short' });
  } else {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
};

// 2. Buat Interface untuk membuang 'any'
interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  filterType: FilterType; // Kita oper filterType ke sini
}

// 3. Pindahkan CustomTooltip ke LUAR komponen utama
const CustomTooltip = ({ active, payload, label, filterType }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const formattedDate = formatXAxis(label || '', filterType);
    return (
      <div className="bg-white border border-border p-4 rounded-xl shadow-xl z-50">
        <p className="font-bold text-sm text-primary mb-3">Tanggal: {formattedDate}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-bold flex justify-between gap-6" style={{ color: entry.color }}>
            <span className="capitalize">{entry.name} :</span>
            <span>
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(entry.value)}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- PROPS KOMPONEN UTAMA ---
interface WaveChartProps {
  data: ChartSummaryData[];
  loading: boolean;
  filterType: FilterType;
}

// 4. Komponen Utama WaveChart yang sekarang sudah sangat bersih
export default function WaveChart({ data, loading, filterType }: WaveChartProps) {
  if (loading) {
    return <div className="w-full h-full flex items-center justify-center text-muted font-medium animate-pulse">Memuat Analisis...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-muted font-medium">Belum ada data transaksi.</div>;
  }

  const formatRupiah = (value: number) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}k`;
    return `Rp ${value}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        
        <defs>
          <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#11caa0" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#11caa0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        
        <XAxis 
          dataKey="date" 
          tickFormatter={(tick) => formatXAxis(tick, filterType)} // Lempar filterType ke fungsi
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
          dy={10} 
        />
        
        <YAxis 
          tickFormatter={formatRupiah} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
        />
        
        {/* Kirim filterType sebagai prop ke CustomTooltip */}
        <Tooltip content={<CustomTooltip filterType={filterType} />} />
        
        <Area 
          type="monotone" 
          dataKey="pengeluaran" 
          name="Pengeluaran" 
          stroke="#ef4444" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorPengeluaran)" 
          activeDot={{ r: 6, strokeWidth: 0 }} 
        />
        
        <Area 
          type="monotone" 
          dataKey="pemasukan" 
          name="Pemasukan" 
          stroke="#11caa0" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorPemasukan)" 
          activeDot={{ r: 6, strokeWidth: 0 }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}