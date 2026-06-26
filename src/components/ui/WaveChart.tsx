import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartSummaryData, FilterType } from '../../types';

// 1. Format X-Axis
const formatXAxis = (tickItem: string, filterType: FilterType) => {
  const date = new Date(tickItem);
  if (isNaN(date.getTime())) return tickItem;

  if (filterType === 'tahunan') {
    return date.toLocaleDateString('id-ID', { month: 'short' });
  } else {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
};

// Ganti bagian generateCompleteData di WaveChart.tsx dengan kode ini:

const generateCompleteData = (apiData: ChartSummaryData[], filterType: FilterType): ChartSummaryData[] => {
  if (!apiData) return [];
  const result: ChartSummaryData[] = [];
  const today = new Date();

  // 1. Helper: Pencocokan tanggal yang kebal terhadap perbedaan format jam/zona waktu API
  const isSameDay = (apiDateStr: string, targetDate: Date) => {
    const d = new Date(apiDateStr);
    return d.getFullYear() === targetDate.getFullYear() &&
           d.getMonth() === targetDate.getMonth() &&
           d.getDate() === targetDate.getDate();
  };

  const isSameMonth = (apiDateStr: string, targetDate: Date) => {
    const d = new Date(apiDateStr);
    return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth();
  };

  // 2. Helper: Menjumlahkan (Sum) semua transaksi di hari/bulan yang sama
  const aggregateData = (targetDate: Date, isMonthly: boolean = false) => {
    // Cari semua data yang tanggalnya cocok
    const matches = apiData.filter(item =>
      isMonthly ? isSameMonth(item.date, targetDate) : isSameDay(item.date, targetDate)
    );

    // Jika tidak ada transaksi di hari itu, kembalikan 0
    if (matches.length === 0) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = isMonthly
        ? `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-01`
        : `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;
      return { date: dateStr, pemasukan: 0, pengeluaran: 0, selisih: 0 };
    }

    // Jika ada banyak transaksi di hari yang sama, JUMLAHKAN semuanya!
    return matches.reduce((acc, curr) => ({
      date: curr.date, // Ambil tanggal asli
      pemasukan: acc.pemasukan + (curr.pemasukan || 0),
      pengeluaran: acc.pengeluaran + (curr.pengeluaran || 0),
      selisih: acc.selisih + (curr.selisih || 0)
    }), { date: '', pemasukan: 0, pengeluaran: 0, selisih: 0 });
  };

  // 3. Looping Pembuatan Kalender
  if (filterType === 'harian') {
    // Generate 7 Hari Terakhir
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      result.push(aggregateData(d, false));
    }
  } else if (filterType === 'bulanan') {
    // Generate Tanggal 1 sampai akhir bulan ini
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      result.push(aggregateData(d, false));
    }
  } else if (filterType === 'tahunan') {
    // Generate 12 Bulan dalam tahun ini
    const year = today.getFullYear();
    for (let i = 0; i < 12; i++) {
      const d = new Date(year, i, 1);
      result.push(aggregateData(d, true));
    }
  } else {
    return apiData;
  }

  return result;
};

// 3. Tooltip Components
interface TooltipPayload { name: string; value: number; color: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayload[]; label?: string; filterType: FilterType; }

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

// --- KOMPONEN UTAMA ---
interface WaveChartProps { data: ChartSummaryData[]; loading: boolean; filterType: FilterType; }

export default function WaveChart({ data, loading, filterType }: WaveChartProps) {
  if (loading) {
    return <div className="w-full h-full flex items-center justify-center text-muted font-medium animate-pulse">Memuat Analisis...</div>;
  }

  // Proses data sebelum dimasukkan ke grafik
  const completeData = generateCompleteData(data, filterType);

  const formatRupiah = (value: number) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}k`;
    return `Rp ${value}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {/* Perbaikan Margin Left agar tulisan "Rp" tidak terpotong */}
      <AreaChart data={completeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
          tickFormatter={(tick) => formatXAxis(tick, filterType)} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
          dy={10} 
          // Menyembunyikan beberapa tanggal jika terlalu padat (khusus bulanan)
          minTickGap={20}
        />
        
        {/* Lebar YAxis diatur agar angka tidak keluar jalur */}
        <YAxis 
          width={65}
          tickFormatter={formatRupiah} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
        />
        
        <Tooltip content={<CustomTooltip filterType={filterType} />} />
        
        <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorPengeluaran)" activeDot={{ r: 6, strokeWidth: 0 }} />
        <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#11caa0" strokeWidth={3} fillOpacity={1} fill="url(#colorPemasukan)" activeDot={{ r: 6, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}