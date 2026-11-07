import { useState, useEffect } from 'react';
import { Megaphone, ExternalLink, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface Announcement {
  id: string;
  title: string;
  content: string;
  link?: string;
  createdAt: string;
}

export default function AnnouncementDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'publicAnnouncements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(data);
      
      const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
      const unread = data.filter(ann => !readAnnouncements.includes(ann.id)).length;
      setUnreadCount(unread);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'publicAnnouncements');
    });
    return () => unsubscribe();
  }, []);

  const handleOpen = () => {
    if (!isOpen) {
      // Mark all as read when opening
      const readAnnouncements = announcements.map(ann => ann.id);
      localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'publicAnnouncements', id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting announcement: ", error);
    }
  };

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative p-2 rounded-full text-white-600 hover:bg-rose-50 bg-rose-500 transition-colors z-[60] cursor-pointer">
        <Megaphone className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
              <div className="bg-white/30 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-white/30">
                  <h3 className="font-black text-gray-900">Announcements (New)</h3>
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="bg-white/70 rounded-xl p-1 border border-white/30 shadow-inner">
                    {announcements.length === 0 ? (
                      <p className="p-4 text-center text-gray-500 italic">No announcements available</p>
                    ) : (
                      announcements.map((ann) => (
                        <div key={ann.id} className="p-4 border-b border-gray-200/50 last:border-0 hover:bg-white/60 transition-colors shadow-sm rounded-lg my-1 relative group">
                          <button 
                            onClick={() => setDeleteConfirm(ann.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <p className="text-xl font-normal text-gray-800 m-0">{ann.content}</p>
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-[10px] font-bold text-black uppercase tracking-widest">
                              {new Date(ann.createdAt).toLocaleDateString()}
                            </span>
                            {ann.link && (
                              <a href={ann.link} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs font-bold text-blue-600 hover:underline">
                                <ExternalLink className="w-3 h-3 mr-1" /> {ann.link}
                              </a>
                            )}
                          </div>
                          {deleteConfirm === ann.id && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center p-4 z-50">
                              <div className="text-center">
                                <p className="text-sm font-bold text-gray-900 mb-3">Are you sure you want to permanently delete this announcement?</p>
                                <div className="flex gap-2 justify-center">
                                  <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 bg-gray-200 text-gray-800 text-xs font-bold rounded-lg hover:bg-gray-300">Cancel</button>
                                  <button onClick={() => handleDelete(ann.id)} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">Delete</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
