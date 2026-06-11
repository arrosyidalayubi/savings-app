import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  date: string;
  pemasukan: number;
  pengeluaran: number;
  selisih: number;
}

interface WaveChartProps {
  data: ChartData[];
  loading?: boolean;
  filterType?: string;
}


export default function WaveChart({ data }: WaveChartProps) {
  return (
    <div className="w-full h-80 min-h-80 p-4 bg-white rounded-xl shadow-md">
      <h3 className="text-lg font-bold mb-4 text-gray-700">Tren Pemasukan vs Pengeluaran</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <Tooltip />
          
          {/* type="monotone" memberikan efek garis melengkung seperti gelombang */}
          <Area 
            type="monotone" 
            dataKey="pemasukan" 
            stroke="#10B981" 
            fillOpacity={1} 
            fill="url(#colorPemasukan)" 
          />
          <Area 
            type="monotone" 
            dataKey="pengeluaran" 
            stroke="#EF4444" 
            fillOpacity={1} 
            fill="url(#colorPengeluaran)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}