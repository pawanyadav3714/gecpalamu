import { Cpu, Zap, Settings, Landmark, Users, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';

const DEPARTMENTS = [
  { 
    id: 'CSE', 
    name: "Computer Science and Engineering", 
    icon: <Cpu />, 
    color: "bg-blue-600", 
    desc: "Leading the digital revolution with cutting-edge software and AI research.", 
    hasSyllabus: true,
    seats: 60,
    cutoff: "90%ile & above"
  },
  { 
    id: 'EE', 
    name: "Electrical Engineering", 
    icon: <Zap />, 
    color: "bg-amber-600", 
    desc: "Powering the future through sustainable energy and electronics.", 
    hasSyllabus: true,
    seats: 120,
    cutoff: "85%ile & above"
  },
  { 
    id: 'ME', 
    name: "Mechanical Engineering", 
    icon: <Settings />, 
    color: "bg-slate-700", 
    desc: "Design and manufacturing of complex systems and robotics.", 
    hasSyllabus: true,
    seats: 60,
    cutoff: "85%ile & above"
  },
  { 
    id: 'CE', 
    name: "Civil Engineering", 
    icon: <Landmark />, 
    color: "bg-emerald-700", 
    desc: "Building sustainable infrastructure for a better tomorrow.", 
    hasSyllabus: true,
    seats: 60,
    cutoff: "80%ile & above"
  }
];

export default function Departments() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 pb-20 px-4 md:px-0">
      <header className="text-center space-y-4 max-w-2xl mx-auto pl-1">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">Academic Departments</h1>
        <p className="text-sm md:text-base text-gray-500 font-medium">Explore our specialized branches of engineering excellence.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {DEPARTMENTS.map((dept, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={dept.name} 
            className="group block bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all"
          >
            <div className={`w-16 h-16 md:w-20 md:h-20 ${dept.color} rounded-full flex items-center justify-center text-white mb-6 md:mb-8 shadow-xl shadow-opacity-30 group-hover:scale-110 transition-transform`}>
              <div className="w-8 h-8 md:w-10 md:h-10">{dept.icon}</div>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">{dept.name}</h2>
            <p className="text-sm md:text-base text-gray-500 leading-relaxed font-medium mb-6">{dept.desc}</p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-black text-gray-900">{dept.seats} Seats</span>
              </div>
              {dept.cutoff && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-black text-blue-700">{dept.cutoff}</span>
                </div>
              )}
            </div>

            <div className="mt-auto pt-8 border-t border-gray-50 flex flex-row flex-wrap gap-4">
              <button 
                onClick={() => dept.hasSyllabus && navigate(`/syllabus?dept=${dept.id}`)}
                className={`text-sm font-black uppercase tracking-widest active:scale-75 hover:transition-all hover:duration-500 rounded-3xl py-3 px-6 border-2 shadow-2xl transition-all ${
                  dept.hasSyllabus 
                    ? 'hover:scale-105  active:scale-75 hover:transition-all hover:duration-500 rounded-3xl text-black py-3 px-6 border-2 border-rose-600 shadow-2xl hover:bg-rose-700 hover:border-blue-950' 
                    : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                }`}
              >
                {dept.hasSyllabus ? 'Syllabus' : 'Coming Soon'}
              </button>
              {dept.id === 'CSE' && (
                <button 
                  onClick={() => navigate('/roadmaps')}
                  className="hover:scale-105 active:scale-75 font-medium hover:transition-all hover:duration-500 rounded-3xl text-black py-3 px-6 border-2 border-rose-600 shadow-2xl hover:bg-rose-700 hover:border-blue-950"
                >
                  Roadmaps
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
