import React, { useState, useEffect } from "react";
import { Staff, Jobdes, HistoryRecord } from "../types";
import { ShieldCheck, UserCheck, CalendarCheck, Clock, Bookmark, ListChecks, Lock, Key, Eye, EyeOff } from "lucide-react";

interface StaffScheduleViewProps {
  staffs: Staff[];
  historyRecords: HistoryRecord[];
  loggedInStaffId?: string | null;
  onUpdateStaff?: (updatedStaff: Staff) => void;
  onReportSubmitted?: () => void;
}

export default function StaffScheduleView({ staffs, historyRecords, loggedInStaffId, onUpdateStaff, onReportSubmitted }: StaffScheduleViewProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  
  // Credentials edit state
  const [isEditCredentialsOpen, setIsEditCredentialsOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [credError, setCredError] = useState("");
  const [credSuccess, setCredSuccess] = useState("");

  const [submittedKeys, setSubmittedKeys] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("staff_submitted_reports_v1");
      const parsed = raw ? JSON.parse(raw) : {};
      
      // Automatic daily reset: Filter out any keys that are not from today
      const todayStr = new Date().toISOString().slice(0, 10);
      const filtered: Record<string, boolean> = {};
      let changed = false;
      
      Object.keys(parsed).forEach((key) => {
        const parts = key.split("_");
        // Key is formatted as: staffId_YYYY-MM-DD
        if (parts.length === 2 && parts[1] === todayStr) {
          filtered[key] = parsed[key];
        } else {
          changed = true;
        }
      });
      
      if (changed) {
        localStorage.setItem("staff_submitted_reports_v1", JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return {};
    }
  });

  // Also run an effect to verify and clean on mount, in case the date changes while app is open
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setSubmittedKeys((prev) => {
      const filtered: Record<string, boolean> = {};
      let changed = false;
      Object.keys(prev).forEach((key) => {
        const parts = key.split("_");
        if (parts.length === 2 && parts[1] === todayStr) {
          filtered[key] = prev[key];
        } else {
          changed = true;
        }
      });
      if (changed) {
        try {
          localStorage.setItem("staff_submitted_reports_v1", JSON.stringify(filtered));
        } catch (e) {
          console.error(e);
        }
        return filtered;
      }
      return prev;
    });
  }, []);

  const activeStaffId = loggedInStaffId || selectedStaffId;
  const activeStaff = staffs.find((s) => s.id === activeStaffId);

  // Sync edit credential inputs when activeStaff shifts
  useEffect(() => {
    if (activeStaff) {
      setNewUsername(activeStaff.username || activeStaff.name.toLowerCase().split(" ")[0]);
      setNewPassword(activeStaff.password || "staff123");
      setCredError("");
      setCredSuccess("");
    }
  }, [activeStaffId, staffs]);

  // Find latest assignments for this staff members if any in history
  const findStaffLatestAssignments = () => {
    if (!activeStaff) return null;

    // Search from latest to oldest record
    for (const record of historyRecords) {
      const match = record.assignments.filter(
        (asg) => asg.staffName.toLowerCase() === activeStaff.name.toLowerCase()
      );
      if (match.length > 0) {
        return {
          recordDate: record.date,
          recordTime: record.time,
          recordShift: record.shift,
          jobs: match.map((m) => m.jobdesTitle),
        };
      }
    }
    return null;
  };

  const latestAssignment = findStaffLatestAssignments();

  const submissionKey = activeStaff && latestAssignment
    ? `${activeStaff.id}_${latestAssignment.recordDate}`
    : null;

  const isSubmitted = !!(submissionKey && submittedKeys[submissionKey]);

  const handleToggleCheck = (jobTitle: string) => {
    if (isSubmitted) return;
    setChecklistState((prev) => ({
      ...prev,
      [jobTitle]: !prev[jobTitle],
    }));
  };

  const handleCheckAllToggle = () => {
    if (isSubmitted) return;
    if (!latestAssignment) return;
    const allDone = latestAssignment.jobs.every((job) => !!checklistState[job]);
    const newState: Record<string, boolean> = {};
    latestAssignment.jobs.forEach((job) => {
      newState[job] = !allDone;
    });
    setChecklistState(newState);
  };

  const handleSendReport = () => {
    if (!latestAssignment || !submissionKey) return;
    
    // Automatically force all tasks of this report to be true/DONE
    const forcedState = { ...checklistState };
    latestAssignment.jobs.forEach((job) => {
      forcedState[job] = true;
    });
    setChecklistState(forcedState);

    // Save submission key to local storage so it locks down
    const updatedKeys = { ...submittedKeys, [submissionKey]: true };
    setSubmittedKeys(updatedKeys);
    try {
      localStorage.setItem("staff_submitted_reports_v1", JSON.stringify(updatedKeys));
    } catch (e) {
      console.error(e);
    }

    setShowSuccessAlert(true);
    if (onReportSubmitted) {
      onReportSubmitted();
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCredError("");
    setCredSuccess("");

    if (!activeStaff) return;
    const cleanUser = newUsername.trim().toLowerCase();
    const cleanPass = newPassword.trim();

    if (!cleanUser) {
      setCredError("Username tidak boleh kosong.");
      return;
    }
    if (cleanUser.length < 3) {
      setCredError("Username minimal terdiri dari 3 karakter.");
      return;
    }
    if (!cleanPass) {
      setCredError("Sandi/Password tidak boleh kosong.");
      return;
    }
    if (cleanPass.length < 4) {
      setCredError("Password minimal terdiri dari 4 karakter.");
      return;
    }

    // Check conflict against list of registered staffs' usernames
    const isConflict = staffs.some(
      (s) => s.id !== activeStaff.id && 
             (s.username || s.name.toLowerCase().split(" ")[0]).trim().toLowerCase() === cleanUser
    );

    if (isConflict) {
      setCredError("Username ini sudah digunakan oleh staf lain. Silakan pakai yang lain!");
      return;
    }

    // Trigger update
    if (onUpdateStaff) {
      onUpdateStaff({
        ...activeStaff,
        username: cleanUser,
        password: cleanPass
      });
      setCredSuccess("Berhasil! Username dan sandi Anda telah sukses diperbarui.");
      
      // Auto close after 1.5 seconds
      setTimeout(() => {
        setIsEditCredentialsOpen(false);
        setCredSuccess("");
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector Area */}
      {!loggedInStaffId ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            <h2 className="text-base font-bold text-white">👤 Ruang Kerja Staf</h2>
          </div>

          <div className="max-w-md">
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Silahkan Pilih Nama Anda untuk Melihat Shift & Jobdesk:
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                setChecklistState({}); // reset checks
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
            >
              <option value="">-- Pilih Nama Anda --</option>
              {staffs
                .filter((s) => s.isActive)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role} - Shift {s.shift})
                  </option>
                ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-950/30 border border-indigo-500/15 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                Sesi Staf Aktif: {activeStaff?.name}
              </p>
              <p className="text-[10px] text-indigo-300">
                Data divalidasi dengan sandi pengaman - Shift {activeStaff?.shift} harian.
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-bold uppercase">
            Terverifikasi
          </span>
        </div>
      )}

      {activeStaff ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {/* Staff Roster Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" /> Profil & Shifting Anda
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Nama</span>
                <span className="text-sm font-bold text-white block">{activeStaff.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Jabatan</span>
                <span className="text-xs text-slate-300 block">{activeStaff.role}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Jadwal Shift</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded border mt-1 ${
                  activeStaff.shift === "Bebas"
                    ? "text-emerald-400 bg-emerald-400/5 border-emerald-400/15"
                    : "text-amber-400 bg-amber-400/5 border-amber-400/15"
                }`}>
                  {activeStaff.shift === "Bebas" ? "🌟" : "🌅"} Shift {activeStaff.shift}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Status</span>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/15 mt-1 font-semibold">
                  Aktif
                </span>
              </div>
              
              <div className="pt-3.5 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditCredentialsOpen(true);
                    setCredError("");
                    setCredSuccess("");
                  }}
                  className="w-full bg-amber-500/5 hover:bg-amber-500/15 text-amber-300 hover:text-amber-200 border border-amber-500/20 hover:border-amber-500/40 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-sm shadow-amber-950/20"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Ganti Username & Sandi
                </button>
              </div>
            </div>
          </div>

          {/* Assigned Tasks Module */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-400" /> Jobdesk Teracak Hari Ini
              </h3>

              {latestAssignment ? (
                <div className="space-y-4 mt-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      Disinkronkan terakhir harian: <strong>{latestAssignment.recordDate}</strong> (pukul {latestAssignment.recordTime} WIB)
                    </span>
                    <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Sinkron Roster
                    </span>
                  </div>

                  {/* Checklist style */}
                  <div className="space-y-2.5">
                    {isSubmitted ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/25">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <p className="text-xs font-extrabold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5">
                            🔒 LAPORAN TERKIRIM - SEMUA DONE
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          (Semua Done & Tidak Ada Pembatalan Laporan)
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                        <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                          <ListChecks className="w-4 h-4 text-emerald-400" /> Centang item atau klik tombol Done setelah selesai:
                        </p>
                        <button
                          type="button"
                          onClick={handleCheckAllToggle}
                          className="text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ml-auto"
                        >
                          {latestAssignment.jobs.every((job) => !!checklistState[job]) ? "🔓 Batalkan Semua" : "✨ Tandai Semua Selesai (Done)"}
                        </button>
                      </div>
                    )}

                    {latestAssignment.jobs.map((job, idx) => {
                      const isCompleted = isSubmitted ? true : !!checklistState[job];
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleCheck(job)}
                          className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 select-none ${
                            isCompleted
                              ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300 shadow-inner shadow-emerald-500/5"
                              : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200"
                          } ${isSubmitted ? "opacity-90 cursor-not-allowed select-none" : "cursor-pointer"}`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              disabled={isSubmitted}
                              onChange={() => {}} // handled by div click
                              className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0 mt-0.5 cursor-pointer disabled:opacity-60"
                            />
                            <div className="space-y-1">
                              <span className={`text-xs font-bold leading-normal block ${isCompleted ? "line-through text-slate-500 decoration-slate-600" : ""}`}>
                                {job}
                              </span>
                            </div>
                          </div>

                          {/* Instant click done badge */}
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <span className="text-[9px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-md flex items-center gap-1">
                                Selesai Checked ✅
                              </span>
                            ) : (
                              <span className="text-[9px] uppercase font-bold bg-slate-900 text-slate-400 group-hover:text-white border border-slate-800 px-2 py-1 rounded-md hover:bg-slate-800 hover:border-slate-700 transition-all">
                                Tandai Done
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 my-4 text-slate-500 space-y-1.5">
                  <Bookmark className="w-6 h-6 mx-auto text-slate-600" />
                  <p className="text-xs font-medium">Belum ada tugas teracak untuk Anda di shift ini harian.</p>
                  <p className="text-[10px] text-slate-600">Hubungi Admin untuk memicu tombol instan "ACAKKAN JOBDES" terlebih dahulu.</p>
                </div>
              )}
            </div>

            {/* Checklist Completion Status & Submit Action */}
            {latestAssignment && latestAssignment.jobs.length > 0 && (
              <div className="space-y-3 mt-4 pt-4 border-t border-slate-800/80">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Progress Checklist Tugas</span>
                  <span className="text-xs font-black text-white">
                    {isSubmitted ? latestAssignment.jobs.length : Object.values(checklistState).filter(Boolean).length} / {latestAssignment.jobs.length} Selesai Checked
                  </span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                    style={{
                      width: isSubmitted ? "100%" : `${(Object.values(checklistState).filter(Boolean).length / latestAssignment.jobs.length) * 100}%`,
                    }}
                  />
                </div>

                {isSubmitted ? (
                  <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-emerald-500/20 rounded-xl p-4 text-center space-y-1.5 shadow-xl">
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                      🎉 LAPORAN DIKIRIM (SEMUA SELESAI DONE)
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Laporan kerja shift Anda harian sudah tersinkronisasi 100% dan dikunci. Tidak ada pembatalan / edit diizinkan.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendReport}
                    disabled={Object.values(checklistState).filter(Boolean).length === 0}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xl active:scale-[0.98] ${
                      Object.values(checklistState).filter(Boolean).length === latestAssignment.jobs.length
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10 cursor-pointer"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10 cursor-pointer"
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {Object.values(checklistState).filter(Boolean).length === latestAssignment.jobs.length
                      ? "KIRIM LAPORAN KERJA (SEMUA SELESAI)"
                      : `KIRIM LAPORAN BARU (${Object.values(checklistState).filter(Boolean).length} TUGAS SELESAI)`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 p-12 text-center rounded-xl text-slate-500 space-y-1.5">
          <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold">Silahkan pilih nama Anda pada menu dropdown di atas.</p>
          <p className="text-xs">Informasi shift kerja serta tugas pengecekan acak akan ditampilkan otomatis.</p>
        </div>
      )}

      {/* Modern custom success modal celebration */}
      {showSuccessAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-slate-900 border border-emerald-500/20 max-w-sm w-full rounded-2xl p-6 shadow-2xl relative space-y-5 text-center">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h4 className="text-md font-black text-white uppercase tracking-wide">
                Laporan Berhasil Terkirim!
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Terima kasih, <strong className="text-white font-extrabold">{activeStaff?.name}</strong>. Pekerjaan / checklist Anda hari ini berhasil divalidasi dan disinkronkan ke server pusat.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1 text-center">
              <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-wider">Status Laporan</span>
              <span className="text-sm font-mono font-black text-white">
                {Object.values(checklistState).filter(Boolean).length} / {latestAssignment?.jobs.length} Tugas Checked ✅
              </span>
            </div>

            <button
              onClick={() => setShowSuccessAlert(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/20 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Tutup & Sisi Log out
            </button>
          </div>
        </div>
      )}

      {/* Modern Credentials Edit Modal */}
      {isEditCredentialsOpen && activeStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fadeIn p-4">
          <div className="bg-slate-900 border border-amber-500/10 max-w-sm w-full rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-9 h-9 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wide">
                  Ganti Akses Akun
                </h4>
                <p className="text-[10px] text-slate-400">
                  Ubah Username & Sandi Masuk harian Anda.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">
                  Nama Staf (Tetap)
                </label>
                <input
                  type="text"
                  disabled
                  value={activeStaff.name}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed select-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-amber-400 font-bold uppercase mb-1">
                  Username Akun Baru *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-[11px] text-slate-500 select-none">@</span>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      if (credError) setCredError("");
                    }}
                    placeholder="Masukkan username baru..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold tracking-wide"
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">
                  Digunakan staf untuk login ke dashboard mandiri.
                </p>
              </div>

              <div>
                <label className="block text-[10px] text-amber-400 font-bold uppercase mb-1">
                  Sandi / Password Baru *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (credError) setCredError("");
                    }}
                    placeholder="Sandi pengaman atau kode pin harian..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono text-amber-100 placeholder:font-sans placeholder:text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {credError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/15 text-rose-400 rounded-xl text-[10px] leading-relaxed font-semibold">
                  ⚠️ {credError}
                </div>
              )}

              {credSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 rounded-xl text-[10px] leading-relaxed font-bold animate-pulse">
                  ✅ {credSuccess}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditCredentialsOpen(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl border border-slate-800 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!!credSuccess}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-colors uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
