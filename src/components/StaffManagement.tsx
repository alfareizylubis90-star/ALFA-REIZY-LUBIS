import React, { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, ShieldAlert, BadgeInfo, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Staff } from "../types";

interface StaffManagementProps {
  staffs: Staff[];
  onAddStaff: (staff: Omit<Staff, "id">) => void;
  onUpdateStaff: (staff: Staff) => void;
  onDeleteStaff: (id: string) => void;
  onSaveShiftChanges: (updatedStaffs: Staff[]) => void;
}

export default function StaffManagement({
  staffs,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onSaveShiftChanges,
}: StaffManagementProps) {
  // Filters or Tab states inside Staff component
  const [shiftFilter, setShiftFilter] = useState<"Semua" | "Pagi" | "Siang" | "Malam" | "Bebas">("Semua");
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Custom dialog & alert states (To bypass iframe native dialog blocks)
  const [customConfirm, setCustomConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
    isDanger?: boolean;
  } | null>(null);

  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    isSuccess?: boolean;
  } | null>(null);

  // New staff form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    role: "",
    shift: "Pagi" as "Pagi" | "Siang" | "Malam" | "Bebas",
    isActive: true,
    username: "",
    password: "",
    loginRole: "STAFF" as "ADMIN" | "STAFF",
  });

  // Edit staff inline form state
  const [editForm, setEditForm] = useState<Staff | null>(null);

  // Temporary Shift configuration map to support "Simpan Perubahan Shift" button
  const [tempShifts, setTempShifts] = useState<Record<string, "Pagi" | "Siang" | "Malam" | "Bebas">>(() => {
    const initial: Record<string, "Pagi" | "Siang" | "Malam" | "Bebas"> = {};
    staffs.forEach((s) => {
      initial[s.id] = s.shift;
    });
    return initial;
  });

  // Sync tempShifts if staffs list changes externally
  React.useEffect(() => {
    const updated: Record<string, "Pagi" | "Siang" | "Malam" | "Bebas"> = {};
    staffs.forEach((s) => {
      updated[s.id] = s.shift;
    });
    setTempShifts(updated);
  }, [staffs]);

  const handleTempShiftChange = (staffId: string, value: "Pagi" | "Siang" | "Malam" | "Bebas") => {
    setTempShifts((prev) => ({
      ...prev,
      [staffId]: value,
    }));
  };

  const handleSaveAllShifts = () => {
    const modifiedStaffs = staffs.map((s) => ({
      ...s,
      shift: tempShifts[s.id] || s.shift,
    }));
    onSaveShiftChanges(modifiedStaffs);
    setCustomAlert({
      title: "Sukses Menyimpan",
      message: "Perubahan jadwal shift seluruh staff berhasil diperbarui dan disimpan!",
      isSuccess: true,
    });
  };

  const submitAddForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.role.trim()) {
      setCustomAlert({
        title: "Validasi Lolos",
        message: "Mohon isi semua field (Nama Staff dan Jabatan) sebelum menyimpan.",
      });
      return;
    }
    onAddStaff({
      ...newForm,
      username: newForm.username.trim() || undefined,
      password: newForm.password.trim() || undefined,
      loginRole: newForm.loginRole,
    });
    setNewForm({
      name: "",
      role: "",
      shift: "Pagi",
      isActive: true,
      username: "",
      password: "",
      loginRole: "STAFF",
    });
    setShowAddForm(false);
    setCustomAlert({
      title: "Staff Ditambahkan",
      message: `Staff baru "${newForm.name}" berhasil ditambahkan ke database!`,
      isSuccess: true,
    });
  };

  const startEdit = (staff: Staff) => {
    setEditingStaffId(staff.id);
    setEditForm({ ...staff });
  };

  const saveEdit = () => {
    if (editForm) {
      if (!editForm.name.trim() || !editForm.role.trim()) {
        setCustomAlert({
          title: "Kesalahan Form",
          message: "Nama staff dan Jabatan tidak boleh kosong.",
        });
        return;
      }

      // Check if username, password, or loginRole has changed from original values
      const originalStaff = staffs.find((s) => s.id === editForm.id);
      const isCredentialChanged = originalStaff && (
        originalStaff.username !== editForm.username ||
        originalStaff.password !== editForm.password ||
        originalStaff.loginRole !== editForm.loginRole
      );

      const performSave = () => {
        onUpdateStaff(editForm);
        setEditingStaffId(null);
        setEditForm(null);
        setCustomAlert({
          title: "Perubahan Disimpan",
          message: "Detail profil staff telah berhasil diperbarui.",
          isSuccess: true,
        });
      };

      if (isCredentialChanged) {
        setCustomConfirm({
          title: "Konfirmasi Perubahan Kredensial",
          message: `Apakah Anda yakin ingin memperbarui Username, Sandi, atau Peran Hak Akses untuk staf "${editForm.name}"? Perubahan ini akan langsung berlaku pada sesi masuk staf berikutnya.`,
          confirmLabel: "Simpan Kredensial",
          isDanger: false,
          onConfirm: () => {
            performSave();
            setCustomConfirm(null);
          },
        });
      } else {
        performSave();
      }
    }
  };

  const cancelEdit = () => {
    setEditingStaffId(null);
    setEditForm(null);
  };

  const filteredStaffs = staffs.filter((s) => {
    if (shiftFilter === "Semua") return true;
    return s.shift === shiftFilter;
  });

  return (
    <div className="space-y-6">
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🧑‍💼 Manajemen Staff & Jadwal Shift
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tambah, edit, hapus staff, serta atur pembagian shift kerja harian secara dinamis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Shift Filter buttons */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex flex-wrap gap-1">
            {(["Semua", "Pagi", "Siang", "Malam", "Bebas"] as const).map((sh) => (
              <button
                key={sh}
                onClick={() => setShiftFilter(sh)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                  shiftFilter === sh
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {sh === "Bebas" ? "🌟 Bebas" : sh}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Staff
          </button>
        </div>
      </div>

      {/* Add Staff form block */}
      {showAddForm && (
        <form
          onSubmit={submitAddForm}
          className="bg-slate-900 border border-blue-500/30 rounded-xl p-5 space-y-4 animate-fadeIn"
        >
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-blue-400">👤 Formulir Tambah Staff Baru</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Staff</label>
              <input
                type="text"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                placeholder="cth. Aldi Pratama"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-400">Jabatan / Peran</label>
                <span className="text-[10px] text-slate-550 font-medium">Pilih cepat:</span>
              </div>
              <input
                type="text"
                value={newForm.role}
                onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}
                placeholder="cth. Supervisor / Senior Agent"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              />
              <div className="flex gap-1.5 mt-1.5">
                {["CS", "KAPTEN", "KASIR"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewForm({ ...newForm, role: tag })}
                    className="text-[10px] px-2.5 py-1 rounded bg-slate-900 hover:bg-amber-500/10 text-amber-500 hover:text-amber-400 border border-slate-800/80 hover:border-amber-500/30 font-extrabold transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Shift Kerja</label>
              <select
                value={newForm.shift}
                onChange={(e) =>
                  setNewForm({ ...newForm, shift: e.target.value as "Pagi" | "Siang" | "Malam" | "Bebas" })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 text-slate-200"
              >
                <option value="Pagi">🌅 Pagi</option>
                <option value="Siang">🌇 Siang</option>
                <option value="Malam">🌃 Malam</option>
                <option value="Bebas">🌟 Bebas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-400/90 mb-1">Username Login (Kustom/Sederhana)</label>
              <input
                type="text"
                value={newForm.username}
                onChange={(e) => setNewForm({ ...newForm, username: e.target.value })}
                placeholder="cth: aldi, yanto (huruf kecil)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-400/90 mb-1">Sandi / Password</label>
              <input
                type="text"
                value={newForm.password}
                onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                placeholder="cth: staff123"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-400/90 mb-1">Hak Akses Portal (Role)</label>
              <select
                value={newForm.loginRole}
                onChange={(e) =>
                  setNewForm({ ...newForm, loginRole: e.target.value as "ADMIN" | "STAFF" })
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="STAFF">🧑‍💼 STAF PORTAL</option>
                <option value="ADMIN">👑 MASTER ADMIN</option>
              </select>
            </div>

            <div className="flex items-center sm:col-span-2 md:col-span-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={newForm.isActive}
                  onChange={(e) => setNewForm({ ...newForm, isActive: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                />
                Status Aktif Saat Ini (Dapat ditunjuk ke tugas harian)
              </label>
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
              Simpan Staff
            </button>
          </div>
        </form>
      )}

      {/* Staff Grid/Table and Shift Controller Row */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-widest uppercase">
              Daftar Staff Terdaftar ({filteredStaffs.length})
            </span>
          </div>

          {/* Save shifts modification button */}
          <button
            onClick={handleSaveAllShifts}
            className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
          >
            💾 Simpan Perubahan Shift
          </button>
        </div>

        {filteredStaffs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm">Tidak ada data staff yang cocok dengan filter shift ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800/80">
                  <th className="py-3 px-4">Nama Staff</th>
                  <th className="py-3 px-4">Jabatan</th>
                  <th className="py-3 px-4">Hak Akses & Kredensial</th>
                  <th className="py-3 px-4 w-44">Shift Kerja (Dapat Diubah)</th>
                  <th className="py-3 px-4 text-center">Status Aktif</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredStaffs.map((st) => {
                  const isEditing = editingStaffId === st.id;
                  const currentTempShift = tempShifts[st.id] || st.shift;

                  return (
                    <tr
                      key={st.id}
                      id={`staff-row-${st.id}`}
                      className="hover:bg-slate-950/20 transition-colors"
                    >
                      {/* Name columns */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm?.name || ""}
                            onChange={(e) =>
                              setEditForm((prev) => (prev ? { ...prev, name: e.target.value } : null))
                            }
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-full"
                          />
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-white">{st.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {st.id}</span>
                          </div>
                        )}
                      </td>

                      {/* Role column */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={editForm?.role || ""}
                              onChange={(e) =>
                                setEditForm((prev) => (prev ? { ...prev, role: e.target.value } : null))
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-full font-medium"
                            />
                            <div className="flex gap-1">
                              {["CS", "KAPTEN", "KASIR"].map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() =>
                                    setEditForm((prev) => (prev ? { ...prev, role: tag } : null))
                                  }
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 hover:bg-amber-500/10 text-amber-500 hover:text-amber-400 border border-slate-800/60 hover:border-amber-500/30 font-extrabold transition-all active:scale-95 cursor-pointer"
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">{st.role}</span>
                        )}
                      </td>

                      {/* Login Credentials & Role column */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="space-y-1.5 min-w-[200px]">
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="Username"
                                value={editForm?.username || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => (prev ? { ...prev, username: e.target.value } : null))
                                }
                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 w-1/2 placeholder-slate-600 font-mono"
                              />
                              <input
                                type="text"
                                placeholder="Sandi"
                                value={editForm?.password || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => (prev ? { ...prev, password: e.target.value } : null))
                                }
                                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 w-1/2 placeholder-slate-600 font-mono"
                              />
                            </div>
                            <select
                              value={editForm?.loginRole || "STAFF"}
                              onChange={(e) =>
                                setEditForm((prev) =>
                                  prev ? { ...prev, loginRole: e.target.value as "ADMIN" | "STAFF" } : null
                                )
                              }
                              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500 w-full font-semibold"
                            >
                              <option value="STAFF">🧑‍💼 STAF PORTAL</option>
                              <option value="ADMIN">👑 MASTER ADMIN</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 text-[11px] min-w-[160px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-500">User:</span>
                              <span className="font-bold text-amber-400 font-mono">
                                {st.username || st.name.toLowerCase().split(" ")[0]}
                              </span>
                              <span className="font-mono text-slate-500">Pass:</span>
                              <span className="font-mono text-slate-300">
                                {st.password || "staff123"}
                              </span>
                            </div>
                            <div className="flex items-center">
                              {st.loginRole === "ADMIN" ? (
                                <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider animate-fadeIn">
                                  👑 ADMIN MASTER
                                </span>
                              ) : (
                                <span className="text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  🧑‍💼 STAF PORTAL
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Shift dropdown modification column */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editForm?.shift || "Pagi"}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, shift: e.target.value as "Pagi" | "Siang" | "Malam" | "Bebas" } : null
                              )
                            }
                            className="bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-full"
                          >
                            <option value="Pagi">Pagi</option>
                            <option value="Siang">Siang</option>
                            <option value="Malam">Malam</option>
                            <option value="Bebas">Bebas</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={currentTempShift}
                              onChange={(e) =>
                                handleTempShiftChange(st.id, e.target.value as "Pagi" | "Siang" | "Malam" | "Bebas")
                              }
                              className={`bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 ${
                                currentTempShift !== st.shift ? "border-amber-500 text-amber-400 font-bold" : "text-slate-300"
                              }`}
                            >
                              <option value="Pagi">🌅 Pagi</option>
                              <option value="Siang">🌇 Siang</option>
                              <option value="Malam">🌃 Malam</option>
                              <option value="Bebas">🌟 Bebas</option>
                            </select>
                            {currentTempShift !== st.shift && (
                              <span className="text-[10px] text-amber-500 font-medium animate-pulse">
                                Belum disimpan
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Active Status toggler */}
                      <td className="py-3.5 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editForm?.isActive ?? false}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, isActive: e.target.checked } : null
                              )
                            }
                            className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                          />
                        ) : (
                          <button
                            onClick={() => onUpdateStaff({ ...st, isActive: !st.isActive })}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors inline-block ${
                              st.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                            }`}
                          >
                            {st.isActive ? "Aktif" : "Non-Aktif"}
                          </button>
                        )}
                      </td>

                      {/* Actions columns */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded transition-colors"
                                title="Simpan Perubahan"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded transition-colors"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(st)}
                                className="bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white p-1 rounded transition-colors"
                                title="Edit Staff"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setCustomConfirm({
                                    title: "Hapus Data Staff",
                                    message: `Apakah Anda yakin ingin menghapus staff "${st.name}" secara permanen dari daftar shifting? Tindakan ini tidak dapat dibatalkan.`,
                                    onConfirm: () => {
                                      onDeleteStaff(st.id);
                                      setCustomConfirm(null);
                                      setCustomAlert({
                                        title: "Data Dihapus",
                                        message: `Staff "${st.name}" berhasil dihapus dari sistem.`,
                                        isSuccess: true,
                                      });
                                    }
                                  });
                                }}
                                className="bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 p-1 rounded transition-colors"
                                title="Hapus Staff"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-2.5">
        <BadgeInfo className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <span className="text-[11px] text-slate-400 leading-relaxed">
          <strong>Petunjuk Pengaturan Shift:</strong> Anda dapat mengganti shift masing-masing staff secara langsung menggunakan dropdown di baris tabel, kemudian klik tombol <strong>Simpan Perubahan Shift</strong> untuk mengonfirmasi perubahan massal tersebut.
        </span>
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
              {customConfirm.isDanger !== false ? (
                <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{customConfirm.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">{customConfirm.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCustomConfirm(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={customConfirm.onConfirm}
                className={`font-bold text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  customConfirm.isDanger !== false
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                }`}
              >
                {customConfirm.confirmLabel || "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
