import { motion } from 'framer-motion';
import { BookOpen, Code2, Cpu, Database, Network, Shield, Binary, Globe, ArrowLeft, Settings, Zap, Thermometer, Cog, PenTool, Lightbulb, Factory, HardHat, Landmark, Map, Droplets, Car, Building2, Compass, Waves, Layout, Scale, Rocket, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const COMMON_1ST_YEAR = {
  year: "1st Year",
  semesters: [
    {
      name: "Semester I",
      subjects: [
        { name: "Engineering Mathematics - I", icon: Binary, code: "BSM01" },
        { name: "Engineering Physics", icon: Cpu, code: "BSP01" },
        { name: "Programming for Problem Solving", icon: Code2, code: "ESPP1" },          
        { name: "Basic Electrical Engineering", icon: Network, code: "ESEE1" },
        { name: "Indian Knowledge System", icon: Globe, code: "HSM01" },
        { name: "Biology for Engineers", icon: Globe, code: "BSBB2" }
      ]
    },
    {
      name: "Semester II",
      subjects: [
        { name: "Engineering Mathematics - II", icon: Binary, code: "BSM02" },
        { name: "Engineering Chemistry", icon: Globe, code: "BSC02" },
        { name: "Elements of Electronics Engineering", icon: Database, code: "ESEL2" },
        { name: "Engineering Drawing and Computer Graphics", icon: BookOpen, code: "ESED2" },
        { name: "Fundamentals of Measurement and Sensors", icon: Cpu, code: "PCMS2" },
        { name: "Communication Skills", icon: BookOpen, code: "HSM02" },
      ]
    }
  ]
};

const CSE_REMAINING = [
  {
    year: "2nd Year",
    semesters: [
      {
        name: "Semester III",
        subjects: [
          { name: "Discrete Mathematics", icon: Binary, code: "CS201" },
          { name: "Object Oriented Programming", icon: Code2, code: "CS202" },
          { name: "Digital Electronics", icon: Cpu, code: "CS203" },
          { name: "Computer Organization", icon: Network, code: "CS204" },
          { name: "Economics for Engineers", icon: BookOpen, code: "HU201" }
        ]
      },
      {
        name: "Semester IV",
        subjects: [
          { name: "Database Management Systems", icon: Database, code: "CS205" },
          { name: "Operating Systems", icon: Cpu, code: "CS206" },
          { name: "Design & Analysis of Algorithms", icon: Binary, code: "CS207" },
          { name: "Software Engineering", icon: Code2, code: "CS208" },
          { name: "Formal Language & Automata", icon: Network, code: "CS209" }
        ]
      }
    ]
  },
  {
    year: "3rd Year",
    semesters: [
      {
        name: "Semester V",
        subjects: [
          { name: "Computer Networks", icon: Network, code: "CS301" },
          { name: "Compiler Design", icon: Code2, code: "CS302" },
          { name: "Web Technologies", icon: Globe, code: "CS303" },
          { name: "Artificial Intelligence", icon: Database, code: "CS304" },
          { name: "Microprocessors", icon: Cpu, code: "CS305" }
        ]
      },
      {
        name: "Semester VI",
        subjects: [
          { name: "Cloud Computing", icon: Globe, code: "CS306" },
          { name: "Machine Learning", icon: Database, code: "CS307" },
          { name: "Cyber Security", icon: Shield, code: "CS308" },
          { name: "Internet of Things", icon: Network, code: "CS309" },
          { name: "Professional Elective I", icon: BookOpen, code: "CS310" }
        ]
      }
    ]
  },
  {
    year: "4th Year",
    semesters: [
      {
        name: "Semester VII",
        subjects: [
          { name: "Big Data Analytics", icon: Database, code: "CS401" },
          { name: "Cryptography", icon: Shield, code: "CS402" },
          { name: "Distributed Systems", icon: Network, code: "CS403" },
          { name: "Major Project Phase I", icon: Code2, code: "CS404" },
          { name: "Professional Elective II", icon: BookOpen, code: "CS405" }
        ]
      },
      {
        name: "Semester VIII",
        subjects: [
          { name: "Blockchain Technology", icon: Shield, code: "CS406" },
          { name: "Natural Language Processing", icon: Binary, code: "CS407" },
          { name: "Deep Learning", icon: Database, code: "CS408" },
          { name: "Major Project Phase II", icon: Code2, code: "CS409" },
          { name: "Human Values & Ethics", icon: BookOpen, code: "HU401" }
        ]
      }
    ]
  }
];

const ME_REMAINING = [
  {
    year: "2nd Year",
    semesters: [
      {
        name: "Semester III",
        subjects: [
          { name: "Thermodynamics", icon: Thermometer, code: "ME201" },
          { name: "Mechanics of Materials", icon: Settings, code: "ME202" },
          { name: "Material Science", icon: Binary, code: "ME203" },
          { name: "Manufacturing Processes", icon: Factory, code: "ME204" },
          { name: "Mathematics - III", icon: Binary, code: "MA201" }
        ]
      },
      {
        name: "Semester IV",
        subjects: [
          { name: "Fluid Mechanics", icon: Globe, code: "ME205" },
          { name: "Applied Thermodynamics", icon: Thermometer, code: "ME206" },
          { name: "Kinematics of Machinery", icon: Cog, code: "ME207" },
          { name: "Engineering Metallurgy", icon: Binary, code: "ME208" },
          { name: "Metrology & Instrumentation", icon: Cpu, code: "ME209" }
        ]
      }
    ]
  },
  {
    year: "3rd Year",
    semesters: [
      {
        name: "Semester V",
        subjects: [
          { name: "Heat Transfer", icon: Thermometer, code: "ME301" },
          { name: "Dynamics of Machinery", icon: Cog, code: "ME302" },
          { name: "Machine Design - I", icon: PenTool, code: "ME303" },
          { name: "Internal Combustion Engines", icon: Zap, code: "ME304" },
          { name: "Manufacturing Technology", icon: Factory, code: "ME305" }
        ]
      },
      {
        name: "Semester VI",
        subjects: [
          { name: "Design of Machine Elements", icon: PenTool, code: "ME306" },
          { name: "Mechanical Vibrations", icon: Settings, code: "ME307" },
          { name: "Control Systems", icon: Cpu, code: "ME308" },
          { name: "Industrial Engineering", icon: HardHat, code: "ME309" },
          { name: "Professional Elective I", icon: Lightbulb, code: "ME310" }
        ]
      }
    ]
  },
  {
    year: "4th Year",
    semesters: [
      {
        name: "Semester VII",
        subjects: [
          { name: "Refrigeration & AC", icon: Thermometer, code: "ME401" },
          { name: "CAD/CAM", icon: Cpu, code: "ME402" },
          { name: "Power Plant Engineering", icon: Zap, code: "ME403" },
          { name: "Major Project Phase I", icon: Code2, code: "ME404" },
          { name: "Automation & Robotics", icon: Settings, code: "ME405" }
        ]
      },
      {
        name: "Semester VIII",
        subjects: [
          { name: "Total Quality Management", icon: Shield, code: "ME406" },
          { name: "Non-Conventional Energy", icon: Lightbulb, code: "ME407" },
          { name: "Product Design", icon: PenTool, code: "ME408" },
          { name: "Major Project Phase II", icon: Code2, code: "ME409" },
          { name: "Professional Ethics", icon: BookOpen, code: "HU401" }
        ]
      }
    ]
  }
];

const CE_REMAINING = [
  {
    year: "2nd Year",
    semesters: [
      {
        name: "Semester III",
        subjects: [
          { name: "Building Materials", icon: Building2, code: "CE201" },
          { name: "Surveying", icon: Map, code: "CE202" },
          { name: "Engineering Mechanics", icon: Settings, code: "CE203" },
          { name: "Mechanics of Solids", icon: Layout, code: "CE204" },
          { name: "Mathematics - III", icon: Binary, code: "MA201" }
        ]
      },
      {
        name: "Semester IV",
        subjects: [
          { name: "Fluid Mechanics", icon: Waves, code: "CE205" },
          { name: "Structural Analysis - I", icon: Layout, code: "CE206" },
          { name: "Concrete Technology", icon: Building2, code: "CE207" },
          { name: "Geotechnical Engg - I", icon: Landmark, code: "CE208" },
          { name: "Surveying - II", icon: Compass, code: "CE209" }
        ]
      }
    ]
  },
  {
    year: "3rd Year",
    semesters: [
      {
        name: "Semester V",
        subjects: [
          { name: "Structural Analysis - II", icon: Layout, code: "CE301" },
          { name: "Design of RCC Structures", icon: Building2, code: "CE302" },
          { name: "Hydrology & Water Resources", icon: Droplets, code: "CE303" },
          { name: "Geotechnical Engg - II", icon: Landmark, code: "CE304" },
          { name: "Transportation Engg - I", icon: Car, code: "CE305" }
        ]
      },
      {
        name: "Semester VI",
        subjects: [
          { name: "Design of Steel Structures", icon: Factory, code: "CE306" },
          { name: "Environmental Engg - I", icon: Waves, code: "CE307" },
          { name: "Foundation Engineering", icon: Landmark, code: "CE308" },
          { name: "Construction Management", icon: HardHat, code: "CE309" },
          { name: "Professional Elective I", icon: Lightbulb, code: "CE310" }
        ]
      }
    ]
  },
  {
    year: "4th Year",
    semesters: [
      {
        name: "Semester VII",
        subjects: [
          { name: "Environmental Engg - II", icon: Waves, code: "CE401" },
          { name: "Transportation Engg - II", icon: Car, code: "CE402" },
          { name: "Irrigation Engineering", icon: Droplets, code: "CE403" },
          { name: "Major Project Phase I", icon: Code2, code: "CE404" },
          { name: "Pre-stressed Concrete", icon: Building2, code: "CE405" }
        ]
      },
      {
        name: "Semester VIII",
        subjects: [
          { name: "Estimation & Costing", icon: Scale, code: "CE406" },
          { name: "Construction Technology", icon: Factory, code: "CE407" },
          { name: "Earthquake Engineering", icon: Waves, code: "CE408" },
          { name: "Major Project Phase II", icon: Code2, code: "CE409" },
          { name: "Professional Ethics", icon: BookOpen, code: "HU401" }
        ]
      }
    ]
  }
];

export default function Syllabus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const branchCode = searchParams.get('dept') || 'CSE';
  
  const branchName = branchCode === 'EE' ? 'Electrical Engineering' : 
                    branchCode === 'ME' ? 'Mechanical Engineering' : 
                    branchCode === 'CE' ? 'Civil Engineering' :
                    'Computer Science and Engineering';

  const syllabusData = [
    COMMON_1ST_YEAR,
    ...(branchCode === 'ME' ? ME_REMAINING : 
        branchCode === 'CE' ? CE_REMAINING : 
        CSE_REMAINING)
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 md:gap-3 font-black uppercase tracking-[0.1em] md:tracking-[0.2em] rounded-full text-black py-3 px-6 md:py-4 md:px-10 border-2 border-blue-600 bg-white shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer group text-xs md:text-sm"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-2 transition-transform" />
          Go Back
        </button>

        <div className="mb-10 md:mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 md:mb-6 leading-tight">
              <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {branchName} Syllabus
              </span>
            </h1>
            <p className="text-base md:text-xl text-gray-600 font-medium leading-relaxed">
              An officially JUT-approved curriculum for {branchName}, designed to maintain academic standards and technical excellence.
              {(branchCode === 'EE' || branchCode === 'ME' || branchCode === 'CE') && (
                <span className="block mt-2 text-xs md:text-sm text-blue-500 italic">
                  Note: 1st Year syllabus is common for all branches. 
                  {branchCode === 'EE' ? ' 2nd-4th year content shown below is currently placeholder for EE.' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-20">
          {syllabusData.map((year, yearIdx) => (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              key={year.year}
              className="space-y-10"
            >
              <div className="flex items-center gap-2 md:gap-4">
                <div className="h-px flex-1 bg-gray-200"></div>
                <h2 className="text-xl md:text-3xl font-black text-gray-400 uppercase tracking-widest">{year.year}</h2>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {year.semesters.map((sem, semIdx) => (
                  <div 
                    key={sem.name}
                    className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div className="bg-blue-600 p-6 md:p-8 text-white">
                      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">{sem.name}</h3>
                    </div>
                    <div className="p-6 md:p-8">
                      <ul className="space-y-4 md:space-y-6">
                        {sem.subjects.map((subj, subjIdx) => (
                          <li key={subj.code} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3 md:gap-5">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                <subj.icon className="w-5 h-5 md:w-6 md:h-6" />
                              </div>
                              <div>
                                <h4 className="text-sm md:text-base font-black text-gray-900 leading-none mb-1">{subj.name}</h4>
                                <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">{subj.code}</span>
                              </div>
                            </div>
                            <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Details</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}

