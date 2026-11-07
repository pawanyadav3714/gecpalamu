import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User as UserIcon, Building2, Users, Handshake, Camera, Heart, Menu, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { User } from '../types';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDashboard = location.pathname.startsWith('/student-dashboard') || 
                      location.pathname.startsWith('/faculty-dashboard');

  if (isDashboard) return null;

  const navLinks = [
    { to: '/departments', label: 'Departments', icon: Building2 },
    { to: '/faculty', label: 'Faculty', icon: Users },
    { to: '/placements', label: 'Placements', icon: Handshake },
    { to: '/clubs', label: 'Clubs', icon: Heart },
    { to: '/gallery', label: 'Gallery', icon: Camera },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm p-1">
      <div className="container mx-auto px-4 md:px-6 h-[70px] md:h-[90px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-1.5 md:p-2 bg-white rounded-lg transition-colors">
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEeP5QNjxPsJZAMUPGX-bQj2WlQIyGQXeYDw&s" 
              alt="GEC Palamu Logo" 
              className="w-10 h-10 md:w-12 md:h-12 object-contain mix-blend-multiply bg-white" 
            />
          </div>
          <span className="font-bold text-lg md:text-xl tracking-tight text-gray-900">GEC Palamu</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center justify-end flex-1 gap-4">
          <div className="flex items-center gap-3">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className={`group flex items-center gap-2 py-2 px-5 rounded-3xl border-2 border-blue-950 text-black font-black text-sm shadow-xl transition-all duration-500 active:scale-75 hover:scale-105 hover:border-rose-600 ${
                  location.pathname === link.to ? 'bg-rose-700 border-blue-950 text-white' : ''
                }`}
              >
                <link.icon className="w-4 h-4 transition-transform duration-300 group-hover:animate-wiggle" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 md:hidden hover:bg-gray-100 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-4 rounded-xl font-bold transition-all ${
                    location.pathname === link.to ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" /> {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
