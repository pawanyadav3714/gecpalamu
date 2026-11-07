import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, setDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { StudentProfile, Assignment, Submission } from '../types';
import { Calendar, FileText, Upload, Send, CheckCircle2, XCircle, Clock, AlertCircle, FileCheck, CheckCircle, X, Eye } from 'lucide-react';

const FacultyNameDisplay = ({ facultyId, initialName }: { facultyId: string, initialName?: string }) => {
  const [name, setName] = useState(initialName);
  
  useEffect(() => {
    if (initialName) return;
    const fetchName = async () => {
      try {
        const docRef = doc(db, 'facultyProfiles', facultyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(`${data.firstName} ${data.lastName}`);
        } else {
          setName('Faculty Member');
        }
      } catch (err) {
        setName('Faculty Member');
      }
    };
    fetchName();
  }, [facultyId, initialName]);

  return <span className="font-black text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">{name || 'Loading...'}</span>;
};
import { motion, AnimatePresence } from 'framer-motion';

interface AssignmentTrackerProps {
  student: StudentProfile;
}

export default function AssignmentTracker({ student }: AssignmentTrackerProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseFile, setResponseFile] = useState('');
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'assignments'),
      where('session', '==', student.session),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Assignment));
      // Filter locally for branch to support array OR legacy string
      const filtered = docs.filter(a => a.branches?.includes(student.branch) || a.branch === student.branch);
      setAssignments(filtered);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'assignments');
    });

    return () => unsubscribe();
  }, [student.branch, student.session]);

  useEffect(() => {
    const q = query(
      collection(db, 'submissions'),
      where('studentId', '==', student.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Submission));
      setSubmissions(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'submissions');
    });

    return () => unsubscribe();
  }, [student.uid]);

  const handleSubmit = async (assignmentId: string) => {
    setSubmitting(assignmentId);
    try {
      const submissionId = `${student.uid}_${assignmentId}`;
      await setDoc(doc(db, 'submissions', submissionId), {
        assignmentId,
        studentId: student.uid,
        studentName: `${student.firstName} ${student.lastName}`,
        textResponse: responseText,
        fileUrl: responseFile,
        status: 'pending',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setResponseText('');
      setResponseFile('');
      setSubmitting(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'submissions');
      setSubmitting(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
              setResponseFile(dataUrl);
              setUploadProgress(null);
            };
            img.src = URL.createObjectURL(file);
          } else {
            const reader = new FileReader();
            reader.onloadend = () => {
              setResponseFile(reader.result as string);
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

  const isExpired = (submittedAt: any) => {
    if (!submittedAt) return false;
    const submissionDate = submittedAt.toDate ? submittedAt.toDate() : new Date(submittedAt);
    const diffTime = Math.abs(new Date().getTime() - submissionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7;
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

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assignments.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <p className="text-gray-400 font-black italic">No assignments found for your session.</p>
          </div>
        ) : (
          assignments.map((assignment) => {
            const submission = submissions.find(s => s.assignmentId === assignment.id);
            const expired = submission && isExpired(submission.submittedAt);
            
            if (expired) return null; // Automatically removed after 7th day as requested
            
            const textColorClass = 'text-gray-900';
            const subTextColorClass = 'text-gray-400';
            const sub2TextColorClass = 'text-gray-500';

            return (
              <motion.div 
                key={assignment.id}
                className="p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 hover:shadow-xl transition-all flex flex-col relative bg-white"
              >
                {/* Status Indicator Light */}
                <div 
                  className={`absolute top-6 right-6 w-3 h-3 rounded-full ${
                    !submission 
                      ? 'bg-rose-500 animate-pulse' 
                      : submission.status === 'pending' 
                        ? 'bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.8)]'
                        : submission.status === 'rejected'
                        ? 'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.8)]'
                        : 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]'
                  }`}
                />

                <div className="flex justify-between items-start pr-8">
                  <div 
                    onClick={() => {
                      if (assignment.fileUrl) {
                        openFile(assignment.fileUrl);
                      } else {
                        alert('No reference file was uploaded by the faculty for this assignment.');
                      }
                    }}
                    className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-sm ${submission?.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : submission?.status === 'rejected' ? 'bg-rose-100 text-rose-600' : assignment.fileUrl ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                    title={assignment.fileUrl ? "Click to view attached file" : "No attached file found"}
                  >
                    {submission?.status === 'accepted' ? <CheckCircle className="w-6 h-6" /> : submission?.status === 'rejected' ? <XCircle className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${subTextColorClass}`}>Assignment Due</p>
                    <p className={`text-sm font-bold ${textColorClass}`}>{new Date(assignment.date).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className={`text-2xl font-black mb-2 leading-tight uppercase tracking-tight ${textColorClass}`}>{assignment.title}</h3>
                    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${subTextColorClass}`}>
                      <span>Assigned by:</span>
                      <FacultyNameDisplay facultyId={assignment.facultyId} initialName={assignment.facultyName} />
                    </div>
                  </div>
                  <p className={`text-sm font-medium leading-relaxed ${sub2TextColorClass}`}>{assignment.description}</p>
                </div>

                <AnimatePresence>
                  {submission && submission.status === 'accepted' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-600"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-xs font-black uppercase tracking-widest">Assignment Accepted</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-6 border-t border-gray-50">
                  {submission ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-400 uppercase tracking-widest">Status</span>
                        <span className={`px-4 py-1.5 rounded-full font-black uppercase tracking-[0.1em] ${submission.status === 'accepted' ? 'bg-emerald-500 text-white' : submission.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {submission.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        Submitted {submission.submittedAt?.toDate ? submission.submittedAt.toDate().toLocaleDateString() : 'Recently'}
                      </div>
                      {(submission.textResponse || submission.fileUrl) && (
                        <div className="mt-4 pt-4 border-t border-gray-100 pb-2">
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Your Answer</h5>
                          {submission.textResponse && (
                            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 font-medium whitespace-pre-wrap mb-3">
                              {submission.textResponse}
                            </div>
                          )}
                          {submission.fileUrl && (
                            <button 
                              onClick={() => {
                                if (submission.fileUrl) {
                                  openFile(submission.fileUrl);
                                }
                              }} 
                              className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:text-blue-700 hover:underline cursor-pointer"
                            >
                              <Eye className="w-4 h-4" /> View Submitted Attachment
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <textarea 
                          rows={2}
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Your answer or comments..."
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-black placeholder:opacity-100 text-black"
                        />
                        {uploadProgress !== null ? (
                          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold">
                            <div className="relative w-5 h-5 flex items-center justify-center">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-white"
                                  strokeWidth="4"
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                  className="text-blue-600 transition-all duration-300 ease-out"
                                  strokeWidth="4"
                                  strokeDasharray={`${uploadProgress}, 100`}
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                            </div>
                            <span>Uploading {uploadProgress}%</span>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all cursor-pointer">
                            <Upload className="w-4 h-4" /> 
                            {responseFile ? 'File Attached' : 'Attach File (Max 10MB)'}
                            <input type="file" className="hidden" onChange={handleFileChange} />
                          </label>
                        )}
                      </div>
                      <button 
                        onClick={() => handleSubmit(assignment.id)}
                        disabled={submitting === assignment.id || (!responseText && !responseFile)}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {submitting === assignment.id ? 'Uploading...' : 'Assign Task'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Excel Style Summary */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mt-12">
          <div className="p-8 border-b border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Assignment History</h3>
            <p className="text-sm text-gray-500 font-medium tracking-tight">Full record of academic tasks and status</p>
          </div>
          <div className="overflow-x-auto p-8 pt-0">
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 bg-gray-100 w-16 text-center">S.No</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 bg-gray-100">Task</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 bg-gray-100">Assigned By</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 bg-gray-100 min-w-[200px]">Problem Statement</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 bg-gray-100">Due Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 bg-gray-100">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 bg-gray-100">Submitted At</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200 bg-gray-100">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assignments.map((a, index) => {
                  const sub = submissions.find(s => s.assignmentId === a.id);
                  return (
                    <tr key={a.id} className="hover:bg-blue-50/30 transition-all">
                      <td className="px-6 py-4 text-sm font-bold text-gray-500 border border-gray-200 text-center">{index + 1}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 border border-gray-200">{a.title}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                        <FacultyNameDisplay facultyId={a.facultyId} initialName={a.facultyName} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 border border-gray-200 whitespace-pre-wrap">{a.description}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-500 border border-gray-200 whitespace-nowrap">{new Date(a.date).toLocaleDateString('en-GB')}</td>
                      <td className="px-6 py-4 border border-gray-200 whitespace-nowrap">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${sub ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                          {sub ? 'Submitted' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                        {sub?.submittedAt?.toDate ? sub.submittedAt.toDate().toLocaleDateString() + ' ' + sub.submittedAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                      </td>
                      <td className="px-6 py-4 border border-gray-200 whitespace-nowrap">
                        {sub?.status === 'accepted' ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4" /> Accepted
                          </div>
                        ) : sub?.status === 'rejected' ? (
                          <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-widest">
                            <XCircle className="w-4 h-4" /> Rejected
                          </div>
                        ) : sub ? (
                          <span className="text-amber-600 font-black text-[10px] uppercase tracking-widest">Awaiting Verification</span>
                        ) : (
                          <span className="text-rose-400 font-black text-[10px] uppercase tracking-widest">Not Started</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
