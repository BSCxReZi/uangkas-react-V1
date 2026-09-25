import { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Users, ArrowUpRight,
  ArrowDownRight, Calendar, Receipt
} from 'lucide-react';
import { supabase, type Transaction, type Member } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatRupiah, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [txRes, memRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*, category:categories(*), member:members(*)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('members').select('id', { count: 'exact', head: true }),
      ]);

      if (txRes.data) setTransactions(txRes.data as Transaction[]);
      if (memRes.count !== null) setMemberCount(memRes.count);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const stats = [
    {
      label: 'Saldo Kas',
      value: formatRupiah(balance),
      icon: Wallet,
      color: 'emerald',
      desc: 'Saldo dari 10 transaksi terakhir',
    },
    {
      label: 'Total Pemasukan',
      value: formatRupiah(totalIncome),
      icon: TrendingUp,
      color: 'blue',
      desc: `${transactions.filter((t) => t.type === 'income').length} transaksi masuk`,
    },
    {
      label: 'Total Pengeluaran',
      value: formatRupiah(totalExpense),
      icon: TrendingDown,
      color: 'red',
      desc: `${transactions.filter((t) => t.type === 'expense').length} transaksi keluar`,
    },
    {
      label: 'Jumlah Anggota',
      value: memberCount.toString(),
      icon: Users,
      color: 'amber',
      desc: 'Anggota terdaftar',
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Selamat datang kembali, <span className="font-medium text-slate-700">{profile?.full_name}</span>
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${colorMap[stat.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-2">{stat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Transaksi Terbaru</h2>
          <Receipt className="w-5 h-5 text-slate-400" />
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat data...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">Belum ada transaksi</p>
            <p className="text-sm text-slate-400 mt-1">Mulai dengan menambahkan transaksi pertama Anda</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.type === 'income'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {tx.description || tx.category?.name || (tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{formatDate(tx.date)}</span>
                    {tx.category && (
                      <>
                        <span>•</span>
                        <span>{tx.category.name}</span>
                      </>
                    )}
                    {tx.member && (
                      <>
                        <span>•</span>
                        <span>{tx.member.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-semibold shrink-0 ${
                  tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {tx.type === 'income' ? '+' : '-'}{formatRupiah(Number(tx.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
