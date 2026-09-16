import React, { useState } from 'react';
import { X, Send, Upload } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BRANCHES, SESSIONS } from '../types';

interface ExaminationAlertFormProps {
  onClose: () => void;
  facultyBranch: string;
}

export default function ExaminationAlertForm({ onClose, facultyBranch }: ExaminationAlertFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetBranches, setTargetBranches] = useState<string[]>([facultyBranch]);
  const [targetSessions, setTargetSessions] = useState<string[]>([]);
  const [fileData, setFileData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 300 * 1024) { // 300 KB limit to stay within Firestore 1MB document limit
        alert("File too large. Please upload an image/PDF smaller than 300KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'examinationAlerts'), {
        title,
        content,
        targetBranches,
        targetSessions,
        fileData,
        createdAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'examinationAlerts');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900">Send Alert</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Alert Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl border font-bold text-2xl font-medium text-gray-900"
          />
          <textarea 
            placeholder="Alert Details"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl border font-medium h-32 text-2xl text-gray-900"
          />
          
          <div className="space-y-2">
            <p className="text-xs font-black uppercase text-gray-400">Target Branches</p>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map(b => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setTargetBranches(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])}
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${targetBranches.includes(b) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase text-gray-400">Target Sessions</p>
            <div className="flex flex-wrap gap-2">
              {SESSIONS.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setTargetSessions(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${targetSessions.includes(s) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase text-gray-400">Attachment</p>
            <label className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl border cursor-pointer hover:bg-gray-100">
              <Upload className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-bold text-gray-600">{fileData ? 'File Selected' : 'Upload File (Max 1MB)'}</span>
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full p-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
          >
            {submitting ? 'Sending...' : 'Send Alert'}
          </button>
        </form>
      </div>
    </div>
  );
}
