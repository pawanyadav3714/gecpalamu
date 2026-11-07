import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { User, StudentProfile, StudentRequest, BRANCHES, SESSIONS } from '../types';
const defaultProfileImg = "https://api.dicebear.com/7.x/initials/svg?seed=Profile";
import { Camera, Send, CheckCircle, Clock, AlertCircle, Calendar, BookOpen, ClipboardList, LogOut, Home, User as UserIcon, ArrowLeft, Eye } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { compressImage } from '../lib/imageUtils';
import AttendanceTracker from '../components/AttendanceTracker';
import AssignmentTracker from '../components/AssignmentTracker';

interface StudentDashboardProps {
  user: User;
}

const DASHBOARD_ITEMS = [
  { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-6 h-6" />, color: 'bg-indigo-500' },
  { id: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-6 h-6" />, color: 'bg-emerald-500' },
  { id: 'exams', label: 'Upcoming Exams', icon: <BookOpen className="w-6 h-6" />, color: 'bg-rose-500' }
];

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [request, setRequest] = useState<StudentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAlerted, setHasAlerted] = useState(false);
  const [activeView, setActiveView] = useState<'main' | 'attendance' | 'assignments' | 'exams'>('main');
  
  // Registration Form State
  const [regNumber, setRegNumber] = useState('');
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [session, setSession] = useState(SESSIONS[0]);
  const [profilePic, setProfilePic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredAlertId, setHoveredAlertId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };
  
  // Draggable icons state
  const [items, setItems] = useState(DASHBOARD_ITEMS);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Listen for profile changes
    const unsubProfile = onSnapshot(doc(db, 'studentProfiles', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as StudentProfile;
        setProfile(data);
        if (data.isVerified && data.verifiedBy && !hasAlerted) {
           alert(`Profile verified by ${data.verifiedBy}`);
           setHasAlerted(true);
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `studentProfiles/${user.uid}`);
    });

    // Listen for request status
    const q = query(collection(db, 'studentRequests'), where('studentUid', '==', user.uid));
    const unsubRequest = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const reqData = snap.docs[0].data() as StudentRequest;
        setRequest({ ...reqData, id: snap.docs[0].id });
      } else {
        setRequest(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'studentRequests');
    });

    return () => {
      unsubProfile();
      unsubRequest();
    };
  }, [user.uid]);

  useEffect(() => {
    if (!profile) return;
    
    // Alerts Filter
    const qAlerts = query(collection(db, 'examinationAlerts'));
    const unsubAlerts = onSnapshot(qAlerts, (snap) => {
      const allAlerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAlerts(allAlerts.filter((a: any) => 
        a.targetBranches.includes(profile.branch) && 
        (a.targetSessions.length === 0 || a.targetSessions.includes(profile.session))
      ));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'examinationAlerts');
    });

    const qAssignments = query(
      collection(db, 'assignments'),
      where('session', '==', profile.session)
    );

    const qSubmissions = query(
      collection(db, 'submissions'),
      where('studentId', '==', profile.uid)
    );

    let currentAssignments: any[] = [];
    let currentSubmissions: {assignmentId: string}[] = [];

    const updatePendingCount = () => {
      // Filter assignments locally to support both legacy 'branch' string and new 'branches' array
      const assignedIds = currentAssignments
        .filter(a => a.branches?.includes(profile.branch) || a.branch === profile.branch)
        .map(a => a.id);
      const submittedIds = currentSubmissions.map(s => s.assignmentId);
      const pendingIds = assignedIds.filter(id => !submittedIds.includes(id));
      setPendingAssignmentsCount(pendingIds.length);
    };

    const unsubA = onSnapshot(qAssignments, (snap) => {
      currentAssignments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      updatePendingCount();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'assignments');
    });

    const unsubS = onSnapshot(qSubmissions, (snap) => {
      currentSubmissions = snap.docs.map(d => d.data() as { assignmentId: string });
      updatePendingCount();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'submissions');
    });

    return () => {
      unsubAlerts();
      unsubA();
      unsubS();
    };
  }, [profile]);

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

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const path = `studentRequests`;
    
    try {
      const requestData = {
        studentUid: user.uid,
        firstName: user.firstName,
        lastName: user.lastName,
        registrationNumber: regNumber,
        branch,
        session,
        profilePicture: profilePic || defaultProfileImg,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'studentRequests', user.uid), requestData);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `studentRequests/${user.uid}`);
      }
      
      // Also create unverified profile locally
      try {
        await setDoc(doc(db, 'studentProfiles', user.uid), {
          ...requestData,
          uid: user.uid,
          isVerified: false
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `studentProfiles/${user.uid}`);
      }

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  // 1. If profile not created or request not sent
  if (!profile && !request) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
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
                  className="absolute right-0 mt-4 w-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 overflow-hidden"
                >
                  <div className="space-y-4 text-left">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Account</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
                    </div>
                    
                    <div className="h-px bg-gray-100 dark:bg-gray-700 mx-[-24px]" />
                    
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2rem] md:rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100"
        >
          <div className="mb-8 md:mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Student Portal</h2>
            <p className="text-sm md:text-base text-gray-500 font-medium">Complete your academic registration to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmitProfile} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">First Name</label>
                  <input type="text" readOnly value={user.firstName} className="w-full p-4 bg-gray-100 border-none rounded-2xl font-semibold text-gray-700 cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Last Name</label>
                  <input type="text" readOnly value={user.lastName} className="w-full p-4 bg-gray-100 border-none rounded-2xl font-semibold text-gray-700 cursor-not-allowed" />
                </div>
              </div>

              <div className="relative pt-6">
                <input 
                  type="text" 
                  id="regNumber"
                  required 
                  value={regNumber} 
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder=" "
                  className="peer w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700 outline-none placeholder-transparent shadow-sm"
                />
                <label 
                  htmlFor="regNumber"
                  className="absolute left-5 top-2 text-xs font-bold text-blue-600 uppercase tracking-widest transition-all pointer-events-none
                             peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-lg peer-placeholder-shown:text-black peer-placeholder-shown:font-medium peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal
                             peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-widest"
                >
                  Registration Number
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-widest pl-1">Academic Branch</label>
                  <select 
                    value={branch} 
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700 appearance-none shadow-sm"
                  >
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-widest pl-1">Session</label>
                  <select 
                    value={session} 
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700 appearance-none shadow-sm"
                  >
                    {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-8 flex flex-col items-center justify-center">
              <div className="relative group">
                <div className="w-48 h-48 bg-gray-100 rounded-full overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
                  {profilePic ? (
                    <img 
                      src={profilePic} 
                      alt="Preview" 
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
                <label className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-all shadow-lg">
                  <Camera className="w-5 h-5" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-400 italic text-center px-8">Upload a high-quality profile picture for your student recognition card.</p>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {submitting ? 'Sending Request...' : (
                  <>
                    Submit Request <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  // 2. If profile is pending verification
  if (profile && !profile.isVerified) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
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
                  className="absolute right-0 mt-4 w-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 overflow-hidden"
                >
                  <div className="space-y-4 text-left">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Account</span>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
                    </div>
                    
                    <div className="h-px bg-gray-100 dark:bg-gray-700 mx-[-24px]" />
                    
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

        <div className="text-center space-y-8">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-12 h-12 text-amber-600" />
          </div>
          <h2 className="text-4xl font-black text-gray-900">Verification Pending</h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            Your profile request has been sent to the <span className="font-bold text-blue-600">{profile.branch}</span> faculty. Please wait for approval.
          </p>
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl text-left max-w-2xl mx-auto">
            <h3 className="text-2xl font-black text-gray-900 mb-8 px-2">Profile Information</h3>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
              <div className="shrink-0">
                <div className="w-48 h-48 rounded-full overflow-hidden ring-8 ring-gray-50 shadow-inner">
                  <img 
                    src={profile.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-6 pt-2">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-400">Name</span>
                  <p className="text-xl font-bold text-gray-900 leading-tight">{profile.firstName} {profile.lastName}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-400">Registration Number</span>
                  <p className="text-xl font-bold text-gray-900 leading-tight">{profile.registrationNumber}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-400">Branch</span>
                  <p className="text-xl font-bold text-gray-900 leading-tight">{profile.branch}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-400">Session</span>
                  <p className="text-xl font-bold text-gray-900 leading-tight">{profile.session}</p>
                </div>

                <div className="space-y-1 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Submitted At</span>
                  </div>
                  <p className="text-sm font-bold text-blue-600">
                    {request?.createdAt ? new Date(request.createdAt).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Dashboard (Verified)
  return (
    <div className="space-y-12 pb-20 m-2">
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
                className="absolute right-0 mt-4 w-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 overflow-hidden"
              >
                <div className="space-y-4 text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Account</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
                  </div>
                  
                  <div className="h-px bg-gray-100 dark:bg-gray-700 mx-[-24px]" />
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between group p-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 rounded-2xl transition-all"
                  >
                    <span className="font-bold text-red-600 dark:text-red-400 group-hover:text-white">Logout Session</span>
                    <LogOut className="w-5 h-5 text-red-600 dark:text-red-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      
      {activeView === 'main' && (
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-gray-100 shadow-sm transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left px-1">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-blue-50 transition-all shrink-0">
            <img src={profile?.profilePicture || defaultProfileImg} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 transition-colors duration-300">{profile?.firstName} {profile?.lastName}</h2>
              <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-50" />
            </div>
            <p className="text-sm md:text-base text-gray-400 font-bold">{profile?.registrationNumber} • {profile?.branch}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-center sm:text-left transition-colors duration-300">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Academic Session</span>
            <span className="font-bold text-gray-900">{profile?.session}</span>
          </div>
          <div className="px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 text-center sm:text-left">
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest block">Verified By</span>
            <span className="font-bold">{profile?.verifiedBy}</span>
          </div>
        </div>
      </header>
      )}

      <AnimatePresence mode="wait">
        {activeView === 'main' ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-12"
          >
            <section className="space-y-6">
              <h3 className="text-2xl font-black text-gray-900 px-2 flex items-center gap-2">
                Dashboard
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="group"
                  >
                    <div className="h-full bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 relative">
                      {item.id === 'assignments' && pendingAssignmentsCount > 0 && (
                        <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-rose-500 animate-intense-blink text-rose-500" />
                      )}
                      <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-opacity-20`}>
                        {item.icon}
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{item.label}</h4>
                      <p className="text-sm text-gray-500 mb-6 leading-relaxed">View your upcoming scheduled {item.label.toLowerCase()} and tracks.</p>
                      <button 
                        onClick={() => {
                          if (item.id === 'attendance') setActiveView('attendance');
                          if (item.id === 'assignments') setActiveView('assignments');
                          if (item.id === 'exams') setActiveView('exams');
                        }}
                        className="w-full py-3 bg-gray-50 text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all cursor-pointer"
                      >
                        Open Records
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-black text-rose-900">Attendance Alert</h4>
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
                <p className="text-rose-700 font-medium">Your current attendance in <span className="font-black underline">Microprocessors</span> is 68%. The minimum required is 75%.</p>
                <div className="w-full bg-rose-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-600 h-full w-[68%]"></div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-black text-emerald-900">Assignments Completed</h4>
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-emerald-700 font-medium">You have completed 12/14 assignments this session. Keep up the good work!</p>
                <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full w-[85%]"></div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeView === 'attendance' ? (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setActiveView('main')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all border border-gray-100 shadow-sm mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            {profile && <AttendanceTracker student={profile} />}
          </motion.div>
        ) : activeView === 'exams' ? (
          <motion.div
            key="exams"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setActiveView('main')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all border border-gray-100 shadow-sm mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <div className="space-y-4">
              <h3 className="text-xl font-black text-gray-900 px-2">Examination Alerts</h3>
                            {alerts.map(alert => {
                const date = new Date(alert.createdAt);
                return (
                    <div 
                    key={alert.id} 
                    className="bg-white p-6 rounded-full border border-gray-100 space-y-3 shadow-sm transition-all relative overflow-hidden cursor-pointer"
                    onMouseEnter={() => setHoveredAlertId(alert.id)}
                    onMouseLeave={() => setHoveredAlertId(null)}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    {hoveredAlertId === alert.id && (
                      <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center p-6 text-center z-10 rounded-full border-4 border-white">
                        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">
                          Announced by: {alert.facultyName || 'Faculty'}<br />
                          {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                    <h4 className="font-black text-gray-900 text-lg px-2">{alert.title}</h4>
                    <p className="text-gray-600 font-medium leading-relaxed px-2 line-clamp-2">{alert.content}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="assignments"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setActiveView('main')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all border border-gray-100 shadow-sm mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            {profile && <AssignmentTracker student={profile} />}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
            onClick={() => setSelectedAlert(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-[2rem] max-w-lg w-full space-y-6 shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black">{selectedAlert.title}</h3>
              <p className="text-gray-600">{selectedAlert.content}</p>
              {selectedAlert.fileData && (
                Array.isArray(selectedAlert.fileData) ? (
                  selectedAlert.fileData.map((link: any, index: number) => (
                    <button 
                      key={index}
                      onClick={() => window.open(typeof link === 'string' ? link : link.url)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
                    >
                      <Eye className="w-5 h-5" /> {typeof link === 'string' ? `Document ${index+1}` : link.label || 'View Document'}
                    </button>
                  ))
                ) : (
                  <button 
                    onClick={() => window.open(selectedAlert.fileData)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
                  >
                    <Eye className="w-5 h-5" /> View Attached Document
                  </button>
                )
              )}
              <button 
                onClick={() => setSelectedAlert(null)}
                className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
