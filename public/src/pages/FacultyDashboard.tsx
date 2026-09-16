import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { User, FacultyProfile, StudentRequest, StudentProfile, BRANCHES } from '../types';
const defaultProfileImg = "https://api.dicebear.com/7.x/initials/svg?seed=Profile";
import { Camera, Check, X, ShieldCheck, Users, ClipboardCheck, LayoutDashboard, LogOut, Home, User as UserIcon, Clock, Calendar, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { compressImage } from '../lib/imageUtils';
import AttendanceManager from '../components/AttendanceManager';
import AssignmentManager from '../components/AssignmentManager';
import ExaminationAlertForm from '../components/ExaminationAlertForm';
import PublicAnnouncementForm from '../components/PublicAnnouncementForm';

interface FacultyDashboardProps {
  user: User;
}

export default function FacultyDashboard({ user }: FacultyDashboardProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [acceptedStudents, setAcceptedStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'overview' | 'students' | 'attendance' | 'assignments'>('overview');
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState('All Sessions');
  
  // Profile Form State
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [profilePic, setProfilePic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlertFormOpen, setIsAlertFormOpen] = useState(false);
  const [isAnnouncementFormOpen, setIsAnnouncementFormOpen] = useState(false);

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setProfilePic(compressed);
      } catch (err) {
        console.error("Compression failed:", err);
        // Fallback to original reader if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePic(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  useEffect(() => {
    // Listen for faculty profile
    const unsubProfile = onSnapshot(doc(db, 'facultyProfiles', user.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as FacultyProfile);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `facultyProfiles/${user.uid}`);
    });

    return () => unsubProfile();
  }, [user.uid]);

  useEffect(() => {
    if (!profile) return;

    // Listen for student requests in same branch
    const q = query(
      collection(db, 'studentRequests'), 
      where('branch', '==', profile.branch),
      where('status', '==', 'pending')
    );

    const unsubRequests = onSnapshot(q, (snap) => {
      const reqs = snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentRequest));
      setRequests(reqs);
    }, (error) => {
      // Offline/Unavailable are handled by handleFirestoreError by returning
      handleFirestoreError(error, OperationType.LIST, 'studentRequests');
    });

    // Listen for accepted students in same branch
    const acceptedQ = query(
      collection(db, 'studentProfiles'),
      where('branch', '==', profile.branch),
      where('isVerified', '==', true)
    );

    const unsubStudents = onSnapshot(acceptedQ, (snap) => {
      const studs = snap.docs.map(d => d.data() as StudentProfile);
      setAcceptedStudents(studs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'studentProfiles');
    });

    return () => {
      unsubRequests();
      unsubStudents();
    };
  }, [profile]);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const facultyData: FacultyProfile = {
        uid: user.uid,
        firstName: user.firstName,
        lastName: user.lastName,
        branch,
        profilePicture: profilePic || defaultProfileImg
      };
      await setDoc(doc(db, 'facultyProfiles', user.uid), facultyData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'facultyProfiles');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptRequest = async (req: StudentRequest) => {
    try {
      // 1. Update request status
      try {
        await updateDoc(doc(db, 'studentRequests', req.id), { status: 'accepted' });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.UPDATE, `studentRequests/${req.id}`);
      }
      
      // 2. Update student profile
      try {
        await updateDoc(doc(db, 'studentProfiles', req.studentUid), {
          isVerified: true,
          verifiedBy: `${user.firstName} ${user.lastName}`
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.UPDATE, `studentProfiles/${req.studentUid}`);
      }
      
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'studentRequests/studentProfiles');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleExportCSV = () => {
    const headers = ['S.no.', 'Student Name', 'Registration No.', 'Branch', 'Session'];
    const rows = filteredStudents.map((s, i) => [
      i + 1,
      `${s.firstName} ${s.lastName}`,
      s.registrationNumber,
      s.branch,
      s.session
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${profile?.branch.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = acceptedStudents.filter(s => {
    const matchesSearch = 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSession = sessionFilter === 'All Sessions' || s.session === sessionFilter;
    return matchesSearch && matchesSession;
  });

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium italic">Initializing Faculty Portal...</div>;

  // 1. If profile not created
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* User Menu */}
        <div className="fixed top-6 right-6 z-50">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center w-14 h-14 bg-white font-extrabold text-xl tracking-tighter rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-gray-200 ring-4 ring-gray-100 drop-shadow-lg"
          >
            <span className="bg-linear-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] bg-clip-text text-transparent">
              {getInitials(user.firstName, user.lastName)}
            </span>
          </button>
          
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="fixed inset-0 z-[-1]"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 mt-4 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account</span>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                    </div>
                    
                    <div className="h-px bg-gray-100 mx-[-24px]" />
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between group p-3 bg-red-50 hover:bg-red-500 rounded-2xl transition-all"
                    >
                      <span className="font-bold text-red-600 group-hover:text-white">Logout Session</span>
                      <LogOut className="w-5 h-5 text-red-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-2xl p-12 border border-gray-100"
        >
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-black text-gray-900 mb-2">Faculty Portal</h2>
            <p className="text-gray-500 font-medium leading-relaxed">Setup your professional profile to start managing student verification requests.</p>
          </div>

          <form onSubmit={handleSubmitProfile} className="space-y-8">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full bg-gray-50 flex items-center justify-center ring-4 ring-blue-50 overflow-hidden">
                  {profilePic ? (
                    <img 
                      src={profilePic} 
                      alt="" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <img 
                      src={defaultProfileImg} 
                      alt="Default" 
                      className="w-full h-full object-cover opacity-50"
                    />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 shadow-lg">
                  <Camera className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center px-6">Upload a professional profile picture for your faculty identity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">First Name</label>
                <input type="text" readOnly value={user.firstName} className="w-full p-4 bg-gray-100 border-none rounded-2xl font-semibold text-gray-700" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Last Name</label>
                <input type="text" readOnly value={user.lastName} className="w-full p-4 bg-gray-100 border-none rounded-2xl font-semibold text-gray-700" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-blue-600 uppercase ml-1">Assigned Department</label>
              <select 
                value={branch} 
                onChange={(e) => setBranch(e.target.value)}
                className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-gray-900 appearance-none shadow-sm"
              >
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all font-sans"
            >
              {submitting ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* User Menu */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-white font-extrabold text-lg md:text-xl tracking-tighter rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-gray-200 ring-4 ring-gray-100 drop-shadow-lg"
        >
          <span className="bg-linear-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] bg-clip-text text-transparent">
            {getInitials(user.firstName, user.lastName)}
          </span>
        </button>
        
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 z-[-1]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute right-0 mt-4 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Account</span>
                    <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                  </div>
                  
                  <div className="h-px bg-gray-100 mx-[-24px]" />
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between group p-3 bg-red-50 hover:bg-red-500 rounded-2xl transition-all"
                  >
                    <span className="font-bold text-red-600 group-hover:text-white">Logout Session</span>
                    <LogOut className="w-5 h-5 text-red-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      
      {/* Faculty Info Header */}
      {/* Faculty Info Header & Utilities */}
      {(activeTab === 'overview' || activeTab === 'students' || activeTab === 'requests' || activeTab === 'attendance' || activeTab === 'assignments') && (
        <div className="flex flex-col gap-8 p-1">
          <div className="bg-gray-900 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 text-white flex flex-col xl:flex-row items-center justify-between gap-8 relative overflow-hidden transition-colors duration-300 flex-1">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10 text-center sm:text-left">
              <img src={profile.profilePicture} alt="" className="w-24 h-24 rounded-full object-cover ring-4 ring-white/10 shrink-0" />
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-black">{profile.firstName} {profile.lastName}</h2>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center sm:justify-start">
                  <span className="px-4 py-1 bg-blue-500 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full">Faculty Member</span>
                  <span className="text-gray-400 font-bold">{profile.branch}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap top-[10px] justify-center gap-3 md:gap-4 relative z-10 w-full xl:w-auto">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex-1 md:flex-none px-6 md:px-8 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Overview
              </button>
              <button 
                onClick={() => setActiveTab('attendance')}
                className={`flex-1 md:flex-none px-6 md:px-8 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'attendance' ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                <Calendar className="w-4 h-4" /> Attendance
              </button>
              <button 
                onClick={() => setActiveTab('requests')}
                className={`flex-1 md:flex-none px-6 md:px-8 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 relative cursor-pointer hover:scale-105 active:scale-95 ${activeTab === 'requests' ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                <ClipboardCheck className="w-4 h-4" /> Requests
                {requests.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-gray-900">{requests.length}</span>}
              </button>
            </div>
          </div>

          <motion.div 
            whileHover={{ y: -4 }}
            onClick={() => setIsAnnouncementFormOpen(true)}
            className="w-full bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 shadow-sm cursor-pointer hover:shadow-xl hover:border-gray-200 transition-all overflow-hidden relative flex items-center gap-6"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-50 rounded-full -mr-24 -mt-24 transition-all duration-300"></div>
            <div className="w-16 h-16 bg-rose-100/80 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner relative z-10 shrink-0">
              <Megaphone className="w-8 h-8" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Public Marquee</h3>
              <p className="text-sm text-gray-400 font-bold mt-1">Manage running hero marquee announcements</p>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'students' ? (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-gray-900">My Students</h3>
              <p className="text-gray-500 font-medium">Manage students in {profile.branch}</p>
            </div>

            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full sm:w-fit gap-2 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('students')}
                className="flex-1 sm:flex-none px-6 md:px-8 py-3 rounded-xl font-bold transition-all shadow-sm bg-white text-gray-900 shadow-sm"
              >
                Accepted
              </button>
              <button 
                onClick={() => setActiveTab('requests')}
                className="flex-1 sm:flex-none px-6 md:px-8 py-3 rounded-xl font-bold transition-all text-gray-500 hover:text-gray-900"
              >
                Requests
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
                <div className="relative flex-1 w-full max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                    <motion.svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="18" height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" stroke="currentColor" strokeWidth="2.5" 
                      strokeLinecap="round" strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </motion.svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search by name or registration no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-semibold placeholder:text-black placeholder:opacity-100 text-black"
                  />
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <select 
                    value={sessionFilter}
                    onChange={(e) => setSessionFilter(e.target.value)}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-700 min-w-[160px]"
                  >
                    <option>All Sessions</option>
                    <option>2022-26</option>
                    <option>2023-27</option>
                    <option>2024-28</option>
                    <option>2025-29</option>
                  </select>

                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-6 py-4 bg-blue-50 text-blue-600 rounded-3xl font-bold hover:bg-blue-100 transition-all"
                  >
                    <LogOut className="w-5 h-5 rotate-90" /> Export
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="w-20 px-4 py-5 text-sm font-black text-gray-500 uppercase tracking-widest border-r border-gray-200/50 text-center">S.no.</th>
                      <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest border-r border-gray-200/50">Student Name</th>
                      <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest border-r border-gray-200/50">Registration no.</th>
                      <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest border-r border-gray-200/50">Branch</th>
                      <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest border-r border-gray-200/50 text-center">Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-medium italic">No students found matches your criteria.</td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => (
                        <tr key={student.uid} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-5 font-bold text-gray-500 border-r border-gray-100 text-center">{idx + 1}</td>
                          <td className="px-6 py-5 border-r border-gray-100">
                            <div className="flex items-center gap-4">
                              <img src={student.profilePicture || defaultProfileImg} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-50 group-hover:scale-105 transition-transform" />
                              <span className="font-bold text-gray-900">{student.firstName} {student.lastName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 border-r border-gray-100">
                            <span className="text-gray-700 font-bold tracking-tight">{student.registrationNumber}</span>
                          </td>
                          <td className="px-6 py-5 border-r border-gray-100 font-semibold text-gray-600">{student.branch}</td>
                          <td className="px-6 py-5 text-center font-bold text-gray-600">{student.session}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'overview' ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <div 
              onClick={() => setActiveTab('attendance')}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 cursor-pointer hover:shadow-xl hover:border-gray-200 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Attendance</h3>
              <p className="text-5xl font-black text-indigo-600">Mark</p>
              <p className="text-sm text-gray-400 font-medium">Mark daily student attendance</p>
            </div>
            <div 
              onClick={() => setActiveTab('assignments')}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 cursor-pointer hover:shadow-xl hover:border-gray-200 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Assignment</h3>
              <p className="text-5xl font-black text-amber-600">Assign</p>
              <p className="text-sm text-gray-400 font-medium">Create and manage student tasks</p>
            </div>
            <div 
              onClick={() => setIsAlertFormOpen(true)}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 cursor-pointer hover:shadow-xl hover:border-gray-200 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Examination Updates</h3>
              <p className="text-xl md:text-5xl font-black text-emerald-600">Alerts</p>
              <p className="text-sm text-gray-400 font-medium">Click to send exam alerts</p>
            </div>
          </motion.div>
        ) : activeTab === 'attendance' ? (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {profile && (
              <AttendanceManager 
                faculty={profile} 
                students={acceptedStudents} 
                onBack={() => setActiveTab('overview')} 
              />
            )}
          </motion.div>
        ) : activeTab === 'assignments' ? (
          <motion.div
            key="assignments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {profile && (
              <AssignmentManager 
                faculty={profile}
                onBack={() => setActiveTab('overview')}
              />
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="requests"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2 mb-6">
              <h3 className="text-3xl font-black text-gray-900">Requests</h3>
              <p className="text-gray-500 font-medium">Review pending verification requests in {profile.branch}</p>
            </div>

            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full sm:w-fit gap-2 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('students')}
                className="flex-1 sm:flex-none px-6 md:px-8 py-3 rounded-xl font-bold transition-all text-gray-500 hover:text-gray-900"
              >
                Accepted
              </button>
              <button 
                onClick={() => setActiveTab('requests')}
                className="flex-1 sm:flex-none px-6 md:px-8 py-3 rounded-xl font-bold transition-all bg-white text-gray-900 shadow-sm"
              >
                Requests
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-gray-200">
                <p className="text-gray-400 font-semibold text-lg italic">No pending requests for verification.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-1 gap-8">
                {requests.map(req => (
                  <motion.div 
                    layout
                    key={req.id}
                    className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 md:p-6 flex gap-2 md:gap-3">
                      <button 
                        onClick={() => handleAcceptRequest(req)}
                        className="p-3 md:p-4 bg-emerald-500 text-white rounded-xl md:rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        title="Accept Request"
                      >
                        <Check className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                      <button 
                        onClick={() => { /* Implement declination logic if needed */ }}
                        className="p-3 md:p-4 bg-rose-500 text-white rounded-xl md:rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95 opacity-50"
                        title="Decline Request"
                      >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                    </div>

                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-6 md:mb-10 text-center md:text-left">Profile Information</h3>
                    
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                      <div className="shrink-0">
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden ring-8 ring-gray-50 shadow-inner">
                          <img 
                            src={req.profilePicture || defaultProfileImg} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-gray-400">Name</span>
                          <p className="text-xl font-bold text-gray-900 leading-tight">{req.firstName} {req.lastName}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-sm font-medium text-gray-400">Registration Number</span>
                          <p className="text-xl font-bold text-gray-900 leading-tight">{req.registrationNumber}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-sm font-medium text-gray-400">Branch</span>
                          <p className="text-xl font-bold text-gray-900 leading-tight">{req.branch}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-sm font-medium text-gray-400">Session</span>
                          <p className="text-xl font-bold text-gray-900 leading-tight">{req.session}</p>
                        </div>

                        <div className="space-y-1 md:col-span-2 pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Submitted At</span>
                          </div>
                          <p className="text-sm font-bold text-blue-600">
                            {new Date(req.createdAt).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isAlertFormOpen && profile && (
        <ExaminationAlertForm onClose={() => setIsAlertFormOpen(false)} facultyBranch={profile.branch} />
      )}      {isAnnouncementFormOpen && (
        <PublicAnnouncementForm onClose={() => setIsAnnouncementFormOpen(false)} />
      )}    </div>
  );
}
