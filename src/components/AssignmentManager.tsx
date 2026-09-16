import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FacultyProfile, Assignment, Submission, StudentProfile, SESSIONS, BRANCHES } from '../types';
import { Calendar, FileText, Upload, Send, Users, CheckCircle2, XCircle, Clock, Download, MoveLeft, FileSpreadsheet, FileCheck, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AssignmentManagerProps {
  faculty: FacultyProfile;
  onBack: () => void;
}

export default function AssignmentManager({ faculty, onBack }: AssignmentManagerProps) {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'submissions'>('list');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [session, setSession] = useState(SESSIONS[0]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([faculty.branch]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fileInfo, setFileInfo] = useState<{name: string, timestamp: Date} | null>(null);
  const [filterBranch, setFilterBranch] = useState<string>('All Branches');
  const [filterSession, setFilterSession] = useState<string>('All Sessions');
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'assignments'),
      where('facultyId', '==', faculty.uid),
      orderBy('date', 'asc') // Oldest first as requested
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Assignment));
      setAssignments(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'assignments');
    });

    return () => unsubscribe();
  }, [faculty.uid]);

  useEffect(() => {
    if (!selectedAssignment) return;

    const q = query(
      collection(db, 'submissions'),
      where('assignmentId', '==', selectedAssignment.id),
      orderBy('submittedAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Submission));
      setSubmissions(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'submissions');
    });

    return () => unsubscribe();
  }, [selectedAssignment]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'assignments'), {
        facultyId: faculty.uid,
        facultyName: `${faculty.firstName} ${faculty.lastName}`,
        branch: selectedBranches[0] || faculty.branch,
        branches: selectedBranches,
        session,
        title,
        description,
        fileUrl,
        date,
        createdAt: serverTimestamp()
      });
      setTitle('');
      setDescription('');
      setFileUrl('');
      setFileInfo(null);
      setActiveView('list');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'assignments');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptSubmission = async (submission: Submission) => {
    try {
      await updateDoc(doc(db, 'submissions', submission.id), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      // Verification logic: send alert/notification is implicit here via state update
      // In a real app, you might have a notifications collection
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'submissions');
    }
  };

  const handleRejectSubmission = async (submission: Submission) => {
    try {
      await updateDoc(doc(db, 'submissions', submission.id), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'submissions');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds the 10MB limit. Please choose a smaller file.');
        e.target.value = '';
        return;
      }
      
      setUploadProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          if (file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxDim = 1200;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              setFileUrl(dataUrl);
              setFileInfo({ name: file.name, timestamp: new Date() });
              setUploadProgress(null);
            };
            img.src = URL.createObjectURL(file);
          } else {
            const reader = new FileReader();
            reader.onloadend = () => {
              setFileUrl(reader.result as string);
              setFileInfo({ name: file.name, timestamp: new Date() });
              setUploadProgress(null);
            };
            reader.readAsDataURL(file);
          }
        } else {
          setUploadProgress(progress);
        }
      }, 150);
    }
  };

  const exportToCSV = () => {
    if (!selectedAssignment) return;
    const headers = ['S.No', 'Student Name', 'Status', 'Submitted At', 'Text Response'];
    const rows = submissions.map((s, i) => [
      i + 1,
      s.studentName,
      s.status.toUpperCase(),
      s.submittedAt?.toDate ? s.submittedAt.toDate().toLocaleString() : 'N/A',
      s.textResponse || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `assignment_${selectedAssignment.title.replace(/\s+/g, '_')}.csv`);
    link.click();
  };

  const openFile = (dataUrl: string) => {
    if (dataUrl.startsWith('data:image/') || dataUrl.startsWith('data:application/pdf')) {
      setPreviewFile(dataUrl);
      return;
    }
    if (dataUrl.startsWith('data:')) {
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        });
    } else {
      window.open(dataUrl, '_blank');
    }
  };

  if (activeView === 'create') {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <button onClick={() => setActiveView('list')} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 transition-colors cursor-pointer">
          <MoveLeft className="w-4 h-4" /> Back to List
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">New Assignment</h2>
            <p className="text-gray-500 font-medium tracking-tight">Assign tasks to students in your department.</p>
          </div>

          <form onSubmit={handleCreateAssignment} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Target Branches</label>
                <div className="grid grid-cols-2 gap-2">
                  {BRANCHES.map(b => (
                    <label key={b} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                      <input 
                        type="checkbox"
                        checked={selectedBranches.includes(b)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBranches(prev => [...prev, b]);
                          } else {
                            if (selectedBranches.length > 1) {
                              setSelectedBranches(prev => prev.filter(branch => branch !== b));
                            } else {
                              alert('At least one branch must be selected.');
                            }
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-gray-700">{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Session</label>
                  <select 
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Assignment Due Date</label>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Assignment Title</label>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Data Structures Workshop #1"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-black placeholder:opacity-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Task Description</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Details about the assignment..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-black placeholder:opacity-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Upload Reference File (Optional)</label>
              <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
                {uploadProgress !== null ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-600 transition-all duration-300 ease-out"
                          strokeWidth="3"
                          strokeDasharray={`${uploadProgress}, 100`}
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-sm font-bold text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-blue-600 mt-2">Uploading...</p>
                      <p className="text-xs text-gray-400 font-medium mt-1">Please wait</p>
                    </div>
                  </div>
                ) : fileUrl ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-blue-600">File Selected</p>
                      {fileInfo && (
                        <div className="mt-2 text-xs font-medium text-gray-400 space-y-1">
                          <p className="truncate max-w-[200px] text-gray-500 font-bold">{fileInfo.name}</p>
                          <p>{fileInfo.timestamp.toLocaleDateString('en-US', { weekday: 'long' })}, {fileInfo.timestamp.toLocaleDateString('en-GB')} at {fileInfo.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">Choose a file to attach</p>
                      <p className="text-xs text-gray-400 font-medium">PDF, Word, or Images accepted (Up to 10MB)</p>
                    </div>
                  </div>
                )}
                <input type="file" className="hidden" onChange={handleFileChange} disabled={uploadProgress !== null} />
              </label>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? 'Posting Task...' : 'Assign Task'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (activeView === 'submissions' && selectedAssignment) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <button onClick={() => setActiveView('list')} className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 transition-colors cursor-pointer w-fit">
            <MoveLeft className="w-4 h-4" /> Back to list
          </button>
          
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-100 transition-all cursor-pointer text-xs uppercase tracking-widest"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">{selectedAssignment.title}</h3>
              <p className="text-sm text-gray-500 font-medium">Submissions View</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {submissions.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-gray-400 font-bold italic">No submissions received yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Response</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">File</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Submitted At</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-all">
                      <td className="px-8 py-6">
                        <span className="font-bold text-gray-900">{sub.studentName}</span>
                      </td>
                      <td className="px-8 py-6 max-w-[200px]">
                        {sub.textResponse ? (
                           <p className="text-sm text-gray-600 truncate" title={sub.textResponse}>{sub.textResponse}</p>
                        ) : (
                           <p className="text-xs text-gray-400 italic">No text</p>
                        )}
                      </td>
                      <td className="px-8 py-6 cursor-pointer" onClick={() => sub.fileUrl && openFile(sub.fileUrl)}>
                        {sub.fileUrl ? (
                          <div 
                            onClick={() => sub.fileUrl && openFile(sub.fileUrl)}
                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-100 hover:scale-110 active:scale-95 transition-all shadow-sm"
                            title="View Student's Submission File"
                          >
                            <Eye className="w-5 h-5" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No File</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : sub.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                          {sub.status}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          {sub.submittedAt?.toDate ? sub.submittedAt.toDate().toLocaleString() : 'Recently'}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {sub.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleAcceptSubmission(sub)}
                              className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleRejectSubmission(sub)}
                              className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all cursor-pointer shadow-lg shadow-rose-500/10"
                            >
                              Reject
                            </button>
                          </div>
                        ) : sub.status === 'accepted' ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4" /> Verified
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-rose-600 font-black text-[10px] uppercase tracking-widest">
                            <XCircle className="w-4 h-4" /> Rejected
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all cursor-pointer">
            <MoveLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
            >
              <option value="All Branches">All Branches</option>
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select 
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
            >
              <option value="All Sessions">All Sessions</option>
              {SESSIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <button 
          onClick={() => setActiveView('create')}
          className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          + Create Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : assignments.filter((a) => (filterBranch === 'All Branches' || (a.branches ? a.branches.includes(filterBranch) : a.branch === filterBranch)) && (filterSession === 'All Sessions' || a.session === filterSession)).length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <p className="text-gray-400 font-bold italic">No assignments found.</p>
          </div>
        ) : (
          assignments
            .filter((a) => (filterBranch === 'All Branches' || (a.branches ? a.branches.includes(filterBranch) : a.branch === filterBranch)) && (filterSession === 'All Sessions' || a.session === filterSession))
            .map((assignment) => (
            <motion.div 
              whileHover={{ y: -5 }}
              key={assignment.id}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6 hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start">
                <div 
                  onClick={() => {
                    if (assignment.fileUrl) {
                      openFile(assignment.fileUrl);
                    } else {
                      alert('No reference file was uploaded by the faculty for this assignment.');
                    }
                  }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-sm ${assignment.fileUrl ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                  title={assignment.fileUrl ? "Click to view attached file" : "No file attached"}
                >
                  <Eye className="w-6 h-6" />
                </div>
                <div className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {assignment.session}
                </div>
              </div>
              
              <div>
                <h4 className="text-xl font-black text-gray-900 mb-2 truncate">{assignment.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 font-medium leading-relaxed">{assignment.description}</p>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {(assignment.branches || [assignment.branch]).map(b => (
                  <span key={b} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase tracking-widest">
                    {b.split(' ').map(w => w[0]).join('')}
                  </span>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Calendar className="w-4 h-4" />
                  Due: {new Date(assignment.date).toLocaleDateString('en-GB')}
                </div>
                <button 
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setActiveView('submissions');
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" /> Check Student Files
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">File Preview</h3>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-gray-100 p-4 drop-shadow-inner flex items-center justify-center">
                {previewFile.startsWith('data:image/') ? (
                  <img src={previewFile} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
                ) : previewFile.startsWith('data:application/pdf') ? (
                  <iframe src={previewFile} className="w-full h-[70vh] rounded-xl shadow-lg bg-white" title="PDF Preview" />
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
