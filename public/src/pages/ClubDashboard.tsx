import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react';
import { User } from '../types';

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path.startsWith('/') ? path.slice(1) : path}`;

const udaan1 = withBase("/udaan/u1.jpg");
const udaan2 = withBase("/udaan/u2.jpg");
const udaan3 = withBase("/udaan/u3.jpg");
const udaan4 = withBase("/udaan/u3.jpg");

const d1 = withBase("/gallery/col1.jpg");
const d2 = withBase("/gallery/col2.jpg");
const codeHack3 = withBase("/gallery/col3.jpg");
const codeHack4 = withBase("/gallery/col4.png");

export default function ClubDashboard({ user }: { user: User | null }) {
  const { clubName } = useParams<{ clubName: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <button 
        onClick={() => navigate(user?.role ? (user.role === 'student' ? '/student-dashboard' : '/faculty-dashboard') : '/')} 
        className="flex items-center gap-2 text-gray-500 font-bold hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Home Dashboard
      </button>

      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-16 my-8">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500 opacity-20 blur-[100px] rounded-full point-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-500 opacity-20 blur-[100px] rounded-full point-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl text-left">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/20 font-bold text-sm tracking-widest uppercase mb-6 backdrop-blur-md">
              Club Hub
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white capitalize mb-6 tracking-tight leading-tight">
              {clubName?.replace('-', ' ')}
            </h1>
            <p className="text-slate-300 font-medium text-lg md:text-xl">
              Welcome to the official portal. Choose your role below to access the dashboard.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <button 
          onClick={() => navigate(`/club-student/${clubName}`)}
          className="group relative flex flex-col items-start text-left p-8 md:p-10 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">Student Portal</h2>
          <p className="text-gray-500 font-medium text-lg mb-8 max-w-sm">
            Join the club, access resources, and connect with other members.
          </p>
          <div className="mt-auto flex items-center gap-2 text-blue-600 font-bold text-lg group-hover:gap-4 transition-all">
            Enter Portal <ArrowRight className="w-5 h-5" />
          </div>
        </button>

        <button 
          onClick={() => navigate(`/club-admin/${clubName}`)}
          className="group relative flex flex-col items-start text-left p-8 md:p-10 bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
        >
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">Admin Dashboard</h2>
          <p className="text-gray-500 font-medium text-lg mb-8 max-w-sm">
            Manage members, approve requests, and oversee club activities.
          </p>
          <div className="mt-auto flex items-center gap-2 text-purple-600 font-bold text-lg group-hover:gap-4 transition-all">
            Manage Club <ArrowRight className="w-5 h-5" />
          </div>
        </button>
      </div>

      <div className="mt-16 pt-16 border-t border-gray-100">
        <h3 className="text-2xl font-black text-gray-900 mb-8">Recent Activity Gallery</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubName === 'Udaan Bharat' ? (
            <>
              <img src={udaan1} alt={`${clubName} Image 1`} className="rounded-2xl shadow-lg w-full  aspect-[4/5] object-cover" />
              <img src={udaan2} alt={`${clubName} Image 2`} className="rounded-2xl shadow-lg w-full  aspect-[4/5] object-cover" />
              <img src={udaan3} alt={`${clubName} Image 3`} className="rounded-2xl shadow-lg w-full  aspect-[4/5] object-cover" />
              <img src={udaan4} alt={`${clubName} Image 4`} className="rounded-2xl shadow-lg w-full  aspect-[4/5] object-cover" />
            </>
          ) : clubName === 'CODE-HACK Club' ? (
            <>
              <img src={withBase("/Hack/h1.png")} alt={`${clubName} Image 1`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/Hack/h2.jpeg")} alt={`${clubName} Image 2`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={codeHack3} alt={`${clubName} Image 3`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={codeHack4} alt={`${clubName} Image 4`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
            </>
          ) : clubName === 'NSS Club' ? (
            <>
              <img src={withBase("/nss/n1.png")} alt={`${clubName} Image 1`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/nss/n2.png")} alt={`${clubName} Image 2`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/nss/n4.png")} alt={`${clubName} Image 4`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/nss/n3.png")} alt={`${clubName} Image 3`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
            </>
          ) : clubName === 'IIC Club' ? (
            <>
              <img src={withBase("/iic/i1.png")} alt={`${clubName} Image 1`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/iic/i2.png")} alt={`${clubName} Image 2`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/iic/i3.png")} alt={`${clubName} Image 3`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/iic/i4.png")} alt={`${clubName} Image 4`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
            </>
          ) : clubName === 'SIC Club' ? (
            <>
              <img src={withBase("/sic/s1.png")} alt={`${clubName} Image 1`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/sic/s2.png")} alt={`${clubName} Image 2`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/sic/s3.png")} alt={`${clubName} Image 3`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/sic/s4.png")} alt={`${clubName} Image 4`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
            </>
          ) : clubName === 'Arts and Culture' || clubName === 'Arts and Culture Club' ? (
            <>
              <img src={withBase("/arts/ar1.jpeg")} alt={`${clubName} Image 1`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/arts/ar2.jpeg")} alt={`${clubName} Image 2`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/arts/ar3.jpeg")} alt={`${clubName} Image 3`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/arts/ar4.jpeg")} alt={`${clubName} Image 4`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
            </>
          ) : clubName === 'RangShrijan Club of Painting' ? (
            <>
              <img src={d1} alt={`${clubName} Image 1`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={d2} alt={`${clubName} Image 2`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={codeHack3} alt={`${clubName} Image 3`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={codeHack4} alt={`${clubName} Image 4`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
            </>
          ) : clubName === 'Sandhan Club' ? (
            <>
              <img src={d1} alt={`${clubName} Image 1`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={d2} alt={`${clubName} Image 2`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={codeHack3} alt={`${clubName} Image 3`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={codeHack4} alt={`${clubName} Image 4`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
            </>
          ) : clubName === 'Comic Club' ? (
            <>
              <img src={d1} alt={`${clubName} Image 1`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={d2} alt={`${clubName} Image 2`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={codeHack3} alt={`${clubName} Image 3`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={codeHack4} alt={`${clubName} Image 4`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
            </>
          ) : clubName === 'E-Cell' ? (
            <>
              <img src={withBase("/Ecell/e1.png")} alt={`${clubName} Image 1`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/Ecell/e2.png")} alt={`${clubName} Image 2`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/Ecell/e3.png")} alt={`${clubName} Image 3`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
              <img src={withBase("/Ecell/e4.png")} alt={`${clubName} Image 4`} className="rounded-2xl shadow-lg w-full   aspect-[4/5] object-cover" />
            </>
          )

          
          : ([1, 2, 3, 4].map((i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl aspect-[4/5] bg-gray-100">
              <img 
                src={withBase(`/placement/p${i}.png`)}
                alt={`${clubName} Activity ${i}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1523240795612-9a054b09644e?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}
