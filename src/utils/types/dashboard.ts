export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: "student" | "teacher" | "admin";
}

export interface AllStudentRow {
  id: string;
  student_number: string;
  profile: Profile;
  className: string;
  avgScore: number;
  joined: string;
  phone: string;
  dob: string;
  classId: string;
  temporaryPassword: string | null;
}

export interface ClassRow {
  id: string;
  name: string;
  grade: number;
  section: string;
  studentCount: number;
  teacher: string;
}

export interface SubjectRow {
  id: string;
  name: string;
  className: string;
  classId: string;
  teacher: string;
  avgScore: number;
}

export interface PaymentRow {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  classId: string;
  className: string;
  amount: number;
  paymentMonth: string;
  status: "approved" | "pending" | "rejected";
  paymentMethod: "bank_transfer" | "cash" | "mobile_money" | "other";
  submittedAt: string;
  screenshotUrl: string;
  note?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  avgScore: number;
}

export interface DashboardData {
  academicYear: string;
  semester: string;
  students: AllStudentRow[];
  classes: ClassRow[];
  subjects: SubjectRow[];
  payments: PaymentRow[];
  stats: DashboardStats;
  enrollmentByGrade: { grade: string; count: number }[];
}
