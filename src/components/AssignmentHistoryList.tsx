import { useState } from "react";
import { FileSpreadsheet, Trash2, Calendar, Clock, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { HistoryRecord, Staff } from "../types";

interface AssignmentHistoryListProps {
  historyRecords: HistoryRecord[];
  staffs: Staff[];
  onDeleteRecord: (id: string) => void;
  onClearAllHistory: () => void;
}

export default function AssignmentHistoryList({
  historyRecords,
  staffs,
  onDeleteRecord,
  onClearAllHistory,
}: AssignmentHistoryListProps) {
  const [filterShift, setFilterShift] = useState<"Semua" | "Pagi" | "Siang" | "Malam" | "Bebas">("Semua");
  const [submittedKeys] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("staff_submitted_reports_v1");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

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

  const filteredRecords = historyRecords.filter((rec) => {
    if (filterShift === "Semua") return true;
    return rec.shift === filterShift;
  });

  const getShiftLabelColor = (sh: "Pagi" | "Siang" | "Malam" | "Bebas") => {
    switch (sh) {
      case "Pagi":
        return "bg-amber-400/10 text-amber-400 border border-amber-400/20";
      case "Siang":
        return "bg-orange-400/10 text-orange-400 border border-orange-400/20";
      case "Malam":
        return "bg-sky-400/10 text-sky-400 border border-sky-400/20";
      case "Bebas":
        return "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20";
    }
  };

  const handleExportAllToCSV = () => {
    if (historyRecords.length === 0) {
      setCustomAlert({
        title: "Export Gagal",
        message: "Riwayat Anda masih kosong, tidak ada data penugasan untuk diexport ke CSV saat ini.",
      });
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += "Tanggal,Jam,Shift,Nama Staff,Tugas Pengecekan\n";

    historyRecords.forEach((record) => {
      record.assignments.forEach((asg) => {
        const cleanName = asg.staffName.replace(/"/g, '""');
        const cleanJob = asg.jobdesTitle.replace(/"/g, '""');
        csvContent += `"${record.date}","${record.time}","${record.shift}","${cleanName}","${cleanJob}"\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `Riwayat_Pengecekan_Lengkap_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner controller */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📊 Riwayat Pengacakan & Hasil Pengecekan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Data rekam medis penugasan tugas yang pernah digenerate oleh sistem diurutkan dari terbaru.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter dropdown */}
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
          >
            <option value="Semua">Semua Shift</option>
            <option value="Pagi">🌅 Shift Pagi</option>
            <option value="Siang">🌇 Shift Siang</option>
            <option value="Malam">🌃 Shift Malam</option>
            <option value="Bebas">🌟 Shift Bebas</option>
          </select>

          {/* Export general CSV */}
          <button
            onClick={handleExportAllToCSV}
            className="bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel (CSV)
          </button>

          {/* Destroy history log */}
          <button
            onClick={() => {
              setCustomConfirm({
                title: "Hapus Semua Riwayat",
                message: "Apakah Anda yakin ingin MENGHAPUS SELURUH DAFTAR RIWAYAT pengacakan? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.",
                onConfirm: () => {
                  onClearAllHistory();
                  setCustomConfirm(null);
                  setCustomAlert({
                    title: "Riwayat Dikosongkan",
                    message: "Seluruh rekam medis logs riwayat shift berhasil dihapus.",
                    isSuccess: true,
                  });
                }
              });
            }}
            className="bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Hapus Riwayat
          </button>
        </div>
      </div>

      {/* Main Database Logs Grid */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
            <RotateCcw className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm">Tidak ada riwayat untuk filter atau database kosong.</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md hover:border-slate-700 transition-colors"
            >
              {/* Header block for log */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" /> {record.date}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> {record.time} WIB
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest ${getShiftLabelColor(
                      record.shift
                    )}`}
                  >
                    SHIFT {record.shift}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCustomConfirm({
                      title: "Hapus Record ini",
                      message: `Apakah Anda yakin ingin menghapus catatan log penugasan shift ${record.shift} tanggal ${record.date} ini?`,
                      onConfirm: () => {
                        onDeleteRecord(record.id);
                        setCustomConfirm(null);
                        setCustomAlert({
                          title: "Catatan Dihapus",
                          message: "Log pengacakan tunggal berhasil dihapus.",
                          isSuccess: true,
                        });
                      }
                    });
                  }}
                  className="text-slate-500 hover:text-rose-400 font-semibold text-xs flex items-center gap-1 self-start sm:self-auto transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Record ini
                </button>
              </div>

              {/* Rows assigned */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/50 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      <th className="py-2 px-3">Nama Staff</th>
                      <th className="py-2 px-3">Jobdes Teracak yang Diemban</th>
                      <th className="py-2 px-3 text-right">Status Laporan Kerja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {record.assignments.map((asg, index) => {
                      const matchedStaff = staffs.find(
                        (s) => s.name.toLowerCase() === asg.staffName.toLowerCase()
                      );
                      const staffId = matchedStaff ? matchedStaff.id : "";
                      const submissionKey = `${staffId}_${record.date}`;
                      const hasSubmitted = !!(staffId && submittedKeys[submissionKey]);

                      return (
                        <tr key={index} className="hover:bg-slate-950/10">
                          <td className="py-2.5 px-3 text-xs font-semibold text-white">
                            🧑‍💼 {asg.staffName}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-300">
                            {asg.jobdesTitle}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-right">
                            {hasSubmitted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5 animate-pulse">
                                Done Checked ✅
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-950 text-slate-500 border border-slate-800">
                                Belum Lapor ⏳
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
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
