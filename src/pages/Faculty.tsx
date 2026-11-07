import { motion } from 'framer-motion';
import { User } from 'lucide-react';
const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.startsWith('/') ? path.slice(1) : path}`;

const FACULTY = [
  { id: 1, name: "Prof. Bhawesh Kumar", role: "HOD, CSE", branch: "Computer Science and Engineering", pic: withBase("/faculty/bhawesh.png"), linkedin: "https://www.bitsindri.ac.in/old/faculty-profile/bhawesh.html" },
  { id: 2, name: "Dr. Vineet Shekher", role: "HOD. EE", branch: "Electrical Engineering", pic: withBase("/faculty/vinit.png"), linkedin: "https://www.linkedin.com/in/dr-vineet-shekher-1b7067368"},
  { id: 3, name: "Dr. Pankaj Kumar", role: "HOD. ME", branch: "Mechanical Engineering", pic: withBase("/faculty/pankaj.png"), linkedin: "#" },
  { id: 4, name: "Prof. Ran Vijay Singh", role: "HOD. CE", branch: "Civil Engineering", pic: withBase("/faculty/ranvijay.jpeg"), linkedin: "https://www.linkedin.com/in/prof-ran-vijay-singh-a1a76339" },
  { id: 5, name: "Dr. Hari Mohan Dubey", role: "Ex-HOD of EE", branch: "Electrical Engineering", pic: withBase("/faculty/hari.png"), linkedin: "https://www.linkedin.com/in/hari-mohan-dubey-0b208075" },
  // Adding unique IDs to the remaining entries
  { id: 6, name: "Dr. Murli Manohar", role: "Assistant Professor ", branch: "Electrical Machine and Power System Engineering", pic: withBase("/faculty/murli.png"), linkedin: "https://www.linkedin.com/in/dr-murli-manohar-781344ab" },
  { id: 7, name: "Dr. Rajesh Narayan Deo", role: "Assistant Professor", branch: "Digital Electronics and Power Quality, Power Electronics ", pic: withBase("/faculty/rnd.png"), linkedin: "linkedin.com/in/dr-rajesh-narayan-deo-b208718" },
  { id: 8, name: "Mahendra Marandi", role: "Assistant professor", branch: "Signal System and NSS program organiser", pic: withBase("/faculty/marandi.jpeg"), linkedin: "linkedin.com/in/mahendra-marandi-123759107" },
  { id: 9, name: "Dr. Dipesh Kumar", role: "Assistant Professor", branch: "Power System and Network Theory", pic: withBase("/faculty/dipesh.png"), linkedin: "linkedin.com/in/dr-dipesh-kumar-b3585413a" },
  { id: 10, name: "Prof(Dr.) Sanjay Kumar", role: "Principal", branch: "Director ", pic: withBase("/faculty/sanjay.png"), linkedin: "https://www.linkedin.com/posts/pragyan-innovation-scienceday-ugcPost-7435269349743009797-cQWm?utm_source=share&utm_medium=member_desktop&rcm=ACoAAF8LstUBrJ9nRf6JicALt9khmqfT7tJ-tGU" },
  { id: 11, name: "Prof.Sumit Kumar", role: "Assistant Professor", branch: "Civil Engg", pic: withBase("/faculty/sumit.png"), linkedin: "https://www.linkedin.com/posts/gec-palamu-institution-s-innovation-council_gecpalamu-fromdistractiontodiscipline-studentgrowth-activity-7433817031663185920-ejxK?utm_source=share&utm_medium=member_desktop&rcm=ACoAAF8LstUBrJ9nRf6JicALt9khmqfT7tJ-tGU" }
];

export default function Faculty() {
  return (
    <div className="space-y-12 pb-20 px-1 md:px-0">
      <header className="text-center space-y-4 max-w-2xl mx-auto px-1">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">Our Distinguished Faculty</h1>
        <p className="text-sm md:text-base text-gray-500 font-medium">World-class educators and researchers leading the way in academic brilliance.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-1">
        {FACULTY.map((f, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={f.id} 
            className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center hover:shadow-xl transition-all"
          >
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 bg-blue-600 rounded-full rotate-6 group-hover:rotate-12 transition-transform opacity-10 hover:transition duration-300 hover:scale-105"></div>
              {f.pic ? (
                <img src={f.pic} alt={f.name} className="w-40 h-40 rounded-full object-cover ring-4 ring-white relative z-10 hover:transition duration-200 hover:scale-105 active:scale-95" />
              ) : (
                <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-white relative z-10 hover:scale-105 transition-transform">
                  <User className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>
            <h3 className="text-2xl font-black text-gray-900">{f.name}</h3>
            <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mt-2">{f.role}</p>
            <p className="text-gray-600 text-xs mt-1 italic">{f.branch}</p>
            <a 
              href={f.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-6 block w-full py-3 bg-blue-700 rounded-xl font-bold text-white hover:bg-blue-800 hover:scale-105 hover:transition duration-300 active:scale-95 transition-all text-xs uppercase tracking-tight shadow-lg shadow-blue-500/25 text-center"
            >
              View Profile
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
