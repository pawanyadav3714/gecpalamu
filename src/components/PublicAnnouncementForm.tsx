import React, { useState, useEffect } from 'react';
import { X, Trash2, ExternalLink, Megaphone, Send, Sparkles } from 'lucide-react';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface PublicAnnouncementFormProps {
  onClose: () => void;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  link?: string;
  linkText?: string;
  createdAt: string;
}

export default function PublicAnnouncementForm({ onClose }: PublicAnnouncementFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [linkText, setLinkText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, 'publicAnnouncements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'publicAnnouncements');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'publicAnnouncements'), {
        title,
        content,
        link: link.trim() ? link.trim() : null,
        linkText: linkText.trim() ? linkText.trim() : null,
        createdAt: new Date().toISOString()
      });
      setTitle('');
      setContent('');
      setLink('');
      setLinkText('');
      showToast('Announcement added successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'publicAnnouncements');
      showToast('Failed to add announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'publicAnnouncements', id));
      showToast('Announcement deleted successfully', 'success');
      setDeleteId(null);
    } catch (err) {
      showToast('Failed to delete announcement', 'error');
      handleFirestoreError(err, OperationType.DELETE, 'publicAnnouncements');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 w-full max-w-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Announcement Broadcast Center</h2>
              <p className="text-gray-500 font-medium">Manage and push marquee announcements</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-white/50 p-6 rounded-3xl border border-white/50 shadow-inner">
          <h3 className="font-bold text-gray-700 flex items-center gap-2"><Sparkles className="w-4 h-4 text-rose-500" /> New Broadcast</h3>
          <input 
            type="text" 
            placeholder="Announcement Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 bg-white rounded-2xl border border-gray-100 font-bold text-lg text-gray-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition"
            required
          />
          <textarea 
            placeholder="What's the update?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 bg-white rounded-2xl border border-gray-100 font-medium h-24 text-base text-gray-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="url" 
              placeholder="Attachment Link URL (Optional)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full p-4 bg-white rounded-2xl border border-gray-100 font-medium text-base text-gray-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition"
            />
            <input 
              type="text" 
              placeholder="Link Label (e.g. View PDF)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="w-full p-4 bg-white rounded-2xl border border-gray-100 font-medium text-base text-gray-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition"
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-rose-500/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {submitting ? 'Broadcasting...' : <><Send className="w-5 h-5" /> Broadcast Now</>}
          </button>
        </form>

        <div className="space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2"><Megaphone className="w-4 h-4 text-gray-400" /> Active Announcements</h3>
          <AnimatePresence>
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-4 text-center">No active announcements.</p>
            ) : (
              announcements.map((ann) => (
                <motion.div 
                  key={ann.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5 border border-gray-100 rounded-3xl flex justify-between items-start bg-white shadow-sm hover:shadow-md transition"
                >
                  <div className="pr-4">
                    <h4 className="font-black text-gray-900 text-lg">{ann.title}</h4>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{ann.content}</p>
                    {ann.link && (
                      <a href={ann.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-bold text-blue-600 mt-3 hover:text-blue-700 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> {ann.linkText || 'View Attachment'}
                      </a>
                    )}
                  </div>
                  <button 
                    onClick={() => setDeleteId(ann.id)}
                    className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition shrink-0"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {deleteId && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Announcement</h3>
                <p className="text-gray-500 mb-6 font-medium">Are you sure you want to delete this announcement?</p>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setDeleteId(null)} className="px-6 py-3 rounded-2xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition" disabled={isDeleting}>Cancel</button>
                  <button onClick={() => handleDelete(deleteId)} className="px-6 py-3 rounded-2xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition" disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className={`fixed bottom-6 left-1/2 px-6 py-3 rounded-full font-bold shadow-lg z-[300] ${toastMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
            >
               {toastMessage.message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
