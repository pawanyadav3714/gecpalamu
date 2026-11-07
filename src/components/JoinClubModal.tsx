import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { BRANCHES, SESSIONS } from '../types';

interface JoinClubModalProps {
  onClose: () => void;
  clubName: string;
}

export default function JoinClubModal({ onClose, clubName }: JoinClubModalProps) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [session, setSession] = useState(SESSIONS[0]);
  const [regNumber, setRegNumber] = useState('');
  const [isRegisteringAsAdmin, setIsRegisteringAsAdmin] = useState(false);
  const [isAdminAssigned, setIsAdminAssigned] = useState(false);
  const [isClubAdmin, setIsClubAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkClubAdmin = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'clubs', clubName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.adminId) {
            setIsAdminAssigned(true);
            if (data.adminId === auth.currentUser.uid) {
              setIsClubAdmin(true);
            }
          }
        }
      } catch (err: any) {
        if (err.message?.includes('offline')) {
          console.warn("Offline: Using local cache for club data");
        } else {
          handleFirestoreError(err, OperationType.GET, `clubs/${clubName}`);
        }
      }
    };
    checkClubAdmin();
  }, [clubName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("You must be logged in to perform this action.");
      return;
    }
    setSubmitting(true);
    
    try {
      if (isRegisteringAsAdmin) {
        // Register Club Admin
        await setDoc(doc(db, 'clubs', clubName), {
          name: clubName,
          adminId: auth.currentUser.uid,
          adminName: `${firstName} ${lastName}`,
          adminReg: regNumber
        });
        navigate(`/club-dashboard/${clubName}`);
      } else {
        // Send Join Request
        await addDoc(collection(db, `clubs/${clubName}/requests`), {
          clubName,
          studentUid: auth.currentUser.uid,
          studentName: `${firstName} ${lastName}`,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `clubs/${clubName}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900">
            {isClubAdmin ? `${clubName} Dashboard` : isRegisteringAsAdmin ? `Register as Admin of ${clubName}` : `Join ${clubName}`}
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {isClubAdmin ? (
          <div className="space-y-4">
            <p className="text-gray-600 font-medium">You are the admin of this club.</p>
            <button 
              onClick={() => navigate(`/club-dashboard/${clubName}`)}
              className="w-full p-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full p-4 bg-gray-50 rounded-2xl border font-bold text-gray-900" />
            <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full p-4 bg-gray-50 rounded-2xl border font-bold text-gray-900" />
            <input type="text" placeholder="Registration Number" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} required className="w-full p-4 bg-gray-50 rounded-2xl border font-bold text-gray-900" />
            
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border font-bold text-gray-900">
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={session} onChange={(e) => setSession(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border font-bold text-gray-900">
              {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

          {!isAdminAssigned && (
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <input type="checkbox" checked={isRegisteringAsAdmin} onChange={(e) => setIsRegisteringAsAdmin(e.target.checked)} />
              Register as Club Admin
            </label>
          )}

          <button type="submit" disabled={submitting} className="w-full p-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
            {submitting ? 'Submitting...' : isRegisteringAsAdmin ? 'Create Admin' : 'Send Join Request'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
