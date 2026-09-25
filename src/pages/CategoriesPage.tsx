import { useEffect, useState } from 'react';
import {
  Plus, Pencil, Trash2, X, Tags, AlertCircle,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { supabase, type Category } from '@/lib/supabase';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const [form, setForm] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('type').order('name');
    if (data) setCategories(data as Category[]);
    setLoading(false);
  }

  const incomeCats = categories.filter((c) => c.type === 'income');
  const expenseCats = categories.filter((c) => c.type === 'expense');

  function openAdd(type?: 'income' | 'expense') {
    setEditing(null);
    setForm({ name: '', type: type ?? 'income' });
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, type: c.type });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('Nama kategori wajib diisi');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('categories').update(form).eq('id', editing.id);
      if (error) setFormError(error.message);
      else setModalOpen(false);
    } else {
      const { error } = await supabase.from('categories').insert(form);
      if (error) setFormError(error.message);
      else setModalOpen(false);
    }
    setSaving(false);
    loadData();
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase.from('categories').delete().eq('id', confirmDelete.id);
    if (!error) {
      setConfirmDelete(null);
      loadData();
    }
  }

  function renderCategoryList(
    title: string,
    cats: Category[],
    type: 'income' | 'expense',
    icon: typeof ArrowUpRight,
    color: string
  ) {
    const Icon = icon;
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-slate-800">{title}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{cats.length}</span>
          </div>
          <button
            onClick={() => openAdd(type)}
            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
        {cats.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">Belum ada kategori</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cats.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-700">{c.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kategori</h1>
          <p className="text-slate-500 mt-1">Kelompokkan transaksi berdasarkan kategori</p>
        </div>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderCategoryList('Kategori Pemasukan', incomeCats, 'income', ArrowUpRight, 'bg-emerald-50 text-emerald-600')}
          {renderCategoryList('Kategori Pengeluaran', expenseCats, 'expense', ArrowDownRight, 'bg-red-50 text-red-600')}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                {editing ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Jenis</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'income' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      form.type === 'income'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'expense' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      form.type === 'expense'
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Pengeluaran
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Kategori</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="contoh: Iuran Bulanan, Belanja, dll"
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
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Hapus Kategori?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Kategori <span className="font-medium">{confirmDelete.name}</span> akan dihapus.
              Transaksi terkait akan tetap ada namun tanpa kategori.
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
