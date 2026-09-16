import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronRight } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-[#253D7A] text-white pt-12 pb-0 mt-0 px-1 w-full">
      <div className="container mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* About GEC */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium mb-6">About GEC</h3>
            <p className="text-sm leading-relaxed text-gray-200">
              Government Engineering College, Palamu (GEC), since inception in the year 2022, has reached new echelons in all areas of functionality showing positive growth trend in academic discourse over the years.The motive has always been to attain the global level of excellence in scientific and technical education, fostering research, innovation, leadership qualities and entrepreneurial attitude, contributing to the advancement of the society and mankind
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium mb-6">Quick Links</h3>
            <ul className="space-y-3 text-sm text-gray-200">
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" /> <Link to="/" className="hover:text-blue-300 transition-colors">Home</Link>
              </li>
              <li className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" /> <span>About Us</span>
                </div>
                <ul className="pl-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" /> <Link to="#" className="hover:text-blue-300 transition-colors">Vision and Mission</Link>
                  </li>
                </ul>
              </li>
              <li className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" /> <span>Principal's Desk</span>
                </div>
                <ul className="pl-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" /> <Link to="#" className="hover:text-blue-300 transition-colors">Principal Message</Link>
                  </li>
                </ul>
              </li>
              <li className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" /> <span>Department</span>
                </div>
                <ul className="pl-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" /> <Link to="/departments" className="hover:text-blue-300 transition-colors">Mechanical Engineering</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" /> <Link to="/departments" className="hover:text-blue-300 transition-colors">Electrical Engineering</Link>
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" /> <Link to="/departments" className="hover:text-blue-300 transition-colors">Computer Science and Engineering</Link>
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium mb-6">Social Links</h3>
            <p className="text-sm text-gray-200">
              Connect the College's social Links
            </p>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-6">Address</h3>
            <p className="text-sm leading-relaxed text-gray-200 font-medium">
              Post: Lesliganj , Medninagar Palamu (Jharkhand) -822118 Email : gecp.academic@gmail.com
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#0f172a] py-6 px-1 relative flex flex-col items-center rounded-lg">
        <p className="text-sm text-center text-gray-300">
          Copyright © 2026 Government Engineering College, Palamu,jharkhand. All rights reserved.
        </p>
        <p className="text-sm text-center text-gray-300 mt-1">
          Pragyasoft Technologies
        </p>
        
        {/* Scroll to top button */}
        <button 
          onClick={scrollToTop}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-rose-500 hover:bg-rose-600 text-white p-3 md:p-4 rounded-full transition-colors shadow-lg"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6" strokeWidth={3} />
        </button>
      </div>
    </footer>
  );
}
