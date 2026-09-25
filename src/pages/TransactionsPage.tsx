import { useEffect, useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, ArrowUpRight, ArrowDownRight,
  X, Receipt, AlertCircle
} from 'lucide-react';
import { supabase, type Transaction, type Category, type Member } from '@/lib/supabase';
import { formatRupiah, formatDate } from '@/lib/utils';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);

  const [form, setForm] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category_id: '',
    member_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(q);
      const matchCat = tx.category?.name?.toLowerCase().includes(q);
      const matchMem = tx.member?.name?.toLowerCase().includes(q);
      return matchDesc || matchCat || matchMem;
    }
    return true;
  });

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  function openAdd() {
    setEditing(null);
    setForm({
      type: 'income',
      amount: '',
      category_id: '',
      member_id: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setForm({
      type: tx.type,
      amount: String(tx.amount),
      category_id: tx.category_id ?? '',
      member_id: tx.member_id ?? '',
      description: tx.description ?? '',
      date: tx.date,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFormError('Jumlah harus lebih dari 0');
      return;
    }

    setSaving(true);
    const payload = {
      type: form.type,
      amount,
      category_id: form.category_id || null,
      member_id: form.member_id || null,
      description: form.description,
      date: form.date,
    };

    if (editing) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', editing.id);
      if (error) setFormError(error.message);
      else setModalOpen(false);
    } else {
      const { error } = await supabase.from('transactions').insert(payload);
      if (error) setFormError(error.message);
      else setModalOpen(false);
    }
    setSaving(false);
    loadData();
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase.from('transactions').delete().eq('id', confirmDelete.id);
    if (!error) {
      setConfirmDelete(null);
      loadData();
    }
  }

  const availableCategories = categories.filter((c) => c.type === form.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transaksi</h1>
          <p className="text-slate-500 mt-1">Kelola pemasukan dan pengeluaran kas</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Transaksi
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pemasukan</p>
              <p className="text-lg font-bold text-emerald-600">{formatRupiah(totalIncome)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pengeluaran</p>
              <p className="text-lg font-bold text-red-600">{formatRupiah(totalExpense)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Selisih</p>
              <p className="text-lg font-bold text-slate-800">{formatRupiah(totalIncome - totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-lg">
          {(['all', 'income', 'expense'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                typeFilter === t
                  ? t === 'income' ? 'bg-emerald-500 text-white'
                    : t === 'expense' ? 'bg-red-500 text-white'
                    : 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t === 'all' ? 'Semua' : t === 'income' ? 'Masuk' : 'Keluar'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Tanggal</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Deskripsi</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Kategori</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Anggota</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Jumlah</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                          tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </span>
                        <span className="text-sm text-slate-700">{tx.description || '-'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {tx.category ? (
                        <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{tx.category.name}</span>
                      ) : <span className="text-slate-300 text-sm">-</span>}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-sm text-slate-600">{tx.member?.name ?? '-'}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatRupiah(Number(tx.amount))}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(tx)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(tx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                {editing ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Jenis</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'income', category_id: '' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      form.type === 'income'
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'expense', category_id: '' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      form.type === 'expense'
                        ? 'bg-red-500 border-red-500 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Pengeluaran
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah (Rp)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    min="1"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Pilih kategori...</option>
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {availableCategories.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Belum ada kategori untuk jenis ini. Tambahkan di halaman Kategori.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Anggota (opsional)</label>
                <select
                  value={form.member_id}
                  onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Pilih anggota...</option>
                  {members.filter((m) => m.status === 'active').map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  placeholder="Tambahkan keterangan..."
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Hapus Transaksi?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Transaksi <span className="font-medium">{confirmDelete.description || 'tanpa keterangan'}</span> sebesar{' '}
              <span className="font-medium">{formatRupiah(Number(confirmDelete.amount))}</span> akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
