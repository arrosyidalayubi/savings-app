import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DistributionItem {
  name: string;
  value: number;
}

interface DistributionChartProps {
  data: DistributionItem[];
}

// Menggunakan Palette Warna dari Desain (Accent, Warning, Error, dst)
const COLORS = ['#13A67B', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function DistributionChart({ data }: DistributionChartProps) {
  const formatRupiah = (num: number): string => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  if (data.length === 0) {
    return (
      <div className="w-full h-full min-h-80 flex items-center justify-center">
        <span className="text-muted text-sm font-medium">Belum ada distribusi pengeluaran.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-80 flex flex-col justify-between">
      <h3 className="text-lg font-bold text-primary mb-2">Distribution</h3>
      <div className="w-full h-64 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              stroke="none" // Menghilangkan garis putih standar Recharts
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            
            {/* Custom Tooltip Premium */}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-surface border border-border p-3.5 rounded-xl shadow-xl flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></div>
                      <div>
                        <p className="text-xs font-semibold text-muted">{payload[0].name}</p>
                        <p className="text-sm font-bold text-primary">
                          {formatRupiah(Number(payload[0].value || 0))}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Legend 
              iconType="circle" 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center" 
              wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}