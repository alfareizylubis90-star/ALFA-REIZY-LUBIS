import React, { useState, useRef } from "react";
import { Shuffle, Copy, Printer, FileDown, RefreshCw, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { Staff, Jobdes, Assignment, HistoryRecord } from "../types";

interface RandomizerEngineProps {
  staffs: Staff[];
  jobdesList: Jobdes[];
  historyRecords: HistoryRecord[];
  onAddNewHistory: (shift: "Pagi" | "Siang" | "Malam" | "Bebas", assignments: Assignment[]) => void;
  
  wantedCounts: Record<"Pagi" | "Siang" | "Malam" | "Bebas", number>;
  setWantedCounts: React.Dispatch<React.SetStateAction<Record<"Pagi" | "Siang" | "Malam" | "Bebas", number>>>;
  currentAssignments: Assignment[];
  setCurrentAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  
  autoUpdateEnabled: boolean;
  setAutoUpdateEnabled: (val: boolean) => void;
  autoUpdateTime: string;
  setAutoUpdateTime: (val: string) => void;
  
  runRandomization: (manual: boolean, customWantedCounts?: any) => { success: boolean; message: string; errorTitle?: string; errorMessage?: string; data?: Assignment[] };
  handleResetWeeklyRotation: () => void;
}

export default function RandomizerEngine({
  staffs,
  jobdesList,
  historyRecords,
  onAddNewHistory,
  wantedCounts,
  setWantedCounts,
  currentAssignments,
  setCurrentAssignments,
  autoUpdateEnabled,
  setAutoUpdateEnabled,
  autoUpdateTime,
  setAutoUpdateTime,
  runRandomization,
  handleResetWeeklyRotation,
}: RandomizerEngineProps) {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"SEMUA" | "KASIR" | "CS" | "KAPTEN">("KASIR");
  const [isRolling, setIsRolling] = useState(false);
  const [rollFeedback, setRollFeedback] = useState<string>("");
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string; isSuccess?: boolean } | null>(null);
  const [showSchedulerConfig, setShowSchedulerConfig] = useState<boolean>(false);
  
  // Ref for print view container mapping
  const printAreaRef = useRef<HTMLDivElement>(null);

  const saveWantedCounts = (newCounts: Record<"Pagi" | "Siang" | "Malam" | "Bebas", number>) => {
    setWantedCounts(newCounts);
  };

  const getCandidatesForShift = (sh: "Pagi" | "Siang" | "Malam" | "Bebas") => {
    return staffs.filter((s) => {
      if (!s.isActive || s.shift !== sh) return false;
      if (selectedRoleFilter === "SEMUA") return true;
      return s.role.trim().toUpperCase() === selectedRoleFilter;
    });
  };

  const handleAcakJobdes = (customCounts = wantedCounts) => {
    setIsRolling(true);
    setRollFeedback("Sistem sedang mengacak pembagian tugas secara adil...");
    setCustomAlert(null);

    // Simulate realistic rolling animation and call central function
    setTimeout(() => {
      const res = runRandomization(true, customCounts);
      setIsRolling(false);
      if (!res.success) {
        setCustomAlert({
          title: res.errorTitle || "Gagal Mengacak",
          message: res.errorMessage || res.message,
        });
        setRollFeedback("");
      } else {
        setRollFeedback(res.message);
      }
    }, 1000);
  };

  const copyToClipboard = () => {
    if (currentAssignments.length === 0) return;

    const todayStr = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const activeShiftsLabel = (Object.entries(wantedCounts) as Array<[string, number]>)
      .filter(([_, c]) => c > 0)
      .map(([sh]) => sh)
      .join(" + ") || "Bebas";

    let text = `📋 *HASIL ACAKAN JOBDES HP & AREA - SHIFT ${activeShiftsLabel.toUpperCase()} (${selectedRoleFilter.toUpperCase()})*\n`;
    text += `📅 Tanggal: ${todayStr}\n`;
    text += `⏰ Waktu Acak: ${new Date().toLocaleTimeString("id-ID")} WIB\n`;
    text += `═══════════════════════════════════\n\n`;

    // Group by staff and sort by shift chronology
    const copyGroupedList: { staffName: string; staffShift: "Pagi" | "Siang" | "Malam" | "Bebas"; jobs: string[] }[] = [];
    currentAssignments.forEach((asg) => {
      let existing = copyGroupedList.find((g) => g.staffName === asg.staffName);
      if (!existing) {
        existing = {
          staffName: asg.staffName,
          staffShift: asg.staffShift,
          jobs: []
        };
        copyGroupedList.push(existing);
      }
      existing.jobs.push(asg.jobdesTitle);
    });

    const priorityOrder: Record<"Pagi" | "Siang" | "Malam" | "Bebas", number> = {
      Pagi: 1,
      Siang: 2,
      Malam: 3,
      Bebas: 4,
    };

    copyGroupedList.sort((a, b) => {
      const diff = priorityOrder[a.staffShift] - priorityOrder[b.staffShift];
      if (diff !== 0) return diff;
      return a.staffName.localeCompare(b.staffName);
    });

    copyGroupedList.forEach((group, idx) => {
      const emoji = group.staffShift === "Pagi" ? "🌅" : group.staffShift === "Siang" ? "🌇" : group.staffShift === "Malam" ? "🌃" : "🌟";
      text += `${idx + 1}. *${group.staffName}* [${emoji} Shift ${group.staffShift}]\n`;
      group.jobs.forEach((job) => {
        text += `   ↳ ✅ ${job}\n`;
      });
      text += `\n`;
    });

    text += `═══════════════════════════════════\n`;
    text += `_Sistem Acak Otomatis Shift HP & Staf_`;

    navigator.clipboard.writeText(text);
    setCustomAlert({
      title: "Salin Berhasil",
      message: "Hasil acakan shift kerja telah rapi disalin ke clipboard Anda! Siap dikirim ke grup WhatsApp / Telegram.",
      isSuccess: true,
    });
  };

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const styleBlock = `
      <style>
        body { background: white !important; color: black !important; font-family: 'Inter', sans-serif; padding: 20px; }
        .print-title { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .print-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .print-table th, .print-table td { border: 1px solid #000; padding: 10px; text-align: left; }
        .print-table th { background-color: #f2f2f2; }
        .no-print { display: none !important; }
      </style>
    `;

    const activeShiftsLabel = (Object.entries(wantedCounts) as Array<[string, number]>)
      .filter(([_, c]) => c > 0)
      .map(([sh]) => sh)
      .join("_") || "Bebas";

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak Jobdesk Shifting - ${activeShiftsLabel}</title>
            ${styleBlock}
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const exportToCSV = () => {
    if (currentAssignments.length === 0) return;

    const activeShiftsLabel = (Object.entries(wantedCounts) as Array<[string, number]>)
      .filter(([_, c]) => c > 0)
      .map(([sh]) => sh)
      .join("_") || "Bebas";

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Nama Staff,Shift,Tugas Pengecekan\n";

    const csvPriorityOrder: Record<"Pagi" | "Siang" | "Malam" | "Bebas", number> = {
      Pagi: 1,
      Siang: 2,
      Malam: 3,
      Bebas: 4,
    };

    const sortedAssignmentsForCSV = [...currentAssignments].sort((a, b) => {
      const diff = csvPriorityOrder[a.staffShift] - csvPriorityOrder[b.staffShift];
      if (diff !== 0) return diff;
      return a.staffName.localeCompare(b.staffName);
    });

    sortedAssignmentsForCSV.forEach((asg, index) => {
      // Escape commas & quotes
      const cleanName = asg.staffName.replace(/"/g, '""');
      const cleanTitle = asg.jobdesTitle.replace(/"/g, '""');
      csvContent += `${index + 1},"${cleanName}","${asg.staffShift}","${cleanTitle}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `Jobdes_Acak_${activeShiftsLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group current assignments by staff name and shift, sorted by shift chronology
  interface GroupedAssignment {
    staffName: string;
    staffShift: "Pagi" | "Siang" | "Malam" | "Bebas";
    jobs: string[];
  }
  
  const groupedAssignmentsList: GroupedAssignment[] = [];
  currentAssignments.forEach((asg) => {
    let existing = groupedAssignmentsList.find((g) => g.staffName === asg.staffName);
    if (!existing) {
      existing = {
        staffName: asg.staffName,
        staffShift: asg.staffShift,
        jobs: []
      };
      groupedAssignmentsList.push(existing);
    }
    existing.jobs.push(asg.jobdesTitle);
  });

  const shiftOrder: Record<"Pagi" | "Siang" | "Malam" | "Bebas", number> = {
    Pagi: 1,
    Siang: 2,
    Malam: 3,
    Bebas: 4,
  };

  groupedAssignmentsList.sort((a, b) => {
    const diff = shiftOrder[a.staffShift] - shiftOrder[b.staffShift];
    if (diff !== 0) return diff;
    return a.staffName.localeCompare(b.staffName);
  });

  const totalCountToSelect = (Object.values(wantedCounts) as number[]).reduce((a, b) => a + b, 0);
  const activeDemandsLabel = (Object.entries(wantedCounts) as Array<[string, number]>)
    .filter(([_, count]) => count > 0)
    .map(([sh, count]) => `${sh} (${count} org)`)
    .join(", ");

  return (
    <div className="space-y-6">
      {/* Configuration & Trigger Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          ⚡ Setup Pengacakan Shift HP & Staf
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Tentukan jumlah staf berkategori <span className="text-blue-400 font-bold">KASIR AKTIF</span> yang akan dipilih secara rotasi adil dari masing-masing shift kerja:
        </p>

        {/* Multi-Shift allocation counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          {(["Pagi", "Siang", "Malam", "Bebas"] as const).map((sh) => {
            const countOfStaff = getCandidatesForShift(sh).length;
            const emoji = sh === "Pagi" ? "🌅" : sh === "Siang" ? "🌇" : sh === "Malam" ? "🌃" : "🌟";
            const currentCount = wantedCounts[sh];

            return (
              <div
                key={sh}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  currentCount > 0
                    ? "bg-gradient-to-r from-blue-950/40 to-slate-900 border-blue-500/50 shadow-md shadow-blue-500/5"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-400"
                }`}
              >
                <div>
                  <span className={`block text-xs font-black uppercase ${currentCount > 0 ? "text-white" : "text-slate-400"}`}>
                    {emoji} {sh}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                    Tersedia: {countOfStaff} aktif
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const val = Math.max(0, currentCount - 1);
                      saveWantedCounts({ ...wantedCounts, [sh]: val });
                    }}
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-black bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95 select-none"
                    title="Kurangi staf"
                  >
                    -
                  </button>
                  <span className={`w-5 text-center text-xs font-extrabold ${currentCount > 0 ? "text-amber-400 animate-pulse" : "text-slate-500"}`}>
                    {currentCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const val = Math.min(countOfStaff, currentCount + 1);
                      saveWantedCounts({ ...wantedCounts, [sh]: val });
                    }}
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-black bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95 select-none"
                    title="Tambah staf"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Automatic Scheduler Configuration Panel */}
        {showSchedulerConfig && (
          <div className="mt-4 p-5 bg-slate-950/80 border border-blue-500/30 rounded-xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  ⚙️ Pengaturan Penjadwalan Otomatis (Auto Update)
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Sistem otomatis mengacak ulang staf pengecekan setiap pergantian hari tanpa tombol manual
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSchedulerConfig(false)}
                className="text-xs text-slate-400 hover:text-white font-extrabold cursor-pointer"
              >
                Tutup [X]
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ON/OFF toggle & jam */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <div>
                    <span className="block text-xs font-bold text-slate-300">Auto Update Harian</span>
                    <span className="text-[10px] text-slate-500">Mulai sesi pengacakan otomatis saat berganti tanggal</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoUpdateEnabled}
                      onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <div>
                    <span className="block text-xs font-bold text-slate-300">Jam Pengacakan Otomatis</span>
                    <span className="text-[10px] text-slate-500">Kapan pengacakan otomatis dijalankan (Default 00:00)</span>
                  </div>
                  <input
                    type="time"
                    value={autoUpdateTime}
                    onChange={(e) => setAutoUpdateTime(e.target.value)}
                    className="bg-slate-950 text-amber-400 font-mono font-bold text-sm border border-slate-800 rounded p-1 px-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Reset Weekly & rotation summary information */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="block text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
                    🔄 Reset Rotasi Kerja
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Menghapus riwayat acakan dan mereset giliran seluruh staf Kasir dari nol, memastikan putaran rotasi adil yang baru. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetWeeklyRotation}
                  className="w-full mt-3 py-2 bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-900/50 hover:border-rose-700 text-xs font-black rounded-lg transition-all active:scale-[0.98] cursor-pointer"
                >
                  RESET ROTASI SEKARANG
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-800/50 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
          {/* Quick info metrics bar */}
          <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex flex-col justify-center h-[54px]">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">
              Total Staf untuk Diacak
            </span>
            <span className="text-xs text-slate-200 font-bold mt-0.5 block flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              {totalCountToSelect} Staf Terpilih ({jobdesList.length} Jobdes)
            </span>
          </div>

          {/* Three master control action buttons requested in specification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-xl">
            {/* Acak Sekarang */}
            <button
              onClick={() => handleAcakJobdes()}
              disabled={isRolling}
              className={`py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20 cursor-pointer ${
                isRolling ? "opacity-75 cursor-wait" : ""
              }`}
            >
              <Shuffle className={`w-3.5 h-3.5 ${isRolling ? "animate-spin" : ""}`} />
              Acak Sekarang
            </button>

            {/* Acak Ulang */}
            <button
              onClick={() => handleAcakJobdes()}
              disabled={isRolling || currentAssignments.length === 0}
              className={`py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer ${
                isRolling ? "opacity-75 cursor-wait" : ""
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Acak Ulang
            </button>

            {/* Jadwalkan Otomatis */}
            <button
              onClick={() => setShowSchedulerConfig(!showSchedulerConfig)}
              className={`py-3 ${
                showSchedulerConfig 
                  ? "bg-blue-950 text-blue-400 border border-blue-500/40" 
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60"
              } font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer`}
            >
              <span className="text-amber-400">⚡</span>
              Jadwalkan Otomatis
            </button>
          </div>
        </div>
      </div>

      {/* Animation Status Row / Feedback */}
      {rollFeedback && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
          isRolling 
            ? "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse" 
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        }`}>
          {isRolling ? (
            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-semibold">{rollFeedback}</span>
        </div>
      )}

      {/* Results Workspace */}
      {currentAssignments.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-fadeIn">
          {/* Header Action Menu */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                ⚡ Hasil Pembagian Tugas - {activeDemandsLabel || "Semua"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Dihasilkan acak pada {new Date().toLocaleDateString("id-ID")}, pukul {new Date().toLocaleTimeString("id-ID")} WIB
              </p>
            </div>

            {/* Quick toolkit actions requested in specifications */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={handleAcakJobdes}
                disabled={isRolling}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Rerun / Acak Ulang"
              >
                <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Acak Ulang</span>
              </button>

              <button
                onClick={copyToClipboard}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Salin hasil pembagian tugas"
              >
                <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Copy Hasil</span>
              </button>

              <button
                onClick={exportToCSV}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Export data ke CSV/Excel"
              >
                <FileDown className="w-4 h-4" /> <span className="hidden sm:inline">Export Excel</span>
              </button>

              <button
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Cetak pembagian tugas"
              >
                <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Print Jobdes</span>
              </button>
            </div>
          </div>

          {/* Results grid */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedAssignmentsList.map((group, idx) => (
              <div
                key={group.staffName}
                className="bg-slate-950/70 p-4 rounded-xl border border-blue-500/10 hover:border-blue-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-50/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {group.staffName}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase bg-emerald-600/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      {group.staffShift === "Pagi" ? "🌅" : group.staffShift === "Siang" ? "🌇" : group.staffShift === "Malam" ? "🌃" : "🌟"} {group.staffShift}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {group.jobs.map((job, jIdx) => (
                      <li key={jIdx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-blue-500 mt-1 font-bold">✓</span>
                        <span className="leading-relaxed font-semibold">{job}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Secret Print Area */}
          <div className="hidden">
            <div ref={printAreaRef} className="p-8">
              <div className="text-center pb-4 mb-4" style={{ borderBottom: "2px solid #000" }}>
                <h1 style={{ margin: "0 0 5px 0", fontSize: "20px" }}>LAPORAN PEMBAGIAN TUGAS DAN AREA PENGECAKAN</h1>
                <h3 style={{ margin: "0", fontSize: "14px", color: "#555" }}>
                  METODE PENGACAKAN: {activeDemandsLabel.toUpperCase()}
                </h3>
                <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#777" }}>
                  Tanggal Cetak: {new Date().toLocaleDateString("id-ID")} - Jam: {new Date().toLocaleTimeString("id-ID")} WIB
                </p>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f2f2f2" }}>
                    <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontSize: "12px" }}>No</th>
                    <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontSize: "12px" }}>Nama Staff</th>
                    <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontSize: "12px" }}>Shift</th>
                    <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", fontSize: "12px" }}>Tugas Jobdesk Yang Diemban</th>
                  </tr>
                </thead>
                <tbody>
                  {[...currentAssignments]
                    .sort((a, b) => {
                      const diff = shiftOrder[a.staffShift] - shiftOrder[b.staffShift];
                      if (diff !== 0) return diff;
                      return a.staffName.localeCompare(b.staffName);
                    })
                    .map((a, i) => (
                      <tr key={i}>
                        <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>{i + 1}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px", fontWeight: "bold" }}>{a.staffName}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>{a.staffShift}</td>
                        <td style={{ border: "1px solid #ddd", padding: "8px", fontSize: "12px" }}>{a.jobdesTitle}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", padding: "0 40px" }}>
                <div style={{ textAlign: "center", fontSize: "11px" }}>
                  <p>Disiapkan Oleh,</p>
                  <div style={{ height: "60px" }}></div>
                  <p style={{ fontStyle: "italic" }}>( Sistem Acak Otomatis )</p>
                </div>
                <div style={{ textAlign: "center", fontSize: "11px" }}>
                  <p>Disetujui Oleh,</p>
                  <div style={{ height: "60px" }}></div>
                  <p style={{ fontWeight: "bold" }}>( _____________________ )</p>
                  <p>Duty Supervisor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL (Iframe Safe) */}
      {customAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 mb-3">
              {customAlert.isSuccess ? (
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
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
    </div>
  );
}
