import { Sparkles, Code, Music, Trophy, Car, Brush, School, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JoinClubModal from '../components/JoinClubModal';
const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.startsWith('/') ? path.slice(1) : path}`;

const d1 = withBase("/gallery/col1.jpg");
const d2 = withBase("/gallery/col2.jpg");
const img3 = withBase("/gallery/col3.jpg");
const img4 = withBase("/gallery/col4.png");
const img6 = withBase("/gallery/col5.jpg");
const img7 = withBase("/gallery/col6.png");
const img8 = withBase("/gallery/col7.jpg");
const img9 = withBase("/gallery/c1.jpeg");

const CLUBS = [
  { name: "CODE-HACK Club", desc: "CODE-HACK Club is a student-driven technical community focused on enhancing coding skills, problem-solving abilities, and innovation through regular workshops, hackathons, and collaborative projects.", icon: <Code />, color: "bg-slate-900" },
  { name: "NSS Club", desc: "Pushing boundaries in inter-college sports and fitness.", icon: <Trophy />, color: "bg-orange-600" },
  { name: "IIC Club", desc: "Celebrate the rhythm of life with our music and dance society.", icon: <Music />, color: "bg-fuchsia-600" },
  { name: "SIC Club", desc: "Our creative arts and design community for the visionary.", icon: <Car />, color: "bg-sky-500" },
  { name: "Arts and Culture", desc: "Our creative arts and design community for the visionary.", icon: <School />, color: "bg-sky-500" },
  { name: "RangShrijan Club of Painting", desc: "Our creative arts and design community for the visionary.", icon: <Brush />, color: "bg-sky-500" },
  { name: "Udaan Bharat", desc: "Our creative arts and design community for the visionary.", icon: <Send />, color: "bg-sky-500" },
  { name: "Sandhan Club", desc: "Our creative arts and design community for the visionary.", icon: <Sparkles />, color: "bg-sky-500" },
  { name: "Comic Club", desc: "Our creative arts and design community for the visionary.", icon: <Sparkles />, color: "bg-sky-500" },
  { name: "E-Cell", desc: "Entrepreneurship.", icon: <Sparkles />, color: "bg-sky-500" }
];

export default function Clubs() {
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="space-y-12 pb-20 px-4 md:px-0 mt-2">
      <header className="text-center space-y-4 max-w-2xl mx-auto pl-1">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">Campus Life & Clubs</h1>
        <p className="text-sm md:text-base text-gray-500 font-medium">Beyond academics—find your tribe and fuel your passion.</p>
      </header>
      
     

      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {CLUBS.map((club, i) => (
            <motion.div 
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate(`/clubs/${club.name}`)}
              key={club.name} 
              className="group flex flex-col sm:flex-row gap-6 md:gap-8 bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all items-center text-center sm:text-left cursor-pointer"
            >
              <div className={`w-20 h-20 md:w-24 md:h-24 shrink-0 ${club.color} rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-opacity-30 group-hover:rotate-12 transition-transform`}>
                <div className="w-10 h-10 md:w-12 md:h-12">{club.icon}</div>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-black text-gray-900">{club.name}</h2>
                <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">{club.desc}</p>
                <div 
                  className="px-6 py-2 bg-gray-50 text-gray-900 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors cursor-pointer inline-block"
                >
                  View Details
                </div>
              </div>
            </motion.div>
        ))}
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 my-12 space-y-6">
        {[d1, d2, img3, img4, img6, img7, img8, img9]
          .sort(() => Math.random() - 0.5)
          .map((src, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group overflow-hidden rounded-3xl bg-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 break-inside-avoid relative"
            >
              <img 
                src={src} 
                alt={`Club Activity ${i + 1}`} 
                className="w-full h-auto transition-transform duration-700 group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
      </div>

      <AnimatePresence>
        {selectedClub && (
          <JoinClubModal clubName={selectedClub} onClose={() => setSelectedClub(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
