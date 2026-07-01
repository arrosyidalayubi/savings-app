import { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import type { Goal } from '../types';

interface GoalsViewProps {
  goals: Goal[];
  isLoadingGoals: boolean;
  openGoalModal: (goal?: Goal) => void;
  handleDeleteGoal: (id: number) => void;
  handleAddMoney: (goal: Goal) => void;
  formatRupiah: (num: number) => string;
}

export default function GoalsView({ goals, isLoadingGoals, openGoalModal, handleDeleteGoal, handleAddMoney, formatRupiah }: GoalsViewProps) {
  const [activeTab, setActiveTab] = useState<'semua' | 'active' | 'completed'>('semua');
  const activeCount = goals.filter(g => g.saved_amount < g.target_amount).length;
  const completedCount = goals.filter(g => g.saved_amount >= g.target_amount).length;
  const allCount = goals.length;
  const displayedGoals = goals.filter(goal => {
    if (activeTab === 'active') return goal.saved_amount < goal.target_amount;
    if (activeTab === 'completed') return goal.saved_amount >= goal.target_amount;
    return true; // Jika 'semua', tampilkan semua
  });
  return (
    <div className="space-y-6">
      <div className="relative z-9999 flex gap-6 border-b border-border mb-6 pointer-events-auto isolate">
  <button 
    type="button"
    onClick={() => setActiveTab('semua')}
    className={`pb-3 font-semibold transition-colors cursor-pointer ${
      activeTab === 'semua' 
        ? 'border-b-2 border-primary text-primary' 
        : 'text-muted hover:text-primary'
    }`}
  >
    Semua Target ({allCount})
  </button>
  
  <button 
    type="button"
    onClick={() => setActiveTab('active')}
    className={`pb-3 font-semibold transition-colors cursor-pointer ${
      activeTab === 'active' 
        ? 'border-b-2 border-primary text-primary' 
        : 'text-muted hover:text-primary'
    }`}
  >
    Active ({activeCount})
  </button>
  
  <button 
    type="button"
    onClick={() => setActiveTab('completed')}
    className={`pb-3 font-semibold transition-colors cursor-pointer ${
      activeTab === 'completed' 
        ? 'border-b-2 border-primary text-primary' 
        : 'text-muted hover:text-primary'
    }`}
  >
    Completed ({completedCount})
  </button>
</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoadingGoals ? (
          <div className="col-span-full py-12 text-center text-muted font-medium">Memuat data...</div>
        ) : displayedGoals.map(goal => {
          const percentage = Math.min(Math.round((goal.saved_amount / goal.target_amount) * 100), 100);
          return (
            <div key={goal.id} className="relative group bg-surface border border-border rounded-[20px] p-6 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary">
                    {goal.icon === 'Laptop' ? <Icons.Laptop /> : goal.icon === 'Car' ? <Icons.Car /> : <Icons.Target />}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">{goal.name}</h4>
                    <p className="text-sm text-primary font-semibold">{formatRupiah(goal.target_amount)}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2"><span>{percentage}%</span><span>{formatRupiah(goal.saved_amount)}</span></div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
                  <div className={`h-full rounded-full bg-accent`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openGoalModal(goal)} className="flex-1 py-2 bg-background border border-border rounded-lg text-xs font-bold text-primary">Edit</button>
                <button onClick={() => handleAddMoney(goal)} className="flex-1 py-2 bg-accent text-white rounded-lg text-xs font-bold">+ Add Money</button>
                <button onClick={() => handleDeleteGoal(goal.id)} className="absolute top-4 right-4 p-1.5 text-danger opacity-0 group-hover:opacity-100 bg-danger/10 rounded-lg transition" title="Hapus Goal"><Icons.Trash /> {/* Pastikan ini ikon tempat sampah atau sesuai keinginan Anda */}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}