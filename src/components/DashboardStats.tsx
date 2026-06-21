import { Users, Sun, Sunset, Moon, ClipboardCheck, Calendar, Clock, RotateCcw } from "lucide-react";
import { Staff, Jobdes, HistoryRecord } from "../types";

interface DashboardStatsProps {
  staffs: Staff[];
  jobdesList: Jobdes[];
  historyCountToday: number;
  historyRecords?: HistoryRecord[]; // optional for backward compatibility
  reportSubmitTrigger?: number;
}

export default function DashboardStats({ staffs, jobdesList, historyCountToday, historyRecords = [], reportSubmitTrigger }: DashboardStatsProps) {
  const activeStaffs = staffs.filter((s) => s.isActive);
  const pagiCount = activeStaffs.filter((s) => s.shift === "Pagi").length;
  const siangCount = activeStaffs.filter((s) => s.shift === "Siang").length;
  const malamCount = activeStaffs.filter((s) => s.shift === "Malam").length;

  const stats = [
    {
      id: "stat-active",
      title: "Total Staff Aktif",
      value: activeStaffs.length,
      subtext: `Dari total ${staffs.length} staff`,
      icon: Users,
      colorClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "stat-pagi",
      title: "Shift Pagi",
      value: pagiCount,
      subtext: "Shift Pagi",
      icon: Sun,
      colorClass: "text-amber-400",
      bgClass: "bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "stat-siang",
      title: "Shift Siang",
      value: siangCount,
      subtext: "Shift Siang",
      icon: Sunset,
      colorClass: "text-orange-400",
      bgClass: "bg-orange-500/10 border-orange-500/20",
    },
    {
      id: "stat-malam",
      title: "Shift Malam",
      value: malamCount,
      subtext: "Shift Malam",
      icon: Moon,
      colorClass: "text-sky-400",
      bgClass: "bg-sky-500/10 border-sky-500/20",
    },
    {
      id: "stat-jobdes",
      title: "Jobdes Aktif",
      value: jobdesList.length,
      subtext: `${historyCountToday} acakan tersimpan`,
      icon: ClipboardCheck,
      colorClass: "text-blue-400",
      bgClass: "bg-blue-500/10 border-blue-500/20",
    },
  ];

  const todayStr = new Date().toISOString().slice(0, 10);

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  // Parse today's and yesterday's latest assignments from history logs
  const todayRecord = historyRecords.find((r) => r.date === todayStr);
  const yesterdayRecord = historyRecords.find((r) => r.date === yesterdayStr);

  const todayAssignments = todayRecord ? todayRecord.assignments : [];
  const yesterdayAssignments = yesterdayRecord ? yesterdayRecord.assignments : [];

  // Load report submission state from local storage
  const submittedKeys = (() => {
    try {
      const saved = localStorage.getItem("staff_submitted_reports_v1");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })();

  const getStaffIdByName = (name: string) => {
    const found = staffs.find((s) => s.name.trim().toLowerCase() === name.trim().toLowerCase());
    return found ? found.id : null;
  };

  const isStaffSubmittedToday = (name: string) => {
    const id = getStaffIdByName(name);
    if (!id) return false;
    return !!submittedKeys[`${id}_${todayStr}`];
  };

  // Determine active shift progression: Pagi -> Siang -> Malam -> Bebas
  const shiftsOrdered = ["Pagi", "Siang", "Malam", "Bebas"] as const;

  const currentShiftStatus = shiftsOrdered.map((sh) => {
    const asgsInShift = todayAssignments.filter((asg) => {
      const shiftVal = asg.staffShift || staffs.find(s => s.name.trim().toLowerCase() === asg.staffName.trim().toLowerCase())?.shift || "Bebas";
      return shiftVal === sh;
    });

    const isAssigned = asgsInShift.length > 0;
    const isCompleted = isAssigned && asgsInShift.every((asg) => isStaffSubmittedToday(asg.staffName));

    return {
      shift: sh,
      isAssigned,
      isCompleted,
      assignments: asgsInShift,
    };
  });

  // Find the first assigned shift that is NOT fully completed yet
  const currentActiveShiftInfo = currentShiftStatus.find((info) => info.isAssigned && !info.isCompleted);

  let displayAssignments = todayAssignments;
  let activeShiftLabel = "Semua Shift";
  let isAllShiftsCompleted = false;

  if (todayAssignments.length > 0) {
    if (currentActiveShiftInfo) {
      displayAssignments = currentActiveShiftInfo.assignments;
      activeShiftLabel = `Shift ${currentActiveShiftInfo.shift}`;
    } else {
      isAllShiftsCompleted = true;
      activeShiftLabel = "Semua Selesai ✅";
      displayAssignments = todayAssignments; // Fallback to all today checkouts
    }
  }

  // Calculate rotation prioritisation list (Active KASIR who have the lowest turn counts)
  const activeKasirStaffs = staffs.filter((s) => s.isActive && s.role.trim().toUpperCase() === "KASIR");
  
  const rotationStats = activeKasirStaffs.map((staff) => {
    let turnsCount = 0;
    historyRecords.forEach((rec) => {
      const wasAssigned = rec.assignments.some(
        (asg) => asg.staffName.trim().toLowerCase() === staff.name.trim().toLowerCase()
      );
      if (wasAssigned) {
        turnsCount++;
      }
    });
    return { staff, turnsCount };
  });

  // Sort: lowest turnsCount first (meaning they are yet to receive their turn or have had the fewest turns)
  rotationStats.sort((a, b) => a.turnsCount - b.turnsCount);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={stat.id}
              id={stat.id}
              className={`p-4 rounded-xl border ${stat.bgClass} backdrop-blur-md flex flex-col justify-between transition-all hover:scale-[1.02] duration-300`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {stat.title}
                </span>
                <IconComponent className={`w-5 h-5 ${stat.colorClass}`} />
              </div>
              <div className="mt-4">
                <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {stat.value}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">{stat.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rotation Status Dashboard (Specification 9) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Column 1: Staf Terpilih Hari Ini */}
        <div id="selected-today-panel" className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Staf Terpilih Hari Ini
            </h2>
            <div className={`p-1 px-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider ${!isAllShiftsCompleted ? "animate-pulse" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
              {activeShiftLabel}
            </div>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {displayAssignments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                💤 Belum ada petugas teracak hari ini.
              </div>
            ) : (
              displayAssignments.map((asg, i) => {
                const shiftVal = asg.staffShift || "Bebas";
                const emoji = shiftVal === "Pagi" ? "🌅" : shiftVal === "Siang" ? "🌇" : shiftVal === "Malam" ? "🌃" : "🌟";
                const isSent = isStaffSubmittedToday(asg.staffName);
                return (
                  <div key={i} className={`p-2.5 bg-slate-950/80 border rounded-lg flex items-center justify-between text-xs transition-all ${isSent ? "border-emerald-500/20 bg-emerald-950/5" : "border-slate-850"}`}>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-200 block">{asg.staffName}</span>
                        {isSent ? (
                          <span className="text-[8px] px-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded font-black uppercase tracking-wide">
                            Done OK ✅
                          </span>
                        ) : (
                          <span className="text-[8px] px-1 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded font-black uppercase tracking-wide animate-pulse">
                            Aktif ⚡
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-1.5">↳ Tasks: {asg.jobdesTitle}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase p-1 px-1.5 rounded-md flex items-center gap-1 border ${isSent ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                      {emoji} {shiftVal}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Staf Terpilih Kemarin */}
        <div id="selected-yesterday-panel" className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 mb-3">
            <div className="p-1 px-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-bold">
              Kemarin
            </div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> Staf Terpilih Kemarin
            </h2>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {yesterdayAssignments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                💤 Tidak ada pembagian tugas kemarin.
              </div>
            ) : (
              yesterdayAssignments.map((asg, i) => {
                const shiftVal = asg.staffShift || "Bebas";
                const emoji = shiftVal === "Pagi" ? "🌅" : shiftVal === "Siang" ? "🌇" : shiftVal === "Malam" ? "🌃" : "🌟";
                return (
                  <div key={i} className="p-2.5 bg-slate-950/80 border border-slate-850 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-slate-200 block">{asg.staffName}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">↳ Tasks: {asg.jobdesTitle}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 p-1 px-1.5 rounded-md flex items-center gap-1">
                      {emoji} {shiftVal}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Staf Belum Mendapat Giliran */}
        <div id="waiting-rotation-panel" className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2 mb-3">
            <div className="p-1 px-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold">
              Antrean
            </div>
            <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> Antrean Rotasi Kerja / Prioritas
            </h2>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {rotationStats.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                💤 Tidak ada staf Kasir aktif terdaftar.
              </div>
            ) : (
              rotationStats.map((stat, i) => {
                const emoji = stat.staff.shift === "Pagi" ? "🌅" : stat.staff.shift === "Siang" ? "🌇" : stat.staff.shift === "Malam" ? "🌃" : "🌟";
                return (
                  <div key={i} className="p-2.5 bg-slate-950/80 border border-slate-850 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-slate-200 block">{stat.staff.name}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">📅 Akumulasi Kerja: {stat.turnsCount} kali acak</span>
                    </div>
                    <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-1 px-1.5 rounded-md flex items-center gap-1">
                      {emoji} {stat.staff.shift}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
