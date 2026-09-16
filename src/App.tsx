import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { User } from './types';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import DepartmentPage from './pages/Departments';
import FacultyPage from './pages/Faculty';
import Placements from './pages/Placements';
import Clubs from './pages/Clubs';
import Gallery from './pages/Gallery';
import Syllabus from './pages/Syllabus';
import Roadmaps from './pages/Roadmaps';
import ClubDashboard from './pages/ClubDashboard';
import ClubAdminPortal from './pages/ClubAdminPortal';
import ClubStudentPortal from './pages/ClubStudentPortal';

function AppContent({ user }: { user: User | null }) {
  const location = useLocation();
  const isSyllabus = location.pathname === '/syllabus';
  const isRoadmaps = location.pathname === '/roadmaps';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {(!isSyllabus && !isRoadmaps) && <Navbar user={user} />}
      <main className={(isSyllabus || isRoadmaps) ? "flex-1 p-1" : "w-full m-0 p-1 flex-1"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to={user.role === 'student' ? '/student-dashboard' : '/faculty-dashboard'} />} />
          <Route path="/departments" element={<DepartmentPage />} />
          <Route path="/faculty" element={<FacultyPage />} />
          <Route path="/placements" element={<Placements />} />
          <Route path="/clubs" element={<Clubs />} />
          <Route path="/clubs/:clubName" element={<ClubDashboard user={user} />} />
          <Route path="/club-admin/:clubName" element={<ClubAdminPortal />} />
          <Route path="/club-student/:clubName" element={<ClubStudentPortal />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/syllabus" element={<Syllabus />} />
          <Route path="/roadmaps" element={<Roadmaps />} />
          
          <Route 
            path="/student-dashboard/*" 
            element={user?.role === 'student' ? <StudentDashboard user={user} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/faculty-dashboard/*" 
            element={user?.role === 'faculty' ? <FacultyDashboard user={user} /> : <Navigate to="/" />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            setUser(null);
          }
        } catch (error: any) {
          if (error.message?.includes('offline') || error.code === 'unavailable') {
            console.warn("Network error while trying to fetch user data. Operating without user data temporarily.", error.message);
            // Don't fully handle error to avoid crashing layout; user might appear signed out though.
            setUser(null); 
          } else {
            setUser(null);
            console.error("Error fetching user data:", error);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Detect page refresh
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entry && entry.type === 'reload') {
      window.location.hash = '/';
    }
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <AppContent user={user} />
    </Router>
  );
}
