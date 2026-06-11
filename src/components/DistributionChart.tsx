import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DistributionItem {
  name: string;
  value: number;
}

interface DistributionChartProps {
  data: DistributionItem[];
}

// Warna-warna elegan untuk diagram lingkaran
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function DistributionChart({ data }: DistributionChartProps) {
  const formatRupiah = (num: number): string => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  if (data.length === 0) {
    return (
      <div className="w-full h-full min-h-80 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center">
        <span className="text-slate-400 text-sm">Belum ada data pengeluaran untuk filter ini.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-80 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors duration-300">
      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Distribusi Pengeluaran</h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatRupiah(Number(value || 0))} />
            <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}