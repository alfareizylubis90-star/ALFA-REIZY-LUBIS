export interface Staff {
  id: string;
  name: string;
  role: string; // e.g., "Supervisor", "Senior Agent", "Admin Desk", "Staff Officer"
  shift: "Pagi" | "Siang" | "Malam" | "Bebas";
  isActive: boolean;
  username?: string;
  password?: string;
  loginRole?: "ADMIN" | "STAFF";
}

export interface Jobdes {
  id: string;
  title: string;
  description?: string;
  category: "HP SITUS" | "AREA KERJA" | "LAINNYA";
}

export interface Assignment {
  id: string;
  staffId: string;
  staffName: string;
  staffShift: "Pagi" | "Siang" | "Malam" | "Bebas";
  jobdesId: string;
  jobdesTitle: string;
}

export interface HistoryRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:ss
  shift: "Pagi" | "Siang" | "Malam" | "Bebas";
  assignments: {
    staffName: string;
    jobdesTitle: string;
    staffShift?: "Pagi" | "Siang" | "Malam" | "Bebas";
  }[];
}

export type AccessRole = "ADMIN" | "STAFF";

export interface AdminNotification {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:MM:ss
  staffId: string;
  staffName: string;
  message: string;
  read: boolean;
}

