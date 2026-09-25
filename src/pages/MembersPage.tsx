import { useEffect, useState } from 'react';
import {
  Plus, Search, Pencil, Trash2, X, Users, AlertCircle,
  Phone, MapPin, CheckCircle, XCircle
} from 'lucide-react';
import { supabase, type Member } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('members').select('*').order('name');
    if (data) setMembers(data as Member[]);
    setLoading(false);
  }

  const filtered = members.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.phone.includes(q);
    }
    return true;
  });

  function openAdd() {
    setEditing(null);
    setForm({ name: '', phone: '', address: '', status: 'active' });
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(m: Member) {
    setEditing(m);
    setForm({ name: m.name, phone: m.phone, address: m.address, status: m.status });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('Nama anggota wajib diisi');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('members').update(form).eq('id', editing.id);
      if (error) setFormError(error.message);
      else setModalOpen(false);
    } else {
      const { error } = await supabase.from('members').insert(form);
      if (error) setFormError(error.message);
      else setModalOpen(false);
    }
    setSaving(false);
    loadData();
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase.from('members').delete().eq('id', confirmDelete.id);
    if (!error) {
      setConfirmDelete(null);
      loadData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Anggota</h1>
          <p className="text-slate-500 mt-1">Kelola data anggota kas</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Anggota
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau telepon..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-lg">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                statusFilter === s
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {s === 'all' ? 'Semua' : s === 'active' ? 'Aktif' : 'Nonaktif'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-500">Belum ada anggota</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{m.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs mt-0.5 ${
                      m.status === 'active' ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {m.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {m.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(m)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(m)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-slate-500">
                {m.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" /> {m.phone}
                  </div>
                )}
                {m.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /> {m.address}
                  </div>
                )}
                <p className="text-xs text-slate-400 pt-1">Bergabung: {formatDate(m.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                {editing ? 'Edit Anggota' : 'Tambah Anggota'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Nama anggota"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Telepon</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Alamat</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  placeholder="Alamat anggota"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, status: 'active' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      form.status === 'active'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" /> Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, status: 'inactive' })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      form.status === 'inactive'
                        ? 'bg-slate-500 border-slate-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Nonaktif
                  </button>
                </div>
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
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Hapus Anggota?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Anggota <span className="font-medium">{confirmDelete.name}</span> akan dihapus permanen.
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
