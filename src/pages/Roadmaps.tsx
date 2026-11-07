import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  Database, 
  Brain, 
  Layout, 
  Server, 
  Smartphone, 
  Cloud, 
  BarChart3, 
  Binary, 
  Cpu, 
  ArrowLeft,
  ChevronRight,
  Terminal,
  Globe,
  ShieldCheck,
  Search,
  Lightbulb,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RoadmapStep {
  title: string;
  items: string[];
}

interface CareerRole {
  id: string;
  title: string;
  icon: any;
  description: string;
  steps: RoadmapStep[];
}

interface RoadmapCategory {
  title: string;
  icon: any;
  color: string;
  roles: CareerRole[];
}

const ROADMAP_DATA: RoadmapCategory[] = [
  {
    title: "Software Side",
    icon: Code2,
    color: "from-blue-600 to-indigo-600",
    roles: [
      {
        id: "frontend",
        title: "Frontend Developer",
        icon: Layout,
        description: "Specializes in building the user interface and user experience of websites and web apps.",
        steps: [
          { title: "The Basics", items: ["HTML5 Semantic Tags", "CSS3 (Flexbox/Grid)", "Modern JavaScript (ES6+)"] },
          { title: "Styling Frameworks", items: ["Tailwind CSS", "SASS/SCSS", "Component UI Libraries (Radix, HeadlessUI)"] },
          { title: "Frontend Frameworks", items: ["React.js (Hooks, Context API)", "Next.js (App Router, SSR/SSG)", "State Management (Zustand/Redux)"] },
          { title: "Build Tools & Version Control", items: ["Git & GitHub", "Vite / Webpack", "Package Managers (NPM/Yarn/PNPM)"] },
          { title: "Testing & Deployment", items: ["Jest / Vitest", "Cypress / Playwright", "Vercel / Netlify Deployment"] }
        ]
      },
      {
        id: "backend",
        title: "Backend Developer",
        icon: Server,
        description: "Focuses on server-side logic, databases, and application architecture.",
        steps: [
          { title: "Programming Languages", items: ["Node.js (TypeScript)", "Python (Django/FastAPI)", "Go (Golang)"] },
          { title: "Relational Databases", items: ["PostgreSQL", "MySQL", "Execution Plans & Indexing"] },
          { title: "NoSQL Databases", items: ["MongoDB", "Redis (Caching)", "Firebase Firestore"] },
          { title: "API Development", items: ["RESTful APIs", "GraphQL", "gRPC & Protocol Buffers"] },
          { title: "Authentication", items: ["OAuth2 / OpenID Connect", "JWT (JSON Web Tokens)", "Session Management"] }
        ]
      },
      {
        id: "fullstack",
        title: "Full Stack Developer",
        icon: Terminal,
        description: "The complete package: handles both the front-end interface and back-end logic.",
        steps: [
          { title: "Modern Web Stack", items: ["React + Node.js + PostgreSQL", "Next.js Fullstack (T3 Stack)", "Authentication & Middleware"] },
          { title: "System Design", items: ["Load Balancing", "Microservices Architecture", "Caching Strategies"] },
          { title: "DevOps Basics", items: ["Docker & Containers", "CI/CD Pipelines", "Monitoring & Logging"] }
        ]
      },
      {
        id: "mobile",
        title: "Mobile App Developer",
        icon: Smartphone,
        description: "Builds applications for iOS and Android platforms.",
        steps: [
          { title: "Cross-Platform Tools", items: ["React Native", "Flutter (Dart)", "Expo Ecosystem"] },
          { title: "Native Development", items: ["Swift (iOS)", "Kotlin (Android)", "Platform-Specific APIs"] },
          { title: "Deployment", items: ["App Store Connect", "Google Play Console", "Over-the-Air Updates (EAS)"] }
        ]
      },
      {
        id: "devops",
        title: "DevOps / Cloud Engineer",
        icon: Cloud,
        description: "Manages infrastructure, deployment pipelines, and cloud services automation.",
        steps: [
          { title: "Infrastructure as Code", items: ["Terraform", "Ansible", "CloudFormation"] },
          { title: "Cloud Providers", items: ["AWS (EC2, S3, Lambda)", "Google Cloud Platform", "Azure"] },
          { title: "Orchestration", items: ["Kubernetes (K8s)", "Docker Swarm", "Serverless Architecture"] }
        ]
      }
    ]
  },
  {
    title: "Data Side",
    icon: Database,
    color: "from-emerald-600 to-teal-600",
    roles: [
      {
        id: "data-analyst",
        title: "Data Analyst",
        icon: BarChart3,
        description: "Interprets data to help organizations make better business decisions.",
        steps: [
          { title: "Analysis Tools", items: ["Advanced Excel", "SQL (Intermediate to Advanced)", "Python (Pandas, NumPy)"] },
          { title: "Visualization", items: ["Tableau", "Power BI", "Matplotlib / Seaborn"] },
          { title: "Statistics", items: ["Probability", "Hypothesis Testing", "Regression Analysis"] }
        ]
      },
      {
        id: "data-scientist",
        title: "Data Scientist",
        icon: Brain,
        description: "Uses scientific methods, processes, and algorithms to extract knowledge from data.",
        steps: [
          { title: "Advanced Mathematics", items: ["Linear Algebra", "Calculus", "Probability & Statistics"] },
          { title: "Machine Learning", items: ["Supervised Learning", "Unsupervised Learning", "Feature Engineering"] },
          { title: "Programming", items: ["Python / R", "Jupyter Notebooks", "Scikit-Learn"] }
        ]
      },
      {
        id: "data-engineer",
        title: "Data Engineer",
        icon: Binary,
        description: "Builds systems for collecting, storing, and analyzing data at scale.",
        steps: [
          { title: "Data Pipelines", items: ["Apache Airflow", "ETL/ELT Processes", "Data Warehousing (Snowflake/BigQuery)"] },
          { title: "Big Data Tools", items: ["Apache Spark", "Hadoop Ecosystem", "Kafka (Streaming Data)"] },
          { title: "Distributed Systems", items: ["Cloud Data Storage", "Parallel Computing", "Database Performance Tuning"] }
        ]
      }
    ]
  },
  {
    title: "AI Side",
    icon: Brain,
    color: "from-purple-600 to-fuchsia-600",
    roles: [
      {
        id: "ml-engineer",
        title: "ML Engineer",
        icon: Binary,
        description: "Deploys machine learning models into production environments.",
        steps: [
          { title: "ML Frameworks", items: ["PyTorch", "TensorFlow", "Keras"] },
          { title: "MLOps", items: ["MLflow", "Kubeflow", "Model Versioning & Monitoring"] },
          { title: "Foundations", items: ["Optimization Algorithms", "Neural Networks Architecture", "Computer Vision Basics"] }
        ]
      },
      {
        id: "ai-engineer",
        title: "AI Engineer",
        icon: Lightbulb,
        description: "Integrates AI capabilities (like LLMs) into software products.",
        steps: [
          { title: "Large Language Models", items: ["OpenAI API / LangChain", "Prompt Engineering", "RAG (Retrieval Augmented Generation)"] },
          { title: "Vector Databases", items: ["Pinecone", "ChromaDB", "Milvus"] },
          { title: "Agentic Workflows", items: ["AutoGPT / BabyAGI concepts", "Function Calling", "AI SDK Integration"] }
        ]
      },
      {
        id: "nlp-engineer",
        title: "NLP Engineer",
        icon: Search,
        description: "Specializes in training computers to understand human language.",
        steps: [
          { title: "Text Processing", items: ["Tokenization & Lemmatization", "Stop Word Removal", "Regular Expressions"] },
          { title: "NLP Tasks", items: ["Sentiment Analysis", "Named Entity Recognition (NER)", "Machine Translation"] },
          { title: "Modern NLP", items: ["Transformers (HuggingFace)", "BERT / GPT Architectures", "Attention Mechanisms"] }
        ]
      },
      {
        id: "robotics",
        title: "Robotics Engineer",
        icon: Cpu,
        description: "Designs and builds automated machines and robots.",
        steps: [
          { title: "Hardware Control", items: ["Arduino / Raspberry Pi", "Embedded C++", "Microcontrollers"] },
          { title: "Robotics Frameworks", items: ["ROS (Robot Operating System)", "Gazebo Simulation", "Path Planning Algorithms"] },
          { title: "Control Systems", items: ["PID Controllers", "Motion Planning", "Computer Vision for Robotics"] }
        ]
      }
    ]
  }
];

export default function Roadmaps() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<CareerRole | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-bold group text-sm md:text-base"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Syllabus
        </button>

        <div className="mb-12 md:mb-16 px-2">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 md:mb-6 tracking-tighter leading-tight">
            Career <span className="text-blue-600">Roadmaps</span>
          </h1>
          <p className="text-base md:text-xl text-gray-600 font-medium max-w-3xl leading-relaxed">
            In-depth industrial career paths for Computer Science and Engineering. 
            Choose a domain to explore step-by-step requirements for modern roles.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-16">
          {ROADMAP_DATA.map((category) => (
            <section key={category.title} className="space-y-8">
              <div className="flex items-center gap-4 px-2">
                <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl bg-linear-to-br ${category.color} text-white shadow-xl`}>
                  <category.icon className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-gray-900">{category.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-6">
                {category.roles.map((role) => (
                  <motion.div
                    key={role.id}
                    whileHover={{ y: -5 }}
                    onClick={() => setActiveRole(role)}
                    className="cursor-pointer bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all group"
                  >
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all mb-4 md:mb-6">
                      <role.icon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2 md:mb-3">{role.title}</h3>
                    <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed line-clamp-2 italic">
                      {role.description}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-xs md:text-sm uppercase tracking-widest">
                      View Roadmap <ChevronRight className="w-4 h-4" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Roadmap Modal */}
      <AnimatePresence>
        {activeRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveRole(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh] mt-auto md:mt-0"
            >
              <div className="p-6 md:p-12 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shrink-0">
                    <activeRole.icon className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-4xl font-black text-gray-900">{activeRole.title}</h2>
                    <span className="text-blue-600 font-bold uppercase tracking-widest text-[10px] md:text-xs">Complete Learning Path</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveRole(null)}
                  className="p-2 md:p-3 hover:bg-gray-100 rounded-xl md:rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-900" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 md:space-y-12">
                <p className="text-base md:text-xl text-gray-600 font-medium leading-relaxed max-w-2xl italic">
                  {activeRole.description}
                </p>

                <div className="relative space-y-10 md:space-y-12 before:absolute before:left-6 md:before:left-8 before:top-4 before:bottom-4 before:w-1 before:bg-blue-50">
                  {activeRole.steps.map((step, idx) => (
                    <div key={step.title} className="relative flex items-start gap-6 md:gap-12 group">
                      <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border-4 border-blue-600 flex items-center justify-center font-black text-blue-600 text-lg md:text-xl shadow-xl group-hover:scale-110 transition-transform shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 pt-1 md:pt-2">
                        <h4 className="text-lg md:text-2xl font-black text-gray-900 mb-4 md:mb-6">{step.title}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {step.items.map((item) => (
                            <div key={item} className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group/item">
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-400 group-hover/item:bg-blue-600"></div>
                              <span className="font-bold text-xs md:text-sm text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 md:p-8 bg-gray-50 text-center">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-4">Ready to start learning?</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                  <a href="https://roadmap.sh" target="_blank" rel="noopener noreferrer" className="px-6 py-3 md:px-8 md:py-4 bg-gray-900 text-white rounded-xl md:rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl text-sm md:text-base">
                    External Resources
                  </a>
                  <button onClick={() => setActiveRole(null)} className="px-6 py-3 md:px-8 md:py-4 bg-white border border-gray-200 rounded-xl md:rounded-2xl font-bold hover:bg-gray-100 transition-all text-sm md:text-base">
                    Close Guide
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
