// lib/mock-data.ts

export type Role = "admin" | "teacher" | "student";

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: Role;
}

export interface ClassRow {
  id: string;
  name: string;
  grade: number;
  section: string;
  studentCount: number;
  teacher: string;
}

export interface StudentRow {
  id: string;
  student_number: string;
  profile: Profile;
  className: string;
  avgScore: number;
  joined: string;
}

export interface SubjectPerf {
  id: string;
  name: string;
  className: string;
  avgScore: number;
}

export const currentAcademicYear = "2025 / 2026";
export const currentSemester = "Semester 1";

export const stats = {
  totalStudents: 842,
  totalTeachers: 47,
  totalClasses: 24,
  avgScore: 78.4,
  studentsDelta: "+18 this term",
  teachersDelta: "+2 this term",
  classesDelta: "same as last term",
  avgScoreDelta: "+3.1 pts",
};

export const enrollmentByGrade = [
  { grade: "Grade 9", count: 210 },
  { grade: "Grade 10", count: 198 },
  { grade: "Grade 11", count: 224 },
  { grade: "Grade 12", count: 210 },
];

export const classes: ClassRow[] = [
  {
    id: "c1",
    name: "Class A",
    grade: 9,
    section: "A",
    studentCount: 36,
    teacher: "Meron Tesfaye",
  },
  {
    id: "c2",
    name: "Class B",
    grade: 9,
    section: "B",
    studentCount: 34,
    teacher: "Yonas Bekele",
  },
  {
    id: "c3",
    name: "Class A",
    grade: 10,
    section: "A",
    studentCount: 33,
    teacher: "Selam Girma",
  },
  {
    id: "c4",
    name: "Class A",
    grade: 11,
    section: "A",
    studentCount: 31,
    teacher: "Dawit Alemu",
  },
  {
    id: "c5",
    name: "Class A",
    grade: 12,
    section: "A",
    studentCount: 29,
    teacher: "Hana Worku",
  },
];

export const recentStudents: StudentRow[] = [
  {
    id: "s1",
    student_number: "STU-2026-0231",
    profile: {
      id: "p1",
      full_name: "Betelhem Ashenafi",
      username: "betelhem.a",
      email: "betelhem@school.edu",
      role: "student",
    },
    className: "Grade 10 - A",
    avgScore: 91.2,
    joined: "2 days ago",
  },
  {
    id: "s2",
    student_number: "STU-2026-0230",
    profile: {
      id: "p2",
      full_name: "Nathnael Girma",
      username: "nathnael.g",
      email: "nathnael@school.edu",
      role: "student",
    },
    className: "Grade 9 - B",
    avgScore: 74.5,
    joined: "3 days ago",
  },
  {
    id: "s3",
    student_number: "STU-2026-0229",
    profile: {
      id: "p3",
      full_name: "Ruth Solomon",
      username: "ruth.s",
      email: "ruth@school.edu",
      role: "student",
    },
    className: "Grade 12 - A",
    avgScore: 88.0,
    joined: "4 days ago",
  },
  {
    id: "s4",
    student_number: "STU-2026-0228",
    profile: {
      id: "p4",
      full_name: "Abel Kebede",
      username: "abel.k",
      email: "abel@school.edu",
      role: "student",
    },
    className: "Grade 11 - A",
    avgScore: 63.7,
    joined: "5 days ago",
  },
  {
    id: "s5",
    student_number: "STU-2026-0227",
    profile: {
      id: "p5",
      full_name: "Liya Tadesse",
      username: "liya.t",
      email: "liya@school.edu",
      role: "student",
    },
    className: "Grade 9 - A",
    avgScore: 95.4,
    joined: "1 week ago",
  },
];

export const topSubjects: SubjectPerf[] = [
  {
    id: "sub1",
    name: "Mathematics",
    className: "Grade 12 - A",
    avgScore: 89.2,
  },
  { id: "sub2", name: "Biology", className: "Grade 11 - A", avgScore: 85.6 },
  { id: "sub3", name: "English", className: "Grade 10 - A", avgScore: 82.1 },
  { id: "sub4", name: "Physics", className: "Grade 9 - B", avgScore: 71.4 },
];

export function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
// --- append to lib/mock-data.ts ---

export interface TeacherRow {
  id: string;
  teacher_number: string;
  profile: Profile;
  subjects: string[];
  classCount: number;
  phone: string;
}

export interface AllStudentRow extends StudentRow {
  phone: string;
  dob: string;
  classId: string;
}

export interface SubjectRow {
  id: string;
  name: string;
  className: string;
  classId: string;
  teacher: string;
  avgScore: number;
}

export interface AcademicYearRow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  semesters: { name: string; start_date: string; end_date: string }[];
}

export interface GradeRecord {
  id: string;
  studentName: string;
  subject: string;
  className: string;
  semester: string;
  score: number;
}

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface PaymentRow {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  amount: number;
  paymentMonth: string;
  status: PaymentStatus;
  paymentMethod: "bank" | "cash" | "telebirr" | "other";
  submittedAt: string;
  note?: string;
}

export const payments: PaymentRow[] = [
  {
    id: "pay1",
    studentId: "s1",
    studentName: "Betelhem Ashenafi",
    studentNumber: "STU-2026-0231",
    amount: 2500,
    paymentMonth: "2026-08",
    status: "approved",
    paymentMethod: "telebirr",
    submittedAt: "2026-08-05",
  },
  {
    id: "pay2",
    studentId: "s2",
    studentName: "Nathnael Girma",
    studentNumber: "STU-2026-0230",
    amount: 2500,
    paymentMonth: "2026-08",
    status: "pending",
    paymentMethod: "bank",
    submittedAt: "2026-08-08",
  },
  {
    id: "pay3",
    studentId: "s3",
    studentName: "Ruth Solomon",
    studentNumber: "STU-2026-0229",
    amount: 2500,
    paymentMonth: "2026-08",
    status: "approved",
    paymentMethod: "cash",
    submittedAt: "2026-08-03",
  },
  {
    id: "pay4",
    studentId: "s4",
    studentName: "Abel Kebede",
    studentNumber: "STU-2026-0228",
    amount: 2500,
    paymentMonth: "2026-08",
    status: "rejected",
    paymentMethod: "other",
    submittedAt: "2026-08-02",
    note: "Payment proof was not readable.",
  },
  {
    id: "pay5",
    studentId: "s5",
    studentName: "Liya Tadesse",
    studentNumber: "STU-2026-0227",
    amount: 2500,
    paymentMonth: "2026-08",
    status: "pending",
    paymentMethod: "telebirr",
    submittedAt: "2026-08-09",
  },
];

export const allTeachers: TeacherRow[] = [
  {
    id: "t1",
    teacher_number: "TCH-0101",
    profile: {
      id: "p10",
      full_name: "Meron Tesfaye",
      username: "meron.t",
      email: "meron@school.edu",
      role: "teacher",
    },
    subjects: ["Mathematics"],
    classCount: 2,
    phone: "+251 91 234 5601",
  },
  {
    id: "t2",
    teacher_number: "TCH-0102",
    profile: {
      id: "p11",
      full_name: "Yonas Bekele",
      username: "yonas.b",
      email: "yonas@school.edu",
      role: "teacher",
    },
    subjects: ["Physics", "Chemistry"],
    classCount: 3,
    phone: "+251 91 234 5602",
  },
  {
    id: "t3",
    teacher_number: "TCH-0103",
    profile: {
      id: "p12",
      full_name: "Selam Girma",
      username: "selam.g",
      email: "selam@school.edu",
      role: "teacher",
    },
    subjects: ["English"],
    classCount: 4,
    phone: "+251 91 234 5603",
  },
  {
    id: "t4",
    teacher_number: "TCH-0104",
    profile: {
      id: "p13",
      full_name: "Dawit Alemu",
      username: "dawit.a",
      email: "dawit@school.edu",
      role: "teacher",
    },
    subjects: ["Biology"],
    classCount: 2,
    phone: "+251 91 234 5604",
  },
  {
    id: "t5",
    teacher_number: "TCH-0105",
    profile: {
      id: "p14",
      full_name: "Hana Worku",
      username: "hana.w",
      email: "hana@school.edu",
      role: "teacher",
    },
    subjects: ["History", "Geography"],
    classCount: 3,
    phone: "+251 91 234 5605",
  },
  {
    id: "t6",
    teacher_number: "TCH-0106",
    profile: {
      id: "p15",
      full_name: "Kalab Fikru",
      username: "kalab.f",
      email: "kalab@school.edu",
      role: "teacher",
    },
    subjects: ["ICT"],
    classCount: 5,
    phone: "+251 91 234 5606",
  },
];

export const allStudents: AllStudentRow[] = [
  {
    ...recentStudents[0],
    phone: "+251 92 111 2201",
    dob: "2010-03-14",
    classId: "c3",
  },
  {
    ...recentStudents[1],
    phone: "+251 92 111 2202",
    dob: "2011-07-02",
    classId: "c2",
  },
  {
    ...recentStudents[2],
    phone: "+251 92 111 2203",
    dob: "2008-11-21",
    classId: "c5",
  },
  {
    ...recentStudents[3],
    phone: "+251 92 111 2204",
    dob: "2009-05-09",
    classId: "c4",
  },
  {
    ...recentStudents[4],
    phone: "+251 92 111 2205",
    dob: "2011-01-30",
    classId: "c1",
  },
  {
    id: "s6",
    student_number: "STU-2026-0226",
    profile: {
      id: "p6",
      full_name: "Samuel Girma",
      username: "samuel.g",
      email: "samuel@school.edu",
      role: "student",
    },
    className: "Grade 10 - A",
    avgScore: 68.9,
    joined: "1 week ago",
    phone: "+251 92 111 2206",
    dob: "2010-09-18",
    classId: "c3",
  },
  {
    id: "s7",
    student_number: "STU-2026-0225",
    profile: {
      id: "p7",
      full_name: "Meklit Abera",
      username: "meklit.a",
      email: "meklit@school.edu",
      role: "student",
    },
    className: "Grade 9 - A",
    avgScore: 84.3,
    joined: "2 weeks ago",
    phone: "+251 92 111 2207",
    dob: "2011-04-25",
    classId: "c1",
  },
];

export const allSubjects: SubjectRow[] = [
  {
    id: "sub1",
    name: "Mathematics",
    className: "Grade 12 - A",
    classId: "c5",
    teacher: "Meron Tesfaye",
    avgScore: 89.2,
  },
  {
    id: "sub2",
    name: "Biology",
    className: "Grade 11 - A",
    classId: "c4",
    teacher: "Dawit Alemu",
    avgScore: 85.6,
  },
  {
    id: "sub3",
    name: "English",
    className: "Grade 10 - A",
    classId: "c3",
    teacher: "Selam Girma",
    avgScore: 82.1,
  },
  {
    id: "sub4",
    name: "Physics",
    className: "Grade 9 - B",
    classId: "c2",
    teacher: "Yonas Bekele",
    avgScore: 71.4,
  },
  {
    id: "sub5",
    name: "ICT",
    className: "Grade 9 - A",
    classId: "c1",
    teacher: "Kalab Fikru",
    avgScore: 90.5,
  },
  {
    id: "sub6",
    name: "History",
    className: "Grade 11 - A",
    classId: "c4",
    teacher: "Hana Worku",
    avgScore: 76.8,
  },
];

export const academicYears: AcademicYearRow[] = [
  {
    id: "ay1",
    name: "2025 / 2026",
    start_date: "2025-09-08",
    end_date: "2026-06-30",
    is_current: true,
    semesters: [
      { name: "Semester 1", start_date: "2025-09-08", end_date: "2026-01-23" },
      { name: "Semester 2", start_date: "2026-02-02", end_date: "2026-06-30" },
    ],
  },
  {
    id: "ay2",
    name: "2024 / 2025",
    start_date: "2024-09-09",
    end_date: "2025-06-28",
    is_current: false,
    semesters: [
      { name: "Semester 1", start_date: "2024-09-09", end_date: "2025-01-24" },
      { name: "Semester 2", start_date: "2025-02-03", end_date: "2025-06-28" },
    ],
  },
];

export const gradeRecords: GradeRecord[] = [
  {
    id: "g1",
    studentName: "Betelhem Ashenafi",
    subject: "Mathematics",
    className: "Grade 10 - A",
    semester: "Semester 1",
    score: 91.2,
  },
  {
    id: "g2",
    studentName: "Nathnael Girma",
    subject: "Physics",
    className: "Grade 9 - B",
    semester: "Semester 1",
    score: 74.5,
  },
  {
    id: "g3",
    studentName: "Ruth Solomon",
    subject: "English",
    className: "Grade 12 - A",
    semester: "Semester 1",
    score: 88.0,
  },
  {
    id: "g4",
    studentName: "Abel Kebede",
    subject: "Biology",
    className: "Grade 11 - A",
    semester: "Semester 1",
    score: 63.7,
  },
  {
    id: "g5",
    studentName: "Liya Tadesse",
    subject: "ICT",
    className: "Grade 9 - A",
    semester: "Semester 1",
    score: 95.4,
  },
  {
    id: "g6",
    studentName: "Samuel Girma",
    subject: "English",
    className: "Grade 10 - A",
    semester: "Semester 1",
    score: 68.9,
  },
  {
    id: "g7",
    studentName: "Meklit Abera",
    subject: "ICT",
    className: "Grade 9 - A",
    semester: "Semester 1",
    score: 84.3,
  },
];

export const schoolProfile = {
  name: "Jimma Prep School",
  address: "Jimma, Oromia, Ethiopia",
  phone: "+251 47 111 2222",
  email: "office@jimmaprep.edu",
  principal: "Dr. Aster Mulugeta",
  website: "www.jimmaprep.edu",
};
// --- append to lib/mock-data.ts ---

export interface RankingRow {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  semester1: number;
  semester2: number;
}

export const rankingData: RankingRow[] = [
  {
    studentId: "s1",
    studentName: "Betelhem Ashenafi",
    classId: "c3",
    className: "Grade 10 - A",
    semester1: 91.2,
    semester2: 93.4,
  },
  {
    studentId: "s2",
    studentName: "Nathnael Girma",
    classId: "c2",
    className: "Grade 9 - B",
    semester1: 74.5,
    semester2: 78.1,
  },
  {
    studentId: "s3",
    studentName: "Ruth Solomon",
    classId: "c5",
    className: "Grade 12 - A",
    semester1: 88.0,
    semester2: 90.3,
  },
  {
    studentId: "s4",
    studentName: "Abel Kebede",
    classId: "c4",
    className: "Grade 11 - A",
    semester1: 63.7,
    semester2: 69.2,
  },
  {
    studentId: "s5",
    studentName: "Liya Tadesse",
    classId: "c1",
    className: "Grade 9 - A",
    semester1: 95.4,
    semester2: 96.8,
  },
  {
    studentId: "s6",
    studentName: "Samuel Girma",
    classId: "c3",
    className: "Grade 10 - A",
    semester1: 68.9,
    semester2: 72.0,
  },
  {
    studentId: "s7",
    studentName: "Meklit Abera",
    classId: "c1",
    className: "Grade 9 - A",
    semester1: 84.3,
    semester2: 81.7,
  },
  {
    studentId: "s8",
    studentName: "Fikadu Tesema",
    classId: "c5",
    className: "Grade 12 - A",
    semester1: 79.6,
    semester2: 83.2,
  },
  {
    studentId: "s9",
    studentName: "Hiwot Alemayehu",
    classId: "c4",
    className: "Grade 11 - A",
    semester1: 92.1,
    semester2: 89.5,
  },
  {
    studentId: "s10",
    studentName: "Yared Mekonnen",
    classId: "c2",
    className: "Grade 9 - B",
    semester1: 58.3,
    semester2: 61.4,
  },
  {
    studentId: "s11",
    studentName: "Bethlehem Kassa",
    classId: "c3",
    className: "Grade 10 - A",
    semester1: 87.5,
    semester2: 85.9,
  },
  {
    studentId: "s12",
    studentName: "Robel Getachew",
    classId: "c5",
    className: "Grade 12 - A",
    semester1: 71.2,
    semester2: 75.8,
  },
];
