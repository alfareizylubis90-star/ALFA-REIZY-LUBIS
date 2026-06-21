import React, { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, ClipboardList, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Jobdes } from "../types";

interface JobdesManagementProps {
  jobdesList: Jobdes[];
  onAddJobdes: (jobdes: Omit<Jobdes, "id">) => void;
  onUpdateJobdes: (jobdes: Jobdes) => void;
  onDeleteJobdes: (id: string) => void;
}

export default function JobdesManagement({
  jobdesList,
  onAddJobdes,
  onUpdateJobdes,
  onDeleteJobdes,
}: JobdesManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Custom dialog & alert states (To bypass iframe native browser dialog blocks)
  const [customConfirm, setCustomConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    isSuccess?: boolean;
  } | null>(null);

  // New Jobdes states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"HP SITUS" | "AREA KERJA" | "LAINNYA">("HP SITUS");
  const [description, setDescription] = useState("");

  // Edit Jobdes states
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<"HP SITUS" | "AREA KERJA" | "LAINNYA">("HP SITUS");
  const [editDescription, setEditDescription] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setCustomAlert({
        title: "Kesalahan Form",
        message: "Mohon isi Judul Tugas / Pengecekan sebelum menyimpan.",
      });
      return;
    }
    onAddJobdes({
      title: title.trim(),
      category,
      description: description.trim() || undefined,
    });
    setTitle("");
    setDescription("");
    setCategory("HP SITUS");
    setShowAddForm(false);
    setCustomAlert({
      title: "Jobdes Tersimpan",
      message: `Tugas "${title.trim()}" telah berhasil ditambahkan ke katalog harian.`,
      isSuccess: true,
    });
  };

  const handleStartEdit = (job: Jobdes) => {
    setEditingId(job.id);
    setEditTitle(job.title);
    setEditCategory(job.category);
    setEditDescription(job.description || "");
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) {
      setCustomAlert({
        title: "Kesalahan Form",
        message: "Judul Jobdes tidak boleh kosong.",
      });
      return;
    }
    onUpdateJobdes({
      id,
      title: editTitle.trim(),
      category: editCategory,
      description: editDescription.trim() || undefined,
    });
    setEditingId(null);
    setCustomAlert({
      title: "Tugas Diperbarui",
      message: "Data detail deskripsi jobdesk ini berhasil diubah.",
      isSuccess: true,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const getCategoryBadgeClass = (cat: "HP SITUS" | "AREA KERJA" | "LAINNYA") => {
    switch (cat) {
      case "HP SITUS":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "AREA KERJA":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "LAINNYA":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Interactive Admin Controls Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📝 Kamus Jobdes Pengecekan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi daftar pengecekan HP atau pengecekan area kerja yang akan diacak ke staff saat pergantian shift.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
        >
          <Plus className="w-4 h-4" /> Tambah Jobdes Baru
        </button>
      </div>

      {/* Add form panel */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-slate-900 border border-blue-500/30 rounded-xl p-5 space-y-4 animate-fadeIn"
        >
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-blue-400">📝 Tambah Jobdes Baru</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Judul Tugas / Pengecekan</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="cth. Cek HP all SITUS - Google Chrome"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as "HP SITUS" | "AREA KERJA" | "LAINNYA")}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="HP SITUS">HP SITUS (Cek HP all SITUS)</option>
                <option value="AREA KERJA">AREA KERJA (Suhu, Kebersihan dll)</option>
                <option value="LAINNYA">LAINNYA (Administrasi dll)</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Deskripsi Tambahan (Opsional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Petunjuk detail pengerjaan tugas..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-semibold"
            >
              Simpan Jobdes
            </button>
          </div>
        </form>
      )}

      {/* Database catalog view */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            Katalog Tugas Aktif ({jobdesList.length})
          </span>
        </div>

        {jobdesList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm">Belum ada jobdes tersimpan harian. Silahkan tambahkan di atas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {jobdesList.map((job) => {
              const isEditing = editingId === job.id;

              return (
                <div
                  key={job.id}
                  className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700/80 transition-all group"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Judul Tugas
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Kategori
                          </label>
                          <select
                            value={editCategory}
                            onChange={(e) =>
                              setEditCategory(
                                e.target.value as "HP SITUS" | "AREA KERJA" | "LAINNYA"
                              )
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="HP SITUS">HP SITUS</option>
                            <option value="AREA KERJA">AREA KERJA</option>
                            <option value="LAINNYA">LAINNYA</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Deskripsi
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5 pt-2">
                        <button
                          onClick={() => handleSaveEdit(job.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs flex items-center gap-1 font-medium"
                        >
                          <Check className="w-3.5 h-3.5" /> Simpan
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        {/* Upper element */}
                        <div className="flex items-start justify-between gap-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(
                              job.category
                            )}`}
                          >
                            {job.category}
                          </span>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(job)}
                              className="text-slate-400 hover:text-blue-400 p-1 rounded hover:bg-slate-900"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setCustomConfirm({
                                  title: "Hapus Jobdesk",
                                  message: `Apakah Anda yakin ingin menghapus jobdes "${job.title}" secara permanen? Data ini tidak akan lagi masuk dalam perhitungan pengacakan shift.`,
                                  onConfirm: () => {
                                    onDeleteJobdes(job.id);
                                    setCustomConfirm(null);
                                    setCustomAlert({
                                      title: "Jobdes Dihapus",
                                      message: `Jobdesk "${job.title}" telah dihapus dengan sukses.`,
                                      isSuccess: true,
                                    });
                                  }
                                });
                              }}
                              className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-900"
                              title="Hapus"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* App header title */}
                        <h4 className="text-xs font-bold text-white my-2 leading-relaxed">
                          {job.title}
                        </h4>

                        {/* Description field */}
                        <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                          {job.description || "Tidak ada deskripsi tambahan harian."}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CUSTOM ALERT MODAL (Iframe Safe) */}
      {customAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 mb-3">
              {customAlert.isSuccess ? (
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{customAlert.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{customAlert.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setCustomAlert(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL (Iframe Safe) */}
      {customConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{customConfirm.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">{customConfirm.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCustomConfirm(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-1.5 rounded-lg font-semibold"
              >
                Batal
              </button>
              <button
                onClick={customConfirm.onConfirm}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
