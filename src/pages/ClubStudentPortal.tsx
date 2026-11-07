import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, addDoc, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { ArrowLeft, Calendar, BookOpen, MessageSquare, ChevronRight, LogOut, User, Megaphone } from 'lucide-react';
import { BRANCHES, SESSIONS } from '../types';
import { POSTS } from '../constants';
import { toast } from 'react-hot-toast';
import { signOut } from 'firebase/auth';


export default function ClubStudentPortal() {
  const { clubName } = useParams<{ clubName: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [studentStatus, setStudentStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Forms State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [session, setSession] = useState(SESSIONS[0]);
  const [registrationNo, setRegistrationNo] = useState('');
  const [post, setPost] = useState(POSTS[0]);
  const [mobileNo, setMobileNo] = useState('');

  // Auth Handling
  useEffect(() => {
    const checkLocalAuth = async () => {
      const storedAuth = localStorage.getItem(`studentAuth_${clubName}`);
      if (storedAuth) {
        const studentInfo = JSON.parse(storedAuth);
        if (studentInfo.firstName) setFirstName(studentInfo.firstName);
        if (studentInfo.lastName) setLastName(studentInfo.lastName);
        if (studentInfo.registrationNo) setRegistrationNo(studentInfo.registrationNo);
        if (studentInfo.mobileNo) setMobileNo(studentInfo.mobileNo);
        if (studentInfo.branch) setBranch(studentInfo.branch);
        
        const qStudents = studentInfo.registrationNo ? query(
          collection(db, 'clubStudents'),
          where('clubId', '==', clubName),
          where('registrationNo', '==', studentInfo.registrationNo),
          where('mobileNo', '==', studentInfo.mobileNo),
          where('branch', '==', studentInfo.branch)
        ) : query(
          collection(db, 'clubStudents'),
          where('clubId', '==', clubName),
          where('firstName', '==', studentInfo.firstName),
          where('lastName', '==', studentInfo.lastName)
        );
        let snapStudents;
        try {
          snapStudents = await getDocs(qStudents);
        } catch (err: any) {
          handleFirestoreError(err, OperationType.LIST, 'clubStudents');
          return;
        }
        
        if (!snapStudents.empty) {
          setStudentStatus('approved');
          const data = snapStudents.docs[0].data();
          setProfileInfo(data);
          setFirstName(data.firstName);
          setLastName(data.lastName);
          return;
        }

        const qRequests = studentInfo.registrationNo ? query(
          collection(db, 'clubRequests'),
          where('clubId', '==', clubName),
          where('registrationNo', '==', studentInfo.registrationNo),
          where('mobileNo', '==', studentInfo.mobileNo),
          where('branch', '==', studentInfo.branch)
        ) : query(
          collection(db, 'clubRequests'),
          where('clubId', '==', clubName),
          where('firstName', '==', studentInfo.firstName),
          where('lastName', '==', studentInfo.lastName)
        );
        let snapRequests;
        try {
          snapRequests = await getDocs(qRequests);
        } catch (err: any) {
          handleFirestoreError(err, OperationType.LIST, 'clubRequests');
          return;
        }
        
        if (!snapRequests.empty) {
          const req = snapRequests.docs[0].data();
          setStudentStatus(req.status as 'pending' | 'rejected' | 'approved');
        } else {
          setStudentStatus('none');
          localStorage.removeItem(`studentAuth_${clubName}`);
        }
      }
    };
    checkLocalAuth();
  }, [clubName]);

  useEffect(() => {
    if (studentStatus !== 'approved' || !clubName) {
      setAnnouncements([]);
      return;
    }

    const qEvents = query(
      collection(db, 'clubEvents'),
      where('clubId', '==', clubName),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(qEvents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clubEvents');
    });

    return () => unsubscribe();
  }, [clubName, studentStatus]);

  const handleLogout = async () => {
    localStorage.removeItem(`studentAuth_${clubName}`);
    setStudentStatus('none');
    setProfileInfo(null);
    setShowProfile(false);
    toast.success("Previous account logged out successfully");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName) return;
    setLoading(true);

    try {
      if (auth.currentUser) await signOut(auth);

      // Check duplicate
      const q = query(
        collection(db, 'clubRequests'),
        where('clubId', '==', clubName),
        where('registrationNo', '==', registrationNo)
      );
      let exists;
      try {
        exists = await getDocs(q);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.LIST, 'clubRequests');
        setLoading(false);
        return;
      }
      if (exists && !exists.empty) {
        toast.error('You have already applied.');
        setLoading(false);
        return;
      }

      try {
        await addDoc(collection(db, 'clubRequests'), {
          clubId: clubName,
          firstName,
          lastName,
          branch,
          session,
          registrationNo,
          mobileNo,
          post,
          status: 'pending',
          createdAt: new Date()
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, 'clubRequests');
      }

      localStorage.setItem(`studentAuth_${clubName}`, JSON.stringify({ branch, registrationNo, mobileNo }));
      setStudentStatus('pending');
      toast.success('Request sent successfully to Club Admin');
    } catch (err) {
      toast.error('Failed to submit request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName) return;
    setLoading(true);

    try {
      if (auth.currentUser) await signOut(auth);

      // Check members
      const qStudents = query(
        collection(db, 'clubStudents'),
        where('clubId', '==', clubName),
        where('branch', '==', branch),
        where('registrationNo', '==', registrationNo),
        where('mobileNo', '==', mobileNo)
      );
      let studentSnap;
      try {
        studentSnap = await getDocs(qStudents);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.LIST, 'clubStudents');
        setLoading(false);
        return;
      }

      if (studentSnap && !studentSnap.empty) {
        const data = studentSnap.docs[0].data();
        localStorage.setItem(`studentAuth_${clubName}`, JSON.stringify({ branch, registrationNo, mobileNo }));
        setStudentStatus('approved');
        setProfileInfo(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        toast.success(`Welcome back ${data.firstName}!`);
        setLoading(false);
        return;
      }

      // Check pending
      const qRequests = query(
        collection(db, 'clubRequests'),
        where('clubId', '==', clubName),
        where('branch', '==', branch),
        where('registrationNo', '==', registrationNo),
        where('mobileNo', '==', mobileNo)
      );
      let reqSnap;
      try {
        reqSnap = await getDocs(qRequests);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.LIST, 'clubRequests');
        setLoading(false);
        return;
      }

      if (reqSnap && !reqSnap.empty) {
        const data = reqSnap.docs[0].data();
        localStorage.setItem(`studentAuth_${clubName}`, JSON.stringify({ branch, registrationNo, mobileNo }));
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setStudentStatus(data.status as 'pending' | 'rejected' | 'approved');
      } else {
        toast.error('No account found. Please sign up or check your details.');
      }
    } catch (err) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (studentStatus === 'approved') {
    return (
      <div className="space-y-8 pb-20">
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm relative">
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-3 hover:bg-gray-50 p-2 pr-4 rounded-2xl transition-colors cursor-pointer text-left">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{firstName} {lastName}</p>
              <p className="text-xs text-gray-500 font-medium capitalize">Student Portal</p>
            </div>
          </button>
          <div className="flex items-center gap-4">
            <span className="font-bold text-gray-900 capitalize hidden sm:inline-block border border-gray-100 px-4 py-1.5 rounded-full">{clubName}</span>
          </div>
        </div>

        {showProfile && profileInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowProfile(false)}>
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900">Student Profile</h2>
                <button onClick={() => setShowProfile(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors">✕</button>
              </div>
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-3xl shadow-inner mb-4">
                  {profileInfo.firstName.charAt(0)}{profileInfo.lastName.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{profileInfo.firstName} {profileInfo.lastName}</h3>
                <p className="text-sm font-medium text-blue-600 uppercase tracking-widest mt-1 bg-blue-50 px-3 py-1 rounded-full">{profileInfo.post}</p>
              </div>
              <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">Branch</span>
                  <span className="text-sm font-black text-gray-900">{profileInfo.branch}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">Session</span>
                  <span className="text-sm font-black text-gray-900">{profileInfo.session || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">Reg No.</span>
                  <span className="text-sm font-black text-gray-900">{profileInfo.registrationNo}</span>
                </div>
                {profileInfo.mobileNo && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500">Mobile No.</span>
                    <span className="text-sm font-black text-gray-900">{profileInfo.mobileNo}</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleLogout} 
                className="w-full mt-6 flex items-center justify-center gap-2 text-rose-600 bg-rose-50 px-4 py-3 rounded-xl font-bold hover:bg-rose-100 transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl shadow-blue-500/20">
          <h1 className="text-4xl md:text-5xl font-black mb-4 capitalize">Welcome to {clubName}!</h1>
          <p className="text-blue-100 font-medium text-lg max-w-2xl">
            You are an official member. Stay updated with upcoming events, access learning resources, and collaborate with your peers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => setShowAnnouncements(true)}
            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Upcoming Events</h3>
            <p className="text-gray-500 font-medium mb-4">View announcements and schedules.</p>
            <button className="text-indigo-600 font-bold flex items-center gap-1 group/btn">
              View Schedule <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Resources</h3>
            <p className="text-gray-500 font-medium mb-4">Access study materials and guides.</p>
            <button className="text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1 group/btn">
              Browse Files <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Discussions</h3>
            <p className="text-gray-500 font-medium mb-4">Connect with other club members.</p>
            <button className="text-rose-600 font-bold hover:text-rose-700 flex items-center gap-1 group/btn">
              Join Chat <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Announcements Modal */}
        {showAnnouncements && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAnnouncements(false)}>
            <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-white pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Announcements & Events</h2>
                </div>
                <button onClick={() => setShowAnnouncements(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors">✕</button>
              </div>
              
              {announcements.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-gray-500 font-medium">No announcements or events right now.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col group hover:border-blue-100 hover:shadow-md transition">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{ann.title}</h3>
                      <p className="text-lg text-gray-500 mb-4 flex-1 whitespace-pre-wrap">{ann.description}</p>
                      <div className="font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {ann.createdAt?.toDate ? new Date(ann.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col items-center justify-center min-h-[70vh] py-12">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-8 pb-0">
          <h1 className="text-xl font-bold text-black mb-2 capitalize">{clubName} Portal</h1>
          <p className="text-gray-500 font-medium mb-8">Access the student ecosystem</p>
        </div>

        {studentStatus === 'pending' && (
          <div className="px-8 pb-8">
            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100/50 text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-amber-500 text-2xl shadow-sm">⏳</div>
              <p className="text-amber-800 font-bold text-lg">Your request is pending approval</p>
              <p className="text-amber-600/80 font-medium text-sm">The club admin will review your application soon.</p>
              <button onClick={handleLogout} className="mt-4 px-6 py-2 bg-white text-amber-700 rounded-xl font-bold shadow-sm hover:shadow-md transition">Logout</button>
            </div>
          </div>
        )}

        {studentStatus === 'rejected' && (
          <div className="px-8 pb-8">
            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100/50 text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-rose-500 text-2xl shadow-sm">❌</div>
              <p className="text-rose-800 font-bold text-lg">Your request was rejected by Club Admin</p>
              <button onClick={handleLogout} className="mt-4 px-6 py-2 bg-white text-rose-700 rounded-xl font-bold shadow-sm hover:shadow-md transition">Return to Start</button>
            </div>
          </div>
        )}

        {studentStatus === 'none' && (
          <>
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-4 font-bold text-sm tracking-wide transition-all border-b-2 ${activeTab === 'login' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-4 font-bold text-sm tracking-wide transition-all border-b-2 ${activeTab === 'signup' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Sign Up
              </button>
            </div>

            <div className="p-8">
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-lg text-black focus:ring-2 focus:ring-slate-900 outline-none appearance-none">
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <input type="text" placeholder="Registration No." value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} required className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-lg text-black focus:ring-2 focus:ring-slate-900 outline-none" />
                  <input type="tel" placeholder="Mobile No." value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} required className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-lg text-black focus:ring-2 focus:ring-slate-900 outline-none" />
                  <button type="submit" disabled={loading} className="w-full p-4 mt-2 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 disabled:opacity-50">
                    {loading ? 'Logging in...' : 'Login to Portal'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-lg text-black focus:ring-2 focus:ring-slate-900 outline-none" />
                    <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-lg text-black focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                  <input type="text" placeholder="Registration No." value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} required className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-lg text-black focus:ring-2 focus:ring-slate-900 outline-none" />
                  <input type="tel" placeholder="Mobile No." value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} required className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-lg text-black focus:ring-2 focus:ring-slate-900 outline-none" />
                  <select value={post} onChange={(e) => setPost(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-lg text-black focus:ring-2 focus:ring-slate-900 outline-none appearance-none">
                    {POSTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-lg text-black focus:ring-2 focus:ring-slate-900 outline-none appearance-none">
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select value={session} onChange={(e) => setSession(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-lg text-black focus:ring-2 focus:ring-slate-900 outline-none appearance-none">
                    {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="submit" disabled={loading} className="w-full p-4 mt-2 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 disabled:opacity-50 tracking-wide">
                    {loading ? 'Submitting...' : 'Sign Up Request'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

