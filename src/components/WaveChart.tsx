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
  const formatRupiah = (num: number): string => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-62.5 flex items-center justify-center">
        <span className="text-muted text-sm font-medium animate-pulse">Merender grafik analitik...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-full min-h-62.5 flex items-center justify-center">
        <span className="text-muted text-sm border border-dashed border-border px-6 py-4 rounded-xl">Belum ada data untuk {filterType} ini.</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        {/* Definisi Gradasi Warna Hijau Aksen */}
        <defs>
          <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#13A67B" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#13A67B" stopOpacity={0}/>
          </linearGradient>
        </defs>
        
        {/* Grid Latar Belakang ala Buku Milimeter */}
        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--border-line)" opacity={0.5} />
        
        {/* Menyembunyikan Label Sumbu (Axis) */}
        <XAxis dataKey="date" hide />
        <YAxis hide domain={['auto', 'auto']} />
        
        {/* Custom Tooltip mengikuti Tema UI */}
        <Tooltip
          cursor={{ stroke: 'var(--border-line)', strokeWidth: 2, strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-surface border border-border p-3.5 rounded-xl shadow-xl">
                  <p className="text-xs font-semibold text-muted mb-1">{payload[0].payload.date}</p>
                  <p className="text-base font-bold text-accent">
                    {formatRupiah(payload[0].value as number)}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        
        {/* Garis Grafik Utama */}
        <Area
          type="monotone"
          dataKey="selisih"
          stroke="#13A67B"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorNeto)"
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}