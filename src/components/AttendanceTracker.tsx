import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { StudentProfile } from '../types';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp, Download, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';

interface AttendanceTrackerProps {
  student: StudentProfile;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent';
  timestamp: any;
  faculty_id?: string;
}

export default function AttendanceTracker({ student }: AttendanceTrackerProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');

  useEffect(() => {
    // Sort oldest first (asc) as requested
    const q = query(
      collection(db, 'attendance'),
      where('student_id', '==', student.uid),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const recs = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as AttendanceRecord));
      setRecords(recs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [student.uid]);

  const filteredRecords = records.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const totalClasses = records.length;
  const presentCount = records.filter(r => r.status === 'present').length;
  const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  const downloadCSV = () => {
    const headers = ['Date', 'Status', 'Time Recorded'];
    const rows = records.map(r => [
      new Date(r.date).toLocaleDateString('en-GB'),
      r.status.toUpperCase(),
      r.timestamp?.toDate ? r.timestamp.toDate().toLocaleTimeString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${student.registrationNumber || student.uid}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-3 font-sans">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Attendance Rate</h4>
          <p className={`text-4xl font-black ${percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>{percentage}%</p>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              className={`h-full ${percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-3 font-sans">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Present Classes</h4>
          <p className="text-4xl font-black text-emerald-600">{presentCount}</p>
          <p className="text-xs text-gray-400 font-bold">out of {totalClasses} recorded classes</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-3 font-sans">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
            <XCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Absent Classes</h4>
          <p className="text-4xl font-black text-rose-600">{totalClasses - presentCount}</p>
          <p className="text-xs text-gray-400 font-bold">missing recorded classes</p>
        </div>
      </div>

      {/* Records Table (Excel Format) */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden font-sans">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-gray-900">Attendance Report</h3>
              <p className="text-sm text-gray-500 font-medium tracking-tight">Structured view of your academic presence</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1 flex-1 md:flex-none">
              {(['all', 'present', 'absent'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <button 
              onClick={downloadCSV}
              disabled={records.length === 0}
              className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-xs uppercase tracking-widest cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <p className="text-gray-400 font-bold italic">No attendance records found for this selection.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">S.No</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date (DD/MM/YY)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Marked Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record, index) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5 text-sm font-black text-gray-400 tabular-nums">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${record.status === 'present' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${record.status === 'present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'present' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {record.status}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-300" />
                        {record.timestamp?.toDate ? record.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {filteredRecords.length > 0 && (
          <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">End of Records</p>
          </div>
        )}
      </div>
    </div>
  );
}
