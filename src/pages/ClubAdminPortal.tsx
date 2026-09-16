import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, collection, query, where, onSnapshot, updateDoc, setDoc, getDocs, addDoc, serverTimestamp, orderBy, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { ArrowLeft, Check, X, LogOut, Megaphone, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { signOut } from 'firebase/auth';
import { POSTS } from '../constants';

interface Request {
  id: string;
  clubId: string;
  firstName: string;
  lastName: string;
  branch: string;
  session?: string;
  mobileNo?: string;
  registrationNo: string;
  post: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface ClubAnnouncement {
  id: string;
  clubId: string;
  title: string;
  description: string;
  createdAt: any;
}

export default function ClubAdminPortal() {
  const { clubName } = useParams<{ clubName: string }>();
  const navigate = useNavigate();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNo: '',
    registrationNo: '',
    branch: '',
    session: '',
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedPost, setSelectedPost] = useState('All');
  
  // Announcement Form State
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated this session
    const storedAuth = localStorage.getItem(`adminAuth_${clubName}`);
    if (storedAuth) {
      setIsAdminAuthenticated(true);
    }
  }, [clubName]);

  useEffect(() => {
    if (!isAdminAuthenticated || !clubName) return;

    const q = query(
      collection(db, 'clubRequests'),
      where('clubId', '==', clubName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Request[];
      setRequests(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clubRequests');
    });

    const qEvents = query(
      collection(db, 'clubEvents'),
      where('clubId', '==', clubName),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClubAnnouncement[];
      setAnnouncements(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clubEvents');
    });

    return () => {
      unsubscribe();
      unsubscribeEvents();
    };
  }, [isAdminAuthenticated, clubName]);

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      try {
        await addDoc(collection(db, 'clubAdmins'), {
          ...formData,
          clubId: clubName,
          createdAt: serverTimestamp()
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, 'clubAdmins');
      }
      toast.success('Admin registered successfully! Please login.');
      setAuthMode('login');
      setFormData({
        firstName: '',
        lastName: '',
        mobileNo: '',
        registrationNo: '',
        branch: '',
        session: '',
      });
    } catch (error) {
      toast.error('Registration failed');
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const q = query(
        collection(db, 'clubAdmins'),
        where('clubId', '==', clubName),
        where('registrationNo', '==', formData.registrationNo),
        where('mobileNo', '==', formData.mobileNo)
      );
      
      let snap;
      try {
        snap = await getDocs(q);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.LIST, 'clubAdmins');
        setIsVerifying(false);
        return;
      }
      
      if (snap && !snap.empty) {
        localStorage.setItem(`adminAuth_${clubName}`, 'true');
        setIsAdminAuthenticated(true);
        toast.success('Login successful');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      toast.error('Login failed');
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`adminAuth_${clubName}`);
    setIsAdminAuthenticated(false);
    toast.success('Logged out from Admin Dashboard');
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName || !eventTitle.trim()) return;

    setIsCreatingEvent(true);
    try {
      try {
        await addDoc(collection(db, 'clubEvents'), {
          clubId: clubName,
          title: eventTitle.trim(),
          description: eventDesc.trim(),
          createdAt: serverTimestamp()
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, 'clubEvents');
      }
      toast.success('Announcement published successfully');
      setEventTitle('');
      setEventDesc('');
      setShowEventModal(false);
    } catch (err) {
      toast.error('Failed to create announcement');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, 'clubEvents', eventId));
      setDeleteEventId(null);
      toast.success('Announcement deleted');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `clubEvents/${eventId}`);
      toast.error('Failed to delete announcement');
    }
  };

  const handleAction = async (requestId: string, studentData: Request, status: 'approved' | 'rejected') => {
    try {
      const requestRef = doc(db, 'clubRequests', requestId);
      await updateDoc(requestRef, { status });
      
      if (status === 'approved') {
        const studentId = `${studentData.firstName}-${studentData.lastName}-${Date.now()}`;
        await setDoc(doc(db, 'clubStudents', studentId), {
          clubId: clubName,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          branch: studentData.branch,
          session: studentData.session || '',
          registrationNo: studentData.registrationNo,
          mobileNo: studentData.mobileNo || '',
          post: studentData.post,
          approvedAt: new Date()
        });
      }
      toast.success(status === 'approved' ? 'Student approved' : 'Student rejected');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `clubRequests/${requestId}`);
      toast.error('Failed to update status');
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <button onClick={() => navigate(`/clubs/${clubName}`)} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="flex gap-4 mb-8">
            <button
               className={`flex-1 py-3 font-bold rounded-xl transition ${authMode === 'login' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}
               onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
               className={`flex-1 py-3 font-bold rounded-xl transition ${authMode === 'register' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600'}`}
               onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={authMode === 'register' ? handleAdminRegister : handleAdminLogin} className="space-y-4">
            {authMode === 'register' && (
              <>
                <input type="text" placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg text-black" required />
                <input type="text" placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg text-black" required />
                <input type="tel" placeholder="Mobile no." value={formData.mobileNo} onChange={(e) => setFormData({...formData, mobileNo: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg text-black" required />
                <input type="text" placeholder="Registration no." value={formData.registrationNo} onChange={(e) => setFormData({...formData, registrationNo: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg text-black" required />
                <select value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg text-black" required>
                  <option value="">Select Branch</option>
                  <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
                <select value={formData.session} onChange={(e) => setFormData({...formData, session: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg text-black" required>
                  <option value="">Select Session</option>
                  <option value="2022-26">2022-26</option>
                  <option value="2023-27">2023-27</option>
                  <option value="2024-28">2024-28</option>
                  <option value="2025-29">2025-29</option>
                </select>
              </>
            )}
            {authMode === 'login' && (
              <>
                <input type="text" placeholder="Registration no." value={formData.registrationNo} onChange={(e) => setFormData({...formData, registrationNo: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg text-black" required />
                <input type="tel" placeholder="Mobile no." value={formData.mobileNo} onChange={(e) => setFormData({...formData, mobileNo: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg text-black" required />
              </>
            )}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
            >
              {isVerifying ? 'Processing...' : (authMode === 'register' ? 'Register' : 'Login')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredRequests = requests.filter(r => 
    r.status === activeTab && (selectedPost === 'All' || r.post === selectedPost)
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate(`/clubs/${clubName}`)} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-black text-gray-900 capitalize">{clubName} Admin</h1>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Announcements & Events */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Upcoming Events</h2>
          </div>
          <button onClick={() => setShowEventModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Announce
          </button>
        </div>

        {announcements.length === 0 ? (
          <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No upcoming events or announcements.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map(ann => (
              <div key={ann.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col group hover:border-indigo-100 hover:shadow-md transition relative">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{ann.title}</h3>
                  <button onClick={() => setDeleteEventId(ann.id)} className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {deleteEventId === ann.id && (
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-md rounded-lg flex items-center justify-center p-3 z-50">
                      <div className="text-center bg-white/60 p-4 rounded-lg shadow-xl border border-white/20">
                        <p className="text-xs font-bold text-gray-900 mb-2">Are you sure?</p>
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => setDeleteEventId(null)} className="px-2 py-0.5 bg-gray-200 text-gray-800 text-[10px] font-bold rounded-md hover:bg-gray-300">Cancel</button>
                          <button onClick={() => handleDeleteEvent(ann.id)} className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-md hover:bg-red-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-gray-500 text-sm mb-4 flex-1 whitespace-pre-wrap">{ann.description}</p>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {ann.createdAt?.toDate ? new Date(ann.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-5 px-6 text-center font-bold text-sm tracking-wide transition-all capitalize border-b-2 ${activeTab === tab ? 'border-slate-900 text-slate-900 bg-slate-50/50' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
            >
              {tab} ({requests.filter(r => r.status === tab).length})
            </button>
          ))}
          <div className="border-l border-gray-100 p-2 flex items-center">
            <select value={selectedPost} onChange={(e) => setSelectedPost(e.target.value)} className="bg-gray-50 text-xs font-bold text-gray-900 py-2 px-3 rounded-lg border border-gray-200 focus:outline-none">
              <option value="All">All Posts</option>
              {POSTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-gray-500 font-medium">No {activeTab} students found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(req => (
                <div key={req.id} className="flex flex-col p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 rounded-xl flex items-center justify-center font-black text-xl uppercase shadow-inner">
                        {req.firstName.charAt(0)}{req.lastName.charAt(0)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${req.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-200/50' : req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-rose-50 text-rose-600 border border-rose-200/50'}`}>
                        {req.status}
                      </span>
                    </div>
                    
                    <h3 className="font-black text-lg text-gray-900 mb-1">{req.firstName} {req.lastName}</h3>
                    <p className="text-sm font-medium text-purple-600 mb-4">{req.post}</p>
                    
                    <div className="space-y-2 mb-6">
                      <p className="text-xs font-semibold text-gray-500 flex justify-between"><span>Branch:</span> <span className="text-gray-900">{req.branch}</span></p>
                      {req.session && <p className="text-xs font-semibold text-gray-500 flex justify-between"><span>Session:</span> <span className="text-gray-900">{req.session}</span></p>}
                      <p className="text-xs font-semibold text-gray-500 flex justify-between"><span>Reg No:</span> <span className="text-gray-900">{req.registrationNo}</span></p>
                      {req.mobileNo && <p className="text-xs font-semibold text-gray-500 flex justify-between"><span>Mobile:</span> <span className="text-gray-900">{req.mobileNo}</span></p>}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-3 mt-auto pt-4 border-t border-gray-50">
                      <button 
                        onClick={() => handleAction(req.id, req, 'approved')} 
                        className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, req, 'rejected')} 
                        className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowEventModal(false)}>
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">New Announcement</h2>
              <button onClick={() => setShowEventModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                <input 
                  type="text" 
                  value={eventTitle} 
                  onChange={(e) => setEventTitle(e.target.value)} 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-xl text-black focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Next Club Meeting"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea 
                  value={eventDesc} 
                  onChange={(e) => setEventDesc(e.target.value)} 
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-xl text-black focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32"
                  placeholder="Details about the event or announcement..."
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isCreatingEvent}
                className="w-full p-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition disabled:opacity-50 mt-2"
              >
                {isCreatingEvent ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

