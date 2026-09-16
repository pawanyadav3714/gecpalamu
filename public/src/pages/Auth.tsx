import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserRole } from '../types';
import { Mail, Lock, User as UserIcon, LogIn, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = (queryParams.get('role') as UserRole) || 'student';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isSignUp) {
        // Login flow
        try {
          const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
          let userDoc;
          try {
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          } catch (err: any) {
            if (err.message.includes('offline') || err.message.includes('unavailable')) {
              setError("Cannot connect to database. If you recently created this project, please ensure Cloud Firestore is enabled in your Firebase Console.");
              await auth.signOut();
              return;
            }
            throw err;
          }
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'student') {
              navigate('/student-dashboard');
            } else if (userData.role === 'faculty') {
              navigate('/faculty-dashboard');
            } else {
              navigate('/');
            }
          } else {
            // User exists in Auth but not in Firestore - should not happen with our flow
            setError("Profile not found. Please contact support.");
            await auth.signOut();
          }
        } catch (signInError: any) {
          if (signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
            setError("Incorrect email or password");
          } else if (signInError.code === 'auth/invalid-email') {
            setError("Invalid email format");
          } else if (signInError.code === 'auth/user-not-found') {
            setError("Email not registered. Please sign up first.");
          } else {
            setError(signInError.message);
          }
        }
      } else {
        // Signup flow
        try {
          const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
          const userData = {
            uid: firebaseUser.uid,
            email,
            firstName,
            lastName,
            role
          };
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
          } catch (err: any) {
             handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
          }
          
          if (role === 'student') {
            navigate('/student-dashboard');
          } else {
            navigate('/faculty-dashboard');
          }
        } catch (signUpError: any) {
          if (signUpError.code === 'auth/email-already-in-use') {
            setError("This email is already registered. Please sign in instead.");
            setIsSignUp(false); // Switch UI to Sign In
          } else if (signUpError.code === 'auth/invalid-email') {
            setError("Invalid email format");
          } else {
            setError(signUpError.message);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        return;
      }
      
      if (!userDoc.exists()) {
        const nameParts = firebaseUser.displayName?.split(' ') || ['', ''];
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: nameParts[0],
          lastName: nameParts[1] || '',
          role: 'student' as UserRole
        };
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        } catch (err: any) {
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
        navigate('/student-dashboard');
      } else {
        const userData = userDoc.data();
        if (userData.role === 'student') {
          navigate('/student-dashboard');
        } else if (userData.role === 'faculty') {
          navigate('/faculty-dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 md:mt-12 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-2xl shadow-2xl border border-gray-100 mx-2 md:mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
          {role === 'student' ? 'Student Portal' : 'Faculty Portal'}
        </h2>
        <p className="text-sm md:text-base text-gray-500 font-medium leading-tight">
          {isSignUp ? 'Create your account to get started' : 'Sign in to management your profile'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <AnimatePresence mode="wait">
          {isSignUp && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase ml-1">First Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-black placeholder:opacity-100 text-black"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase ml-1">Last Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-black placeholder:opacity-100 text-black"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 uppercase ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@university.edu"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-black placeholder:opacity-100 text-black"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 uppercase ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-black placeholder:opacity-100 text-black"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500 ml-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </>
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500 font-semibold tracking-wider">Or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
           as Google
        </button>
      </form>

      <div className="mt-8 text-center">
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
