import { useState, useEffect } from "react";
import { 
  Staff, 
  Jobdes, 
  HistoryRecord, 
  AccessRole, 
  Assignment,
  AdminNotification
} from "./types";
import { 
  DEFAULT_STAFFS, 
  DEFAULT_JOBDES_LIST 
} from "./data/defaultData";
import DashboardStats from "./components/DashboardStats";
import StaffManagement from "./components/StaffManagement";
import JobdesManagement from "./components/JobdesManagement";
import RandomizerEngine from "./components/RandomizerEngine";
import AssignmentHistoryList from "./components/AssignmentHistoryList";
import StaffScheduleView from "./components/StaffScheduleView";
import LoginScreen from "./components/LoginScreen";
import { 
  ShieldCheck, 
  UserSquare2, 
  SlidersHorizontal, 
  Menu, 
  Activity, 
  RefreshCw, 
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  Lock,
  User,
  Bell
} from "lucide-react";

export default function App() {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("ligabandot_logged_in") === "true";
  });

  const [loginUsername, setLoginUsername] = useState<string>(() => {
    return localStorage.getItem("ligabandot_username") || "";
  });

  const [role, setRole] = useState<AccessRole>(() => {
    const savedRole = localStorage.getItem("ligabandot_role");
    return (savedRole as AccessRole) || "STAFF";
  });

  const [loggedInStaffId, setLoggedInStaffId] = useState<string | null>(() => {
    return localStorage.getItem("ligabandot_staff_id") || null;
  });

  // Custom state dialogs (Iframe-safe)
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

  // Load state from local storage or load Indonesian defaults
  const [staffs, setStaffs] = useState<Staff[]>(() => {
    const saved = localStorage.getItem("jobdes_staffs");
    return saved ? JSON.parse(saved) : DEFAULT_STAFFS;
  });

  const [jobdesList, setJobdesList] = useState<Jobdes[]>(() => {
    const saved = localStorage.getItem("jobdes_dict");
    return saved ? JSON.parse(saved) : DEFAULT_JOBDES_LIST;
  });

  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => {
    const saved = localStorage.getItem("jobdes_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>(() => {
    try {
      const saved = localStorage.getItem("jobdes_admin_notifications_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active view tab inside ADMIN mode
  const [activeTab, setActiveTab] = useState<"ACAK" | "STAFF" | "JOBDES" | "HISTORY">("ACAK");

  // Toggle admin notification popover
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);

  // Auto-scheduler states
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("jobdes_auto_update_enabled");
    return saved !== null ? saved === "true" : true;
  });

  const [autoUpdateTime, setAutoUpdateTime] = useState<string>(() => {
    return localStorage.getItem("jobdes_auto_update_time") || "00:00";
  });

  const [lastAutoUpdateDate, setLastAutoUpdateDate] = useState<string>(() => {
    return localStorage.getItem("jobdes_last_auto_update_date") || "";
  });

  const [wantedCounts, setWantedCounts] = useState<Record<"Pagi" | "Siang" | "Malam" | "Bebas", number>>(() => {
    try {
      const saved = localStorage.getItem("jobdes_multi_shift_wanted_counts");
      return saved ? JSON.parse(saved) : { Pagi: 1, Siang: 1, Malam: 1, Bebas: 0 };
    } catch {
      return { Pagi: 1, Siang: 1, Malam: 1, Bebas: 0 };
    }
  });

  const [reportSubmitTrigger, setReportSubmitTrigger] = useState(0);

  const [currentAssignments, setCurrentAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem("jobdes_current_assignments");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem("jobdes_staffs", JSON.stringify(staffs));
  }, [staffs]);

  useEffect(() => {
    localStorage.setItem("jobdes_dict", JSON.stringify(jobdesList));
  }, [jobdesList]);

  useEffect(() => {
    localStorage.setItem("jobdes_history", JSON.stringify(historyRecords));
  }, [historyRecords]);

  useEffect(() => {
    localStorage.setItem("jobdes_admin_notifications_v1", JSON.stringify(adminNotifications));
  }, [adminNotifications]);

  useEffect(() => {
    localStorage.setItem("jobdes_auto_update_enabled", String(autoUpdateEnabled));
  }, [autoUpdateEnabled]);

  useEffect(() => {
    localStorage.setItem("jobdes_auto_update_time", autoUpdateTime);
  }, [autoUpdateTime]);

  useEffect(() => {
    localStorage.setItem("jobdes_last_auto_update_date", lastAutoUpdateDate);
  }, [lastAutoUpdateDate]);

  useEffect(() => {
    localStorage.setItem("jobdes_multi_shift_wanted_counts", JSON.stringify(wantedCounts));
  }, [wantedCounts]);

  useEffect(() => {
    localStorage.setItem("jobdes_current_assignments", JSON.stringify(currentAssignments));
  }, [currentAssignments]);

  // Migration effect to ensure 3 shifts are selected by default
  useEffect(() => {
    const migrated = localStorage.getItem("jobdes_multi_shift_wanted_counts_v3");
    if (!migrated) {
      setWantedCounts({ Pagi: 1, Siang: 1, Malam: 1, Bebas: 0 });
      localStorage.setItem("jobdes_multi_shift_wanted_counts", JSON.stringify({ Pagi: 1, Siang: 1, Malam: 1, Bebas: 0 }));
      localStorage.setItem("jobdes_multi_shift_wanted_counts_v3", "true");
    }
  }, []);

  // Ensure we have active Kasir for Pagi, Siang, and Malam shifts so randomization of 3 shifts works flawlessly
  useEffect(() => {
    setStaffs((prevStaffs) => {
      const updated = [...prevStaffs];
      const hasPagiKasir = updated.some(s => s.isActive && s.shift === "Pagi" && s.role.trim().toUpperCase() === "KASIR");
      const hasSiangKasir = updated.some(s => s.isActive && s.shift === "Siang" && s.role.trim().toUpperCase() === "KASIR");
      const hasMalamKasir = updated.some(s => s.isActive && s.shift === "Malam" && s.role.trim().toUpperCase() === "KASIR");

      let changed = false;
      if (!hasPagiKasir) {
        updated.push({ id: `st-pagi-seed-${Date.now()}`, name: "Aldi Pratama", role: "KASIR", shift: "Pagi", isActive: true });
        changed = true;
      }
      if (!hasSiangKasir) {
        updated.push({ id: `st-siang-seed-${Date.now()}`, name: "Yoga Saputra", role: "KASIR", shift: "Siang", isActive: true });
        changed = true;
      }
      if (!hasMalamKasir) {
        updated.push({ id: `st-malam-seed-${Date.now()}`, name: "Budi Santoso", role: "KASIR", shift: "Malam", isActive: true });
        changed = true;
      }

      return changed ? updated : prevStaffs;
    });
  }, []);

  // Statistics Calculation
  const getHistoryCountToday = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRecords = historyRecords.filter((rec) => rec.date === todayStr);
    return todayRecords.reduce((total, rec) => total + rec.assignments.length, 0);
  };

  // Staff Mutator methods
  const handleAddStaff = (newStaff: Omit<Staff, "id">) => {
    const nStaff: Staff = {
      ...newStaff,
      id: `st-${Date.now()}`,
    };
    setStaffs((prev) => [...prev, nStaff]);
  };

  const handleUpdateStaff = (updatedStaff: Staff) => {
    setStaffs((prev) => prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)));
  };

  const handleUpdateStaffAndNotify = (updatedStaff: Staff, requestedByStaff: boolean = false) => {
    const oldStaff = staffs.find(s => s.id === updatedStaff.id);
    if (oldStaff && requestedByStaff) {
      const changes: string[] = [];
      if (oldStaff.username !== updatedStaff.username) {
        changes.push(`Username ("${oldStaff.username || oldStaff.name.toLowerCase().split(' ')[0]}" ➜ "${updatedStaff.username}")`);
      }
      if (oldStaff.password !== updatedStaff.password) {
        changes.push(`Sandi/Password ("${oldStaff.password || 'staff123'}" ➜ "${updatedStaff.password}")`);
      }

      if (changes.length > 0) {
        const now = new Date();
        const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().split(" ")[0]}`;
        const newNotif: AdminNotification = {
          id: `notif-${Date.now()}`,
          timestamp,
          staffId: updatedStaff.id,
          staffName: updatedStaff.name,
          message: `Staf ${updatedStaff.name} telah mengganti: ${changes.join(" dan ")}`,
          read: false
        };
        setAdminNotifications((prev) => [newNotif, ...prev]);
      }
    }
    handleUpdateStaff(updatedStaff);
  };

  const handleMarkAllNotificationsAsRead = () => {
    setAdminNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setAdminNotifications([]);
  };

  const handleToggleReadNotification = (id: string) => {
    setAdminNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  const handleDeleteStaff = (id: string) => {
    setStaffs((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveShiftChanges = (updatedStaffs: Staff[]) => {
    setStaffs(updatedStaffs);
  };

  // Jobdes Mutator methods
  const handleAddJobdes = (newJob: Omit<Jobdes, "id">) => {
    const nJob: Jobdes = {
      ...newJob,
      id: `jd-${Date.now()}`,
    };
    setJobdesList((prev) => [...prev, nJob]);
  };

  const handleUpdateJobdes = (updatedJob: Jobdes) => {
    setJobdesList((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
  };

  const handleDeleteJobdes = (id: string) => {
    setJobdesList((prev) => prev.filter((j) => j.id !== id));
  };

  // Add customized generated shift randomizer output to history log
  const handleAddNewHistory = (shift: "Pagi" | "Siang" | "Malam" | "Bebas", assignments: Assignment[]) => {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStamp = now.toTimeString().split(" ")[0]; // HH:MM:ss

    const newRecord: HistoryRecord = {
      id: `hist-${Date.now()}`,
      date: dateStamp,
      time: timeStamp,
      shift,
      assignments: assignments.map((asg) => ({
        staffName: asg.staffName,
        jobdesTitle: asg.jobdesTitle,
        staffShift: asg.staffShift,
      })),
    };

    setHistoryRecords((prev) => [newRecord, ...prev]);
  };

  const runRandomization = (manual: boolean = false, customWantedCounts = wantedCounts): { success: boolean; message: string; errorTitle?: string; errorMessage?: string; data?: Assignment[] } => {
    const rolesFilter = "KASIR";
    const shifts: Array<"Pagi" | "Siang" | "Malam" | "Bebas"> = ["Pagi", "Siang", "Malam", "Bebas"];
    const activeDemands = shifts.filter((sh) => customWantedCounts[sh] > 0);

    if (activeDemands.length === 0) {
      return {
        success: false,
        message: "Konfigurasi Kosong",
        errorTitle: "Konfigurasi Kosong",
        errorMessage: "Harap tentukan minimal 1 staf pada salah satu shift untuk diacak (contoh: Shift Pagi 1 staf, Shift Malam 1 staf).",
      };
    }

    if (jobdesList.length === 0) {
      return {
        success: false,
        message: "Katalog Jobdes Kosong",
        errorTitle: "Katalog Jobdes Kosong",
        errorMessage: "Katalog jobdesk kosong. Silakan tambahkan item jobdesk baru di tab 'Katalog Jobdesk' terlebih dahulu.",
      };
    }

    const failedShifts: typeof shifts = [];
    const validDemands: Array<{ sh: typeof shifts[number]; count: number }> = [];

    for (const sh of activeDemands) {
      const count = customWantedCounts[sh];
      const candidates = staffs.filter((s) => {
        return s.isActive && s.shift === sh && s.role.trim().toUpperCase() === rolesFilter;
      });

      if (candidates.length < count) {
        failedShifts.push(sh);
      } else {
        validDemands.push({ sh, count });
      }
    }

    // If there are no valid shifts to randomize, show alert and abort
    if (validDemands.length === 0 && failedShifts.length > 0) {
      const failedShiftsStr = failedShifts.map((s) => s.toUpperCase()).join(", ");
      return {
        success: false,
        message: `Gagal mengacak karena seluruh shift yang dipilih kekurangan staf Kasir Aktif: ${failedShiftsStr}`,
        errorTitle: "Staf Tidak Cukup",
        errorMessage: `Seluruh shift yang dipilih (${failedShiftsStr}) kekurangan staf Kasir Aktif. Silakan aktifkan staf Kasir baru atau kurangi jumlah pengacakan.`,
      };
    }

    // Pick candidates using rotation algorithm for the valid shifts
    const chosenStaffs: Staff[] = [];

    for (const { sh, count } of validDemands) {
      const candidates = staffs.filter((s) => {
        return s.isActive && s.shift === sh && s.role.trim().toUpperCase() === rolesFilter;
      });

      // Calculate rotation scores for each candidate in this shift based on global history
      const rotationScores = candidates.map((staff) => {
        let totalAssignments = 0;
        let lastAssignedIndex = -1;

        historyRecords.forEach((record, index) => {
          const wasAssigned = record.assignments.some(
            (asg) => asg.staffName.trim().toLowerCase() === staff.name.trim().toLowerCase()
          );
          if (wasAssigned) {
            totalAssignments++;
            if (lastAssignedIndex === -1) {
              lastAssignedIndex = index;
            }
          }
        });

        return { staff, totalAssignments, lastAssignedIndex };
      });

      // Sort: fewer assignments first, then older assignment first
      rotationScores.sort((a, b) => {
        if (a.totalAssignments !== b.totalAssignments) {
          return a.totalAssignments - b.totalAssignments;
        }
        if (a.lastAssignedIndex === -1 && b.lastAssignedIndex !== -1) return -1;
        if (b.lastAssignedIndex === -1 && a.lastAssignedIndex !== -1) return 1;
        if (a.lastAssignedIndex !== b.lastAssignedIndex) {
          return b.lastAssignedIndex - a.lastAssignedIndex; // larger index means older under prepend order
        }
        return Math.random() - 0.5;
      });

      // Pick top N candidates
      for (let i = 0; i < count; i++) {
        chosenStaffs.push(rotationScores[i].staff);
      }
    }

    // Shuffle jobdes list so task distribution order is varied
    const shuffledJobs = [...jobdesList].sort(() => Math.random() - 0.5);

    // Distribute jobs among the chosen staffs evenly (Round robin)
    const generated: Assignment[] = shuffledJobs.map((job, index) => {
      const staffIndex = index % chosenStaffs.length;
      const currentStaff = chosenStaffs[staffIndex];

      return {
        id: `asg-${Date.now()}-${index}`,
        staffId: currentStaff.id,
        staffName: currentStaff.name,
        staffShift: currentStaff.shift,
        jobdesId: job.id,
        jobdesTitle: job.title,
      };
    });

    setCurrentAssignments(generated);

    // Save to history records automatically
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStamp = now.toTimeString().split(" ")[0]; // HH:MM:ss

    const newRecord: HistoryRecord = {
      id: `hist-${Date.now()}`,
      date: dateStamp,
      time: timeStamp,
      shift: "Bebas", // Matches unified assignments
      assignments: generated.map((asg) => ({
        staffName: asg.staffName,
        jobdesTitle: asg.jobdesTitle,
        staffShift: asg.staffShift,
      })),
    };

    setHistoryRecords((prev) => [newRecord, ...prev]);

    // Push notification/warning if some active shifts were skipped
    if (failedShifts.length > 0) {
      const failedShiftsStr = failedShifts.map((s) => s.toUpperCase()).join(", ");
      const nowTime = now.toTimeString().split(" ")[0];
      const newNotif: AdminNotification = {
        id: `notif-${Date.now()}`,
        timestamp: `${dateStamp} ${nowTime}`,
        staffId: "system",
        staffName: "Sistem Shifting",
        message: `⚠️ Pengacakan berjalan, tetapi SHIFT ${failedShiftsStr} DILEWATI karena staf Kasir aktif tidak mencukupi quota!`,
        read: false,
      };
      setAdminNotifications((prev) => [newNotif, ...prev]);

      return {
        success: true,
        message: `Pembagian tugas selesai, namun shift ${failedShiftsStr} terpaksa dilewati karena staf tidak mencukupi quota (${customWantedCounts[failedShifts[0]]} org diminta).`,
        data: generated,
      };
    }

    return {
      success: true,
      message: `Berhasil menetapkan ${generated.length} tugas secara merata kepada ${chosenStaffs.length} staf Kasir secara bergilir!`,
      data: generated,
    };
  };

  const handleResetWeeklyRotation = () => {
    setHistoryRecords([]);
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10);
    const timeStamp = now.toTimeString().split(" ")[0];
    const newNotif: AdminNotification = {
      id: `notif-${Date.now()}-reset-rotasi`,
      timestamp: `${dateStamp} ${timeStamp}`,
      staffId: "system",
      staffName: "Reset Rotasi",
      message: "🔄 Rotasi mingguan telah sukses direset ke nol oleh Admin. Seluruh staf Kasir memulai giliran adil dari awal kembali.",
      read: false,
    };
    setAdminNotifications((prev) => [newNotif, ...prev]);
    setCustomAlert({
      title: "Rotasi Mingguan Direset",
      message: "Sukses mereset riwayat rotasi! Giliran kerja seluruh staf Kasir telah kembali setara dari awal.",
      isSuccess: true,
    });
  };

  // Autonomous background date tracking & trigger
  const checkAndRunAutoUpdate = () => {
    if (!autoUpdateEnabled) return;

    const now = new Date();
    const localOffset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (localOffset * 60 * 1000));
    const todayStr = localDate.toISOString().slice(0, 10); // YYYY-MM-DD local

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // Parse scheduled time "HH:MM"
    const [schedHours, schedMinutes] = autoUpdateTime.split(":").map(Number);

    // If lastAutoUpdateDate is empty or is an older date
    if (lastAutoUpdateDate !== todayStr) {
      const isTimePassed = (currentHours > schedHours) || (currentHours === schedHours && currentMinutes >= schedMinutes);
      
      if (isTimePassed) {
        const result = runRandomization(false);
        setLastAutoUpdateDate(todayStr);
        localStorage.setItem("jobdes_last_auto_update_date", todayStr);

        const nowTime = now.toTimeString().split(" ")[0];
        const newNotif: AdminNotification = {
          id: `notif-${Date.now()}-auto-update`,
          timestamp: `${todayStr} ${nowTime}`,
          staffId: "system",
          staffName: "Sistem Auto-Update",
          message: result.success
            ? `🔄 Auto-Update Harian Berhasil! Tugas baru telah otomatis diacak sesuai jadwal (${autoUpdateTime} WIB) dan didistribusikan.`
            : `❌ Auto-Update Gagal: ${result.message}`,
          read: false,
        };
        setAdminNotifications((prev) => [newNotif, ...prev]);
      }
    }
  };

  useEffect(() => {
    if (!autoUpdateEnabled) return;

    // Run immediately on load/mount
    checkAndRunAutoUpdate();

    // Check periodically every 15 seconds
    const interval = setInterval(() => {
      checkAndRunAutoUpdate();
    }, 15000);

    return () => clearInterval(interval);
  }, [autoUpdateEnabled, autoUpdateTime, lastAutoUpdateDate, staffs, jobdesList, historyRecords, wantedCounts]);

  const handleDeleteHistoryRecord = (id: string) => {
    setHistoryRecords((prev) => prev.filter((rec) => rec.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistoryRecords([]);
  };

  // Fast reset tool to get default configuration easily
  const handleResetToDefaults = () => {
    setCustomConfirm({
      title: "Reset Pabrik harian",
      message: "Apakah Anda yakin ingin RESET ULANG seluruh data staff, katalog jobdesk, dan riwayat aktivitas ke setelan bawaan pabrik? Data saat ini akan sepenuhnya tertimpa.",
      onConfirm: () => {
        setStaffs(DEFAULT_STAFFS);
        setJobdesList(DEFAULT_JOBDES_LIST);
        setHistoryRecords([]);
        setCustomConfirm(null);
        setCustomAlert({
          title: "Reset Berhasil",
          message: "Data operasional telah sukses dikembalikan ke setelan pabrik default Indonesia!",
          isSuccess: true,
        });
      }
    });
  };

  const handleLoginAttempt = (usernameInput: string, passwordInput: string): boolean => {
    const normUser = usernameInput.trim().toLowerCase();
    const normPass = passwordInput.trim();

    // 1. MASTER ADMIN MATCH (GUEST LOGIN)
    if (normUser === "lubis" && normPass === "kupas170625") {
      setIsLoggedIn(true);
      setLoginUsername("Admin Master");
      setRole("ADMIN");
      localStorage.setItem("ligabandot_logged_in", "true");
      localStorage.setItem("ligabandot_username", "Admin Master");
      localStorage.setItem("ligabandot_role", "ADMIN");
      localStorage.removeItem("ligabandot_staff_id");
      
      setCustomAlert({
        title: "Login Admin Berhasil",
        message: "Selamat datang kembali di Panel Admin Utama LigaBandot!",
        isSuccess: true,
      });
      return true;
    }

    // 2. MASTER STAFF MATCH (GUEST STAFF)
    if (normUser === "staff" && normPass === "staff123") {
      setIsLoggedIn(true);
      setLoginUsername("Staff Portal");
      setRole("STAFF");
      localStorage.setItem("ligabandot_logged_in", "true");
      localStorage.setItem("ligabandot_username", "Staff Portal");
      localStorage.setItem("ligabandot_role", "STAFF");
      setLoggedInStaffId(null);
      localStorage.removeItem("ligabandot_staff_id");

      setCustomAlert({
        title: "Login Staf Berhasil",
        message: "Selamat datang, Staff Portal! Anda masuk ke akses umum staf.",
        isSuccess: true,
      });
      return true;
    }

    // 3. SEARCH CUSTOM STAFF (BY USERNAME OR FIRST NAME FALLBACK)
    const matchedStaff = staffs.find((s) => {
      if (!s.isActive) return false;
      const customUsername = s.username ? s.username.toLowerCase().trim() : s.name.toLowerCase().split(" ")[0];
      return customUsername === normUser;
    });

    if (matchedStaff) {
      const requiredPassword = matchedStaff.password || "staff123";
      if (normPass === requiredPassword) {
        setIsLoggedIn(true);
        const displayName = matchedStaff.name;
        setLoginUsername(displayName);
        // If loginRole is undefined, default to "STAFF"
        const resolvedRole = matchedStaff.loginRole || "STAFF";
        setRole(resolvedRole);

        localStorage.setItem("ligabandot_logged_in", "true");
        localStorage.setItem("ligabandot_username", displayName);
        localStorage.setItem("ligabandot_role", resolvedRole);
        setLoggedInStaffId(matchedStaff.id);
        localStorage.setItem("ligabandot_staff_id", matchedStaff.id);

        setCustomAlert({
          title: resolvedRole === "ADMIN" ? "Login Admin Berhasil" : "Login Staf Berhasil",
          message: `Selamat datang, ${displayName}! Anda masuk sebagai ${resolvedRole === "ADMIN" ? "Admin Master" : "Staf harian"}.`,
          isSuccess: true,
        });
        return true;
      }
    }

    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername("");
    setRole("STAFF");
    setLoggedInStaffId(null);
    localStorage.removeItem("ligabandot_logged_in");
    localStorage.removeItem("ligabandot_username");
    localStorage.removeItem("ligabandot_role");
    localStorage.removeItem("ligabandot_staff_id");
    
    setCustomAlert({
      title: "Sudah Keluar",
      message: "Sesi Anda telah aman ditutup.",
      isSuccess: true,
    });
  };

  // If not logged in, render the login page exclusively
  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLoginAttempt={handleLoginAttempt} />
        {/* Render custom alert if any raised under login screen */}
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
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Professional Global Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* App title logo with high-fidelity vector matching the user's updated LigaBandot brand mark */}
          <div className="flex items-center gap-4.5">
            <div className="flex items-center bg-slate-950/40 px-3 py-1.5 rounded-xl border border-amber-500/10 shadow-lg shadow-black/40 backdrop-blur">
              <svg
                viewBox="140 20 320 72"
                className="h-11 w-auto drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Premium Gold/Bronze Gradient for the Accents */}
                  <linearGradient id="goldHead" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF9E6" />
                    <stop offset="15%" stopColor="#E5C158" />
                    <stop offset="50%" stopColor="#AD8020" />
                    <stop offset="65%" stopColor="#FCDC6D" />
                    <stop offset="85%" stopColor="#966512" />
                    <stop offset="100%" stopColor="#5E3E0B" />
                  </linearGradient>

                  {/* Reflective Metallic Chrome/Silver Gradient for the Text */}
                  <linearGradient id="silverText" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="40%" stopColor="#F5F5F5" />
                    <stop offset="50%" stopColor="#A3A3A3" />
                    <stop offset="55%" stopColor="#E5E5E5" />
                    <stop offset="85%" stopColor="#737373" />
                    <stop offset="100%" stopColor="#404040" />
                  </linearGradient>

                  {/* Drop shadow for realistic depth */}
                  <filter id="vectorDropShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="1" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.9" />
                  </filter>
                </defs>

                <g filter="url(#vectorDropShadow)">
                  {/* High-fidelity Elegant Metallic Chrome Wordmark "LigaBandot" with enlarged L and B layout */}
                  <text
                    x="298"
                    y="76"
                    fontFamily="'Georgia', 'Times New Roman', serif"
                    fill="url(#silverText)"
                    stroke="#111"
                    strokeWidth="1.2"
                    textAnchor="middle"
                    className="select-none"
                    style={{ filter: "drop-shadow(0px 1.5px 2px rgba(0, 0, 0, 0.8))" }}
                  >
                    <tspan fontSize="62" fontWeight="900" letterSpacing="-1">L</tspan>
                    <tspan fontSize="46" fontWeight="900" letterSpacing="0.5" dy="-4">iga</tspan>
                    <tspan fontSize="62" fontWeight="900" letterSpacing="-1" dx="1.5" dy="4">B</tspan>
                    <tspan fontSize="46" fontWeight="900" letterSpacing="0.5" dy="-4">andot</tspan>
                  </text>
                </g>
              </svg>
            </div>
            
            <div className="border-l border-slate-900 pl-4">
              <h1 className="text-sm font-bold text-white tracking-wide uppercase leading-tight">
                Dashboard Jobdes All HP & Shift All Staf
              </h1>
              <p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase">
                Sistem Pengacakan Otomatis & Operasional Shifting
              </p>
            </div>
          </div>

          {/* Interactive Session Info & Logout Control */}
          <div className="flex flex-wrap items-center gap-2.5">
            {role === "ADMIN" && (
              <button
                onClick={handleResetToDefaults}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all flex items-center gap-1"
                title="Reset ke setelan bawaan demo"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Demo
              </button>
            )}

            {role === "ADMIN" && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer relative ${
                    isNotifOpen
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850"
                  }`}
                  title="Notifikasi Akses Staf harian"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Notifikasi</span>
                  {adminNotifications.filter((n) => !n.read).length > 0 && (
                    <span className="bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full block animate-pulse">
                      {adminNotifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[100] p-4 space-y-4 animate-scaleUp">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-amber-400" /> Notifikasi Staf
                      </h4>
                      <div className="flex gap-2">
                        {adminNotifications.length > 0 && (
                          <>
                            <button
                              onClick={() => {
                                handleMarkAllNotificationsAsRead();
                                setIsNotifOpen(false);
                              }}
                              className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase cursor-pointer"
                            >
                              Selesai
                            </button>
                            <span className="text-slate-700">|</span>
                            <button
                              onClick={() => {
                                handleClearAllNotifications();
                                setIsNotifOpen(false);
                              }}
                              className="text-[9px] text-rose-400 hover:text-rose-300 font-bold uppercase cursor-pointer"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {adminNotifications.length === 0 ? (
                        <div className="text-center py-6 text-[11px] text-slate-500">
                          Tidak ada notifikasi pergantian username & sandi baru.
                        </div>
                      ) : (
                        adminNotifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-lg border text-xs transition-colors ${
                              n.read
                                ? "bg-slate-950/45 border-slate-800/60 text-slate-400"
                                : "bg-blue-500/5 border-blue-500/10 text-white font-medium"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="text-[11px] leading-relaxed">{n.message}</span>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1 animate-pulse" />
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-850/40 text-[9px] font-mono text-slate-500">
                              <span>{n.timestamp}</span>
                              {!n.read && (
                                <button
                                  onClick={() => handleToggleReadNotification(n.id)}
                                  className="text-amber-500 hover:text-amber-400 font-bold cursor-pointer"
                                >
                                  Tandai Dibaca
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active User Session Details */}
            <div className="bg-slate-900/60 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="text-left">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-black">
                  {role === "ADMIN" ? "👑 Admin Master" : "🛡️ AKUN STAF"}
                </span>
                <span className="text-xs font-extrabold text-white block -mt-0.5 leading-none">
                  {loginUsername}
                </span>
              </div>
            </div>

            {/* Keluar logout trigger */}
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-600 hover:text-white border border-rose-500/20 text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Keluar dari Sesi"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-6">
        {/* KPI Row - Always Displayed for Admin, displays limited stats for staff */}
        <DashboardStats 
          staffs={staffs} 
          jobdesList={jobdesList} 
          historyCountToday={getHistoryCountToday()} 
          historyRecords={historyRecords}
          reportSubmitTrigger={reportSubmitTrigger}
        />

        {/* ADMIN WORKSPACE VIEW */}
        {role === "ADMIN" ? (
          <div className="space-y-6">
            {/* View navigation selector inside Admin role */}
            <div className="border-b border-slate-900 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("ACAK")}
                className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "ACAK"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                🎲 Acak Jobdesk
              </button>
              <button
                onClick={() => setActiveTab("STAFF")}
                className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "STAFF"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                🧑‍💼 Manajemen Staff
              </button>
              <button
                onClick={() => setActiveTab("JOBDES")}
                className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "JOBDES"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                📝 Katalog Jobdesk
              </button>
              <button
                onClick={() => setActiveTab("HISTORY")}
                className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === "HISTORY"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                📊 Riwayat Pengecekan
              </button>
            </div>

            {/* Admin sub-views routing based on selected tab */}
            <div className="animate-fadeIn">
              {activeTab === "ACAK" && (
                <RandomizerEngine
                  staffs={staffs}
                  jobdesList={jobdesList}
                  historyRecords={historyRecords}
                  onAddNewHistory={handleAddNewHistory}
                  wantedCounts={wantedCounts}
                  setWantedCounts={setWantedCounts}
                  currentAssignments={currentAssignments}
                  setCurrentAssignments={setCurrentAssignments}
                  autoUpdateEnabled={autoUpdateEnabled}
                  setAutoUpdateEnabled={setAutoUpdateEnabled}
                  autoUpdateTime={autoUpdateTime}
                  setAutoUpdateTime={setAutoUpdateTime}
                  runRandomization={runRandomization}
                  handleResetWeeklyRotation={handleResetWeeklyRotation}
                />
              )}

              {activeTab === "STAFF" && (
                <StaffManagement
                  staffs={staffs}
                  onAddStaff={handleAddStaff}
                  onUpdateStaff={handleUpdateStaff}
                  onDeleteStaff={handleDeleteStaff}
                  onSaveShiftChanges={handleSaveShiftChanges}
                />
              )}

              {activeTab === "JOBDES" && (
                <JobdesManagement
                  jobdesList={jobdesList}
                  onAddJobdes={handleAddJobdes}
                  onUpdateJobdes={handleUpdateJobdes}
                  onDeleteJobdes={handleDeleteJobdes}
                />
              )}

              {activeTab === "HISTORY" && (
                <AssignmentHistoryList
                  historyRecords={historyRecords}
                  staffs={staffs}
                  onDeleteRecord={handleDeleteHistoryRecord}
                  onClearAllHistory={handleClearAllHistory}
                />
              )}
            </div>
          </div>
        ) : (
          /* STAFF WORKSPACE VIEW */
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  👤 Keamanan & Hub Staf
                </h2>
                <p className="text-xs text-indigo-300 mt-1">
                  Melihat jadwal shift harian Anda sendiri beserta lembar checklist tugas HP yang teracak harian.
                </p>
              </div>
              <span className="text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 block text-center">
                🛡️ Akses Staff Sederhana
              </span>
            </div>

            <StaffScheduleView 
              staffs={staffs} 
              historyRecords={historyRecords} 
              loggedInStaffId={loggedInStaffId} 
              onUpdateStaff={(updatedStaff) => handleUpdateStaffAndNotify(updatedStaff, true)}
              onReportSubmitted={() => setReportSubmitTrigger((prev) => prev + 1)}
            />
          </div>
        )}
      </main>

      {/* Page Footer */}
      <footer className="mt-12 border-t border-slate-900/60 py-6 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center md:flex md:items-center md:justify-between">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            &copy; {new Date().getFullYear()} - <strong>Dashboard Jobdes HP & Staf</strong>. Dioptimalkan untuk kecepatan single-page, responsif komputer & selulur.
          </p>
          <p className="text-[10px] font-mono text-slate-600 mt-2 md:mt-0">
            Engine Build v1.2.0 • LocalStorage Engine
          </p>
        </div>
      </footer>

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
                <AlertTriangle className="w-5 h-5" />
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
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition-colors"
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
