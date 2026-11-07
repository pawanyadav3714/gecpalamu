export type UserRole = 'student' | 'faculty';

export interface User {
  uid: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
}

export interface StudentProfile {
  uid: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  branch: string;
  session: string;
  profilePicture: string;
  isVerified: boolean;
  verifiedBy?: string;
}

export interface FacultyProfile {
  uid: string;
  firstName: string;
  lastName: string;
  branch: string;
  profilePicture: string;
}

export interface StudentRequest {
  id: string;
  studentUid: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  branch: string;
  session: string;
  profilePicture: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

export const BRANCHES = [
  "Computer Science and Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering"
];

export const SESSIONS = [
  "2022-26",
  "2023-27",
  "2024-28",
  "2025-29"
];

export interface Assignment {
  id: string;
  facultyId: string;
  facultyName?: string;
  branch: string;
  branches?: string[];
  session: string;
  title: string;
  description: string;
  fileUrl?: string;
  date: string;
  createdAt: any;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  textResponse?: string;
  fileUrl?: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: any;
  updatedAt: any;
}
