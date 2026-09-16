import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, writeBatch, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { StudentProfile, FacultyProfile } from '../types';
const defaultProfileImg = "https://api.dicebear.com/7.x/initials/svg?seed=Profile";
import { ArrowLeft, MoveLeft, Check, X, Calendar as CalendarIcon, Save, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttendanceManagerProps {
  faculty: FacultyProfile;
  students: StudentProfile[];
  onBack: () => void;
}

interface AttendanceState {
  [studentId: string]: 'present' | 'absent';
}

export default function AttendanceManager({ faculty, students, onBack }: AttendanceManagerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceState>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState('All');
  const [success, setSuccess] = useState(false);

  // Fetch existing attendance for the selected date
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'attendance'),
      where('faculty_id', '==', faculty.uid),
      where('date', '==', selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const existing: AttendanceState = {};
      snap.docs.forEach(d => {
        const data = d.data();
        existing[data.student_id] = data.status;
      });
      setAttendance(existing);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate, faculty.uid]);

  const handleToggle = (studentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    const newState: AttendanceState = {};
    filteredStudents.forEach(s => {
      newState[s.uid] = status;
    });
    setAttendance(prev => ({ ...prev, ...newState }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSuccess(false);
    const batch = writeBatch(db);

    try {
      // We only save students who have a status marked
      Object.entries(attendance).forEach(([studentId, status]) => {
        const student = students.find(s => s.uid === studentId);
        if (!student) return;

        const recordId = `${studentId}_${selectedDate}`;
        const recordRef = doc(db, 'attendance', recordId);
        batch.set(recordRef, {
          student_id: studentId,
          student_name: `${student.firstName} ${student.lastName}`,
          faculty_id: faculty.uid,
          date: selectedDate,
          status,
          timestamp: serverTimestamp()
        });
      });

      await batch.commit();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'attendance');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSession = sessionFilter === 'All' || s.session === sessionFilter;
    return matchesSearch && matchesSession;
  });

  const sessions = ['All', ...new Set(students.map(s => s.session))];

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex justify-start">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all border border-gray-100 shadow-sm cursor-pointer"
        >
          <MoveLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      {success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-12 shadow-xl border border-emerald-100 text-center space-y-8"
        >
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Check className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-gray-900">Attendance Submitted!</h3>
            <p className="text-gray-500 font-medium">
              Records for <span className="text-blue-600 font-bold">{new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span> have been saved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={() => {
                setSuccess(false);
                setAttendance({});
              }}
              className="px-8 py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
            >
              Mark Another Date
            </button>
            <button 
              onClick={onBack}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Header Controls */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-2xl font-black text-gray-900">Mark Attendance</h3>
              <p className="text-gray-500 font-medium">Branch: {faculty.branch}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="relative">
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-3 bg-blue-50 border-none rounded-xl font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              
              <button 
                onClick={handleSubmit}
                disabled={saving || Object.keys(attendance).length === 0}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Submit Attendance'}
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <input 
                type="text" 
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold placeholder:text-black placeholder:opacity-100 text-black"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select 
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                className="p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 flex-1 md:flex-none cursor-pointer"
              >
                {sessions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleMarkAll('present')} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 uppercase tracking-wider cursor-pointer">All Present</button>
              <button onClick={() => handleMarkAll('absent')} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 uppercase tracking-wider cursor-pointer">All Absent</button>
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-black text-gray-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-gray-400 italic">No students found</td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.uid} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={student.profilePicture || defaultProfileImg} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                          <div>
                            <p className="font-bold text-gray-900">{student.firstName} {student.lastName}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{student.registrationNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleToggle(student.uid, 'present')}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${attendance[student.uid] === 'present' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleToggle(student.uid, 'absent')}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${attendance[student.uid] === 'absent' ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
