import { useEffect, useState, useMemo } from 'react';
import {
  FileBarChart, TrendingUp, TrendingDown, Wallet, Download,
  ArrowUpRight, ArrowDownRight, Calendar, PieChart
} from 'lucide-react';
import { supabase, type Transaction, type Category, type Member } from '@/lib/supabase';
import { formatRupiah, formatDate, getMonthName } from '@/lib/utils';

export default function ReportsPage({ isAdmin }: { isAdmin: boolean }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [txRes, catRes, memRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, category:categories(*), member:members(*)')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('members').select('*').order('name'),
    ]);
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (catRes.data) setCategories(catRes.data as Category[]);
    if (memRes.data) setMembers(memRes.data as Member[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.date < startDate || tx.date > endDate) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.category_id !== categoryFilter) return false;
      if (memberFilter !== 'all' && tx.member_id !== memberFilter) return false;
      return true;
    });
  }, [transactions, startDate, endDate, typeFilter, categoryFilter, memberFilter]);

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  // Category breakdown
  const incomeByCategory = filtered
    .filter((t) => t.type === 'income' && t.category_id)
    .reduce<Record<string, { name: string; total: number; count: number }>>((acc, t) => {
      const key = t.category_id!;
      if (!acc[key]) acc[key] = { name: t.category?.name ?? 'Lainnya', total: 0, count: 0 };
      acc[key].total += Number(t.amount);
      acc[key].count += 1;
      return acc;
    }, {});

  const expenseByCategory = filtered
    .filter((t) => t.type === 'expense' && t.category_id)
    .reduce<Record<string, { name: string; total: number; count: number }>>((acc, t) => {
      const key = t.category_id!;
      if (!acc[key]) acc[key] = { name: t.category?.name ?? 'Lainnya', total: 0, count: 0 };
      acc[key].total += Number(t.amount);
      acc[key].count += 1;
      return acc;
    }, {});

  // Monthly breakdown
  const monthlyData = filtered.reduce<Record<string, { income: number; expense: number }>>((acc, t) => {
    const monthKey = t.date.substring(0, 7);
    if (!acc[monthKey]) acc[monthKey] = { income: 0, expense: 0 };
    if (t.type === 'income') acc[monthKey].income += Number(t.amount);
    else acc[monthKey].expense += Number(t.amount);
    return acc;
  }, {});

  const sortedMonths = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b));

  // Member contributions
  const memberContributions = filtered
    .filter((t) => t.type === 'income' && t.member_id)
    .reduce<Record<string, { name: string; total: number; count: number }>>((acc, t) => {
      const key = t.member_id!;
      if (!acc[key]) acc[key] = { name: t.member?.name ?? 'Tidak diketahui', total: 0, count: 0 };
      acc[key].total += Number(t.amount);
      acc[key].count += 1;
      return acc;
    }, {});

  const sortedMemberContrib = Object.entries(memberContributions).sort(([, a], [, b]) => b.total - a.total);

  // Max for bar chart scaling
  const maxMonthValue = Math.max(...sortedMonths.map(([, v]) => Math.max(v.income, v.expense)), 1);

  function exportCSV() {
    const headers = ['Tanggal', 'Jenis', 'Jumlah', 'Kategori', 'Anggota', 'Keterangan'];
    const rows = filtered.map((t) => [
      t.date,
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.amount,
      t.category?.name ?? '',
      t.member?.name ?? '',
      t.description ?? '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-kas-${startDate}-sd-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const summaryCards = [
    { label: 'Total Pemasukan', value: formatRupiah(totalIncome), icon: TrendingUp, color: 'emerald' },
    { label: 'Total Pengeluaran', value: formatRupiah(totalExpense), icon: TrendingDown, color: 'red' },
    { label: 'Saldo', value: formatRupiah(balance), icon: Wallet, color: balance >= 0 ? 'blue' : 'red' },
    { label: 'Jumlah Transaksi', value: filtered.length.toString(), icon: FileBarChart, color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan</h1>
          <p className="text-slate-500 mt-1">Rekap detail transaksi kas</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-800">Filter Laporan</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Jenis</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="all">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="all">Semua</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Anggota</label>
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="all">Semua</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colorMap[stat.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-3">
            <FileBarChart className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500">Tidak ada transaksi pada periode ini</p>
        </div>
      ) : (
        <>
          {/* Monthly breakdown */}
          {sortedMonths.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Rekap Bulanan</h2>
              </div>
              <div className="p-5 space-y-4">
                {sortedMonths.map(([month, data]) => {
                  const [year, monthNum] = month.split('-');
                  const mIdx = parseInt(monthNum) - 1;
                  return (
                    <div key={month}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{getMonthName(mIdx)} {year}</span>
                        <span className={`text-sm font-semibold ${data.income - data.expense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatRupiah(data.income - data.expense)}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 w-28 shrink-0">
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs text-slate-500">Pemasukan</span>
                          </div>
                          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(data.income / maxMonthValue) * 100}%`, minWidth: '2px' }}
                            >
                              {data.income > 0 && <span className="text-[10px] text-white font-medium">{formatRupiah(data.income)}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 w-28 shrink-0">
                            <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
                            <span className="text-xs text-slate-500">Pengeluaran</span>
                          </div>
                          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="bg-red-500 h-full rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(data.expense / maxMonthValue) * 100}%`, minWidth: '2px' }}
                            >
                              {data.expense > 0 && <span className="text-[10px] text-white font-medium">{formatRupiah(data.expense)}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category breakdown + Member contributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-slate-400" />
                <h2 className="font-semibold text-slate-800">Rincian per Kategori</h2>
              </div>
              <div className="p-5 space-y-6">
                {/* Income categories */}
                <div>
                  <h3 className="text-sm font-medium text-emerald-600 mb-3">Pemasukan</h3>
                  {Object.values(incomeByCategory).length === 0 ? (
                    <p className="text-sm text-slate-400">Tidak ada data</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.values(incomeByCategory).sort((a, b) => b.total - a.total).map((cat, i) => {
                        const pct = totalIncome > 0 ? (cat.total / totalIncome) * 100 : 0;
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-slate-700">{cat.name}</span>
                              <span className="text-slate-500">{formatRupiah(cat.total)} ({pct.toFixed(1)}%)</span>
                            </div>
                            <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Expense categories */}
                <div>
                  <h3 className="text-sm font-medium text-red-600 mb-3">Pengeluaran</h3>
                  {Object.values(expenseByCategory).length === 0 ? (
                    <p className="text-sm text-slate-400">Tidak ada data</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.values(expenseByCategory).sort((a, b) => b.total - a.total).map((cat, i) => {
                        const pct = totalExpense > 0 ? (cat.total / totalExpense) * 100 : 0;
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-slate-700">{cat.name}</span>
                              <span className="text-slate-500">{formatRupiah(cat.total)} ({pct.toFixed(1)}%)</span>
                            </div>
                            <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-red-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Member contributions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Kontribusi Anggota</h2>
              </div>
              <div className="p-5">
                {sortedMemberContrib.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400">Tidak ada kontribusi anggota pada periode ini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedMemberContrib.map(([id, data], i) => {
                      const maxContrib = sortedMemberContrib[0][1].total;
                      const pct = (data.total / maxContrib) * 100;
                      return (
                        <div key={id} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-slate-700 truncate">{data.name}</span>
                              <span className="text-sm font-medium text-slate-600 shrink-0 ml-2">{formatRupiah(data.total)}</span>
                            </div>
                            <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed transaction table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Detail Transaksi</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Tanggal</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Jenis</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Keterangan</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Kategori</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Anggota</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {tx.type === 'income' ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700">{tx.description || '-'}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-sm text-slate-600">{tx.category?.name ?? '-'}</td>
                      <td className="px-5 py-3 hidden lg:table-cell text-sm text-slate-600">{tx.member?.name ?? '-'}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatRupiah(Number(tx.amount))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-slate-700">Total Pemasukan: {formatRupiah(totalIncome)} | Total Pengeluaran: {formatRupiah(totalExpense)}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <span className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        Saldo: {formatRupiah(balance)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
