import { useState, useEffect } from 'react';
import { Megaphone, ExternalLink, X, Search, FileText, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface Announcement {
  id: string;
  title: string;
  content: string;
  link?: string;
  linkText?: string;
  createdAt: string;
  adminName?: string; // Adding optional admin name if metadata exists
}

export default function AnnouncementModal({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'publicAnnouncements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'publicAnnouncements');
    });
    return () => unsubscribe();
  }, []);

  const filteredAnnouncements = announcements.filter(ann => 
    ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ann.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-2xl font-bold text-black flex items-center gap-2">
                  <Megaphone className="w-8 h-8 text-rose-500" /> Announcements
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-lg text-black"
                  />
                </div>

                <div className="overflow-y-auto max-h-[50vh] pr-2 -mr-2">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)}
                    </div>
                  ) : filteredAnnouncements.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 font-medium">No announcements available</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-4 px-6 pb-2 text-sm font-bold text-gray-500 uppercase">
                        <div className="col-span-6">Title</div>
                        <div className="col-span-3">Date</div>
                        <div className="col-span-3 text-right">View</div>
                      </div>
                      {filteredAnnouncements.map((ann) => (
                        <div key={ann.id} className="grid grid-cols-12 gap-4 items-center p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors bg-white">
                          <h4 className="col-span-6 text-lg font-bold text-gray-900">{ann.title}</h4>
                          <div className="col-span-3 flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="col-span-3 text-right">
                            {ann.link && (
                              <a href={ann.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-blue-600 bg-blue-50 rounded-full text-sm font-bold hover:bg-blue-100 transition-colors">
                                {ann.linkText || 'View'} 
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
