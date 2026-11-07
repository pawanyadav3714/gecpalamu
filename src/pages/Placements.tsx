import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart3, Handshake, X, GraduationCap, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.startsWith('/') ? path.slice(1) : path}`;

const p1 = withBase("/placement/p1.png");
const p2 = withBase("/placement/p2.png");
const p3 = withBase("/placement/p3.png");
const p4 = withBase("/placement/p4.png");

const STATS = [
  { label: "Placement Rate", value: "80-85%", icon: <TrendingUp /> },
  { label: "Highest Package", value: "8 LPA", icon: <BarChart3 /> },
  { label: "Fortune 500 Partners", value: "50+", icon: <Handshake /> }
];

const RECRUITERS = [
  { id: "abg", name: "Aditya Birla Group", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ-SuYmUAFmxenkCM5m62Ycww3V6yCecCyMg&s" },
  { id: "pinclick", name: "Pinclick", logo: "https://www.pinclick.com/images/uploads/crm/lead_source/1547729312828pinclick%20logo.png" },
  { id: "cummins", name: "Cummins", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaQGZvK0Tdf-UoLYSWwlS0kJrs15qY67f33Q&s" },
  { id: "ericsson", name: "Ericsson", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3saYKyfAza5nxd8ln41vyF1DycKYowONLpg&s" },
  { id: "jindal", name: "Jindal Steel & Power", logo:" https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzcoWgpfDPRET8HIInI4JpWlWiYleoxJGoMg&s" },
  { id: "deloitte", name: "Deloitte", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4KxGGuDCCkaH9k84NqQ7s9KCIa1gCIaxmwg&s" },
  { id: "tata-hitachi", name: "Tata Hitachi", logo: "https://play-lh.googleusercontent.com/054C8bxfgQJlQfe3FNBB8X2PqZE6kSLzSf5gwQkRePsYdZXE_kgEIYI5zYjF4Ar8WUOv" },
  { id: "tata-steel", name: "Tata Steel", logo: "https://iconape.com/wp-content/files/pa/273000/svg/273000.svg" },
  { id: "vedanta", name: "Vedanta", logo: "https://img.etimg.com/thumb/width-1200,height-900,imgsize-54360,resizemode-75,msid-47148974/industry/indl-goods/svs/metals-mining/vedanta-limited-launches-new-logo.jpg" },
  { id: "acc", name: "ACC Limited", logo: "https://cdn.vectorstock.com/i/1000v/74/58/acc-cement-logo-vector-50147458.jpg" },
  { id: "yamaha", name: "Yamaha", logo: "https://e7.pngegg.com/pngimages/194/493/png-clipart-yamaha-motor-company-yamaha-corporation-motorcycle-logo-motorcycle-emblem-trademark-thumbnail.png" },
  { id: "jsw", name: "JSW Group", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/JSW_Group_logo.svg/960px-JSW_Group_logo.svg.png" },
  { id: "adani", name: "Adani", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjEqCVYgFpD9VNNvfhbHG5y9WT3OkagSS82A&s" },
  { id: "cognizant", name: "Cognizant", logo: "https://www.legaleraonline.com/h-upload/2025/09/01/1651875-cognizant.jpg" },
  { id: "vedantu", name: "Vedantu", logo: "https://yt3.googleusercontent.com/CDJiBjvgZR7ytGXGd7_jI3ag8cDsWbs3e5KCRBZjAmqY-fezitJT45gIzzBE5TaHB6y4rZ-WZA=s900-c-k-c0x00ffffff-no-rj" },
  { id: "byjus", name: "Byjus", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJk0DOlxyMu1mHxwNNg4rAF9_BRKU-VW3M-w&s" },
  { id: "tcs", name: "TCS", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Tata_Consultancy_Services_old_logo.svg/1280px-Tata_Consultancy_Services_old_logo.svg.png" },
  { id: "reliance", name: "Reliance Industries", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7fc2nkq1mU0hilNgxQChqGNgm5Yrpdm4c2A&s" },
  { id: "dalmia", name: "Dalmia Bharat", logo: "https://mma.prnewswire.com/media/681292/Dalmia_Bharat_Limited_Logo.jpg?p=twitter" },
  { id: "tata-power", name: "Tata Power", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOeCc21m-jdjOGTQvRvHiApduq8pPMerONOQ&s" },
  { id: "hul", name: "Hindustan Unilever", logo: "https://e7.pngegg.com/pngimages/716/500/png-clipart-unilever-logo-brand-personal-care-company-hindustan-miscellaneous-text.png" },
  { id: "sify", name: "Sify", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Sify.png" },
  { id: "maruti", name: "Maruti Suzuki", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuVcq-AhqxGLUn2fsDkFp1tCzuDXK-zAqnkQ&s" },
  { id: "ultratech", name: "UltraTech Cement", logo: "https://i.pinimg.com/736x/98/4d/60/984d60630186e440e9c01655c3e50f1b.jpg" },
  { id: "wipro", name: "Wipro", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAOX1nXTIWzYqW9WvyNVAP2gNhkpa79W09Hg&s" }
];

// Mock data generator for branch-wise placement
const getPlacementData = (companyName: string) => [
  { branch: 'Mechanical', hired: parseFloat((Math.random() * 8 + 5).toFixed(1)), package: parseFloat((Math.random() * 4 + 4).toFixed(1)) },
  { branch: 'Civil', hired: parseFloat((Math.random() * 6 + 4).toFixed(1)), package: parseFloat((Math.random() * 3 + 3.5).toFixed(1)) },
  { branch: 'Computer Science', hired: parseFloat((Math.random() * 10 + 6).toFixed(1)), package: parseFloat((Math.random() * 5 + 5).toFixed(1)) },
  { branch: 'Electrical', hired: parseFloat((Math.random() * 7 + 5).toFixed(1)), package: parseFloat((Math.random() * 4 + 4).toFixed(1)) },
];

export default function Placements() {
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const chartData = selectedCompany ? getPlacementData(selectedCompany.name) : [];

  return (
    <div className="space-y-12 md:space-y-20 pb-20 px-4 md:px-0">
      {/* Header Section */}
      <header className="relative py-12 md:py-20 px-6 md:px-8 bg-blue-600 rounded-[2rem] md:rounded-[4rem] text-white overflow-hidden text-center shadow-2xl pl-1">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col items-center space-y-6 md:space-y-8">
          <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-12 group/photo">
            <div className="relative">
              <div className="absolute -inset-1 bg-linear-to-r from-rose-500 to-amber-500 rounded-full blur opacity-25 group-hover/photo:opacity-50 transition duration-1000 group-hover/photo:duration-200"></div>
              <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white overflow-hidden shadow-3xl shadow-rose-600 group-hover/photo:scale-105 transition duration-300 active:scale-95 cursor-pointer">
                <img 
                  src={withBase("/faculty/vinit.png")} 
                  alt="Dr. Vineet Shekher" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            
            {/* Hover Info Box */}
            <div className="opacity-0 translate-y-4 group-hover/photo:opacity-100 group-hover/photo:translate-y-0 transition-all duration-300 md:absolute md:left-full md:ml-8 md:translate-y-0 md:translate-x-4 group-hover/photo:md:translate-x-0 z-20">
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 text-left min-w-[280px] shadow-2xl relative">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white/10 backdrop-blur-xl border-l border-b border-white/20 rotate-45 hidden md:block"></div>
                <div className="w-10 h-1 bg-blue-400 rounded-full mb-4"></div>
                <h3 className="text-blue-200 font-black uppercase tracking-widest text-[10px] mb-3">Academic Leadership</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                    <span className="text-sm font-bold text-white leading-tight">Training & Placement Officer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                    <span className="text-sm font-bold text-white leading-tight">HOD (Electrical Department)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                    <span className="text-sm font-bold text-white leading-tight">Specialist in Signal Systems</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="space-y-4 md:space-y-6 max-w-5xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              <span className="block whitespace-nowrap">Training & Placement Officer</span>
              <span className="text-blue-200 block md:mt-2">Dr. Vineet Shekher</span>
            </h1>
            <p className="text-base md:text-xl text-blue-100 max-w-2xl mx-auto font-medium leading-relaxed italic opacity-90">
              "Under the expert guidance of Training & Placement Officer Dr. Vineet Shekher, 80–85% of final-year graduates secure prestigious roles in global industry leaders."
            </p>
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[p1, p2, p3, p4].map((src, i) => (
          <div key={i} className="overflow-hidden rounded-2xl shadow-lg">
            <img 
              src={src}
              alt={`Recruitment Life ${i}`}
              className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {STATS.map(s => (
          <div key={s.label} className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm text-center space-y-4 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto">
              {s.icon}
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">{s.label}</p>
            <p className="text-4xl md:text-5xl font-black text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recruiters Grid */}
      <div className="bg-white rounded-[2rem] md:rounded-[4rem] p-8 md:p-16 border border-gray-100 shadow-sm space-y-10 md:space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">Prominent Recruiters</h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">Click on any logo to view detailed branch-wise placement analytics and salary insights.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-14 items-center justify-items-center">
          {RECRUITERS.map((company) => (
            <motion.div 
              key={company.id} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCompany(company)}
              className="flex flex-col items-center gap-4 group/company cursor-pointer w-full"
            >
              <div className="w-full aspect-video bg-gray-50 rounded-2xl md:rounded-3xl flex items-center justify-center p-4 border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-lg transition-all">
                <img 
                  src={company.logo} 
                  alt={company.name} 
                  className="max-h-full max-w-full object-contain transition-all duration-300" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${company.name}&background=random&color=fff&size=512`;
                  }}
                />
              </div>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 group-hover/company:text-blue-600 transition-colors text-center px-1">
                {company.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Placement Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCompany(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-10 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 rounded-2xl md:rounded-3xl p-3 md:p-6 flex items-center justify-center border border-gray-100">
                    <img 
                      src={selectedCompany.logo} 
                      alt={selectedCompany.name} 
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">{selectedCompany.name}</h2>
                    <span className="text-blue-600 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">Placement Analytics 2023-24</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="p-3 md:p-4 hover:bg-rose-50 hover:text-rose-600 rounded-2xl md:rounded-3xl transition-all active:scale-90"
                >
                  <X className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Stats Highlights */}
                  <div className="space-y-8">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-3">
                      <GraduationCap className="text-blue-600" /> Hiring Distribution
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                        <span className="block text-blue-600 font-black uppercase tracking-widest text-[10px] mb-2">Top Hiring Branch</span>
                        <span className="text-2xl font-black text-blue-900">Computer Science</span>
                      </div>
                      <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                        <span className="block text-emerald-600 font-black uppercase tracking-widest text-[10px] mb-2">Avg. CTC Offered</span>
                        <span className="text-2xl font-black text-emerald-900">6.5 LPA</span>
                      </div>
                    </div>

                    <p className="text-gray-500 font-medium leading-relaxed">
                      {selectedCompany.name} consistently shows high interest in our multi-disciplinary engineering candidates, with a strong focus on technical problem solving and industrial application.
                    </p>
                  </div>

                  {/* The Graph */}
                  <div className="bg-gray-50 p-6 md:p-8 rounded-[2rem] border border-gray-100">
                    <h4 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2 uppercase tracking-widest">
                      <BarChart3 className="w-5 h-5 text-indigo-600" /> Intake Velocity
                    </h4>
                    
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="branch" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontWeight: 700, fontSize: 10 }}
                            interval={0}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontWeight: 700, fontSize: 10 }}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ 
                              borderRadius: '16px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              padding: '12px'
                            }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                          <Bar 
                            dataKey="hired" 
                            name="Offers Made" 
                            fill="#2563eb" 
                            radius={[8, 8, 0, 0]} 
                            barSize={32}
                          />
                          <Bar 
                            dataKey="package" 
                            name="Avg. CTC (LPA)" 
                            fill="#475569" 
                            radius={[8, 8, 0, 0]} 
                            barSize={32}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 leading-none">Deserving Roles</p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Graduate Trainee Engineer</p>
                    </div>
                  </div>
                  <button className="w-full sm:w-auto px-10 py-5 bg-gray-900 text-white rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all shadow-2xl">
                    View Selection Process
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
