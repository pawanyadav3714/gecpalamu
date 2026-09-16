import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, GraduationCap, ArrowRight, Building2, Users, ClipboardList, BookOpen, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import Footer from '../components/Footer';
import AnnouncementModal from '../components/AnnouncementModal';

interface Announcement {
  id: string;
  title: string;
  content: string;
  link?: string;
  createdAt: string;
}

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'publicAnnouncements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'publicAnnouncements');
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="space-y-16 md:space-y-24 pb-20 m-0 p-0">
      <div className="space-y-1 md:space-y-2 p-1 pr-1">
        {/* Simplified Announcement Trigger */}
        <div className="bg-gradient-to-r from-[#062f33] via-[#0a4a50] to-[#062f33] border-b-4 border-green-500 px-4 py-2 flex items-center gap-4 w-full shadow-lg relative">
          <button 
             onClick={() => setIsModalOpen(true)}
             className="flex-shrink-0 p-2 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 transition-colors z-20 relative"
          >
            <Megaphone className="w-5 h-5" />
          </button>
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-[#062f33] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-[#062f33] to-transparent z-10 pointer-events-none"></div>
            <div className="whitespace-nowrap animate-marquee flex w-max hover:[animation-play-state:paused] py-1 items-center">
               <div className="flex gap-8 pr-8 items-center">
                 {announcements.map((ann, i) => (
                   <span key={ann.id} className="flex items-center gap-8">
                     <div className="cursor-pointer hover:text-green-300 transition-colors flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
                        <span className="text-xl font-bold text-white tracking-wide">{ann.content}</span>
                     </div>
                     <span className="relative flex items-center justify-center animate-starburst shrink-0 ml-4">
                        <svg width="40" height="24" viewBox="0 0 100 60" className="text-red-600 fill-current drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                           <path d="M50 0L55 15L75 10L70 25L90 25L80 35L95 45L75 45L80 60L60 50L50 65L40 50L20 60L25 45L5 45L20 35L10 25L30 25L25 10L45 15Z" />
                        </svg>
                        <span className="absolute text-white text-[10px] sm:text-xs font-black tracking-wider shadow-black drop-shadow-md">NEW</span>
                     </span>
                   </span>
                 ))}
               </div>
               {/* Duplication for continuous scroll effect */}
               <div className="flex gap-8 pr-8 items-center" aria-hidden="true">
                 {announcements.map((ann, i) => (
                   <span key={`${ann.id}-dup`} className="flex items-center gap-8">
                     <div className="cursor-pointer hover:text-green-300 transition-colors flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
                        <span className="text-xl font-bold text-white tracking-wide">{ann.content}</span>
                     </div>
                     <span className="relative flex items-center justify-center animate-starburst shrink-0 ml-4">
                        <svg width="40" height="24" viewBox="0 0 100 60" className="text-red-600 fill-current drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                           <path d="M50 0L55 15L75 10L70 25L90 25L80 35L95 45L75 45L80 60L60 50L50 65L40 50L20 60L25 45L5 45L20 35L10 25L30 25L25 10L45 15Z" />
                        </svg>
                        <span className="absolute text-white text-[10px] sm:text-xs font-black tracking-wider shadow-black drop-shadow-md">NEW</span>
                     </span>
                   </span>
                 ))}
               </div>
            </div>
          </div>
        </div>
        <AnnouncementModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />

        {/* Hero Section */}
        <section className="relative min-h-[450px] md:min-h-[550px] h-auto md:h-[700px] rounded-[1.5rem] md:rounded-3xl overflow-hidden group mx-2 md:mx-0">
          <img 
          src="https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmG9GAJKyGwCLOT-7LXgr8ltqyXCqQT2F-1smkMgMq-6syCAH0h487e_YtQmO26uKJ7XAr3lnaQ1fjuFjI4WGfZDQ_ZQu0F8LQBraWZi1glk1xeGuJ-wFbRy9D34_MZP5JJJCrH=s1360-w1360-h1020-rw" 
          alt="College Campus" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/50 to-transparent flex items-center px-4 md:px-12 py-8 md:py-0">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl space-y-4 md:space-y-6 w-full"
          >
            <span className="inline-block py-1 px-4 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-widest">
              Higher Technical Degree
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white leading-tight md:leading-[1.1] tracking-tight">
              Government Engineering College <span className="text-blue-500">Palamu</span>
            </h1>
            <p className="text-sm md:text-lg text-gray-300 leading-relaxed max-w-md">
              Standardized management, seamless collaboration, and academic growth all in one portal. Join our community of students and world-class faculty.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link to="/auth?role=student" className="active:scale-75 hover:scale-110 hover:transition-all hover:duration-500 rounded-3xl py-3 px-6 border-2 border-rose-700 shadow-2xl bg-transparent text-white hover:bg-rose-600 hover:text-white hover:border-rose-600 text-center text-lg font-normal">
                Register as Student <ArrowRight className="w-4 h-4 inline ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/auth?role=faculty" className="active:scale-75 hover:scale-110 hover:transition-all hover:duration-500 rounded-3xl py-3 px-6 border-2 border-rose-700 shadow-2xl bg-transparent text-white hover:bg-rose-600 hover:text-white hover:border-rose-600 text-center text-lg font-normal">
                Faculty Portal
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      </div>

      {/* Portal Features Section */}
      <section className="px-4 md:px-0">
        <div className="text-center mb-10 md:mb-16 space-y-4">
          <h2 className="text-2xl md:text-5xl font-black text-gray-900 tracking-tight">Smart Academic Ecosystem</h2>
          <p className="text-sm md:text-base text-gray-500 font-bold max-w-2xl mx-auto italic">
            A unified platform designed for efficiency, transparency, and the pursuit of academic excellence in higher technical education.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: ShieldCheck, title: "Secure Profiles", desc: "Centralized data storage with end-to-end encryption for all academic records.", color: "text-emerald-500", bg: "bg-emerald-50" },
            { icon: ClipboardList, title: "Fast Verification", desc: "One-click approval workflow for faculty to manage departmental requests.", color: "text-blue-500", bg: "bg-blue-50" },
            { icon: BookOpen, title: "Digital Learning", desc: "Access assignments, lecture notes, and academic resources from any device.", color: "text-amber-500", bg: "bg-amber-50" },
            { icon: Users, title: "Real-time Sync", desc: "Instant notifications and updates for class schedules and examination dates.", color: "text-rose-500", bg: "bg-rose-50" },
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl transition-all h-full flex flex-col items-center text-center space-y-4"
            >
              <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 leading-tight">{feature.title}</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed italic">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Stats / Info */}
      <section className="bg-slate-950 border-2 border-gray-900 rounded-[1.5rem] md:rounded-3xl p-6 md:p-16 text-center text-white space-y-12 mx-2 md:mx-0 overflow-hidden relative shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.15),transparent)] opacity-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.4))]"></div>
        
        <div className="relative z-10 space-y-4">
          <span className="inline-block py-1 px-4 bg-rose-600/10 border border-rose-600/20 rounded-full text-rose-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
            Institutional Impact
          </span>
          <h3 className="text-2xl md:text-5xl font-black tracking-tight leading-[1.1]">Standardizing Academic Workflows</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-8 max-w-4xl mx-auto relative z-10">
          <div className="space-y-1 group cursor-default">
            <span className="text-4xl md:text-7xl font-black block text-transparent bg-clip-text bg-linear-to-b from-white to-gray-400 group-hover:to-rose-500 transition-all duration-500">10k+</span>
            <span className="text-gray-400 text-[10px] md:text-sm font-black uppercase tracking-widest opacity-80 group-hover:text-rose-400 transition-colors">Registered Students</span>
          </div>
          <div className="space-y-1 group cursor-default">
            <span className="text-4xl md:text-7xl font-black block text-transparent bg-clip-text bg-linear-to-b from-white to-gray-400 group-hover:to-blue-500 transition-all duration-500">250+</span>
            <span className="text-gray-400 text-[10px] md:text-sm font-black uppercase tracking-widest opacity-80 group-hover:text-blue-400 transition-colors">Expert Faculty</span>
          </div>
          <div className="space-y-1 group cursor-default">
            <span className="text-4xl md:text-7xl font-black block text-transparent bg-clip-text bg-linear-to-b from-white to-gray-400 group-hover:to-emerald-500 transition-all duration-500">4</span>
            <span className="text-gray-400 text-[10px] md:text-sm font-black uppercase tracking-widest opacity-80 group-hover:text-emerald-400 transition-colors">Core Branches</span>
          </div>
        </div>
      </section>
      </div>
      <Footer />
    </>
  );
}
