import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface User {
  id: string;
  username: string;
  role: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: { username: string; role: string; password?: string }) => void;
  initialData?: User | null;
}

export default function UserModal({ isOpen, onClose, onSubmit, initialData }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    role: 'member',
    password: '',
  });

  const isMouseDownOnBackdrop = useRef(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username,
        role: initialData.role,
        password: '', // Password is not populated for security
      });
    } else {
      setFormData({
        username: '',
        role: 'member',
        password: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      isMouseDownOnBackdrop.current = true;
    } else {
      isMouseDownOnBackdrop.current = false;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    if (isMouseDownOnBackdrop.current && e.target === e.currentTarget) {
      onClose();
    }
    isMouseDownOnBackdrop.current = false;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 md:inset-0 md:h-full"
          onMouseDown={handleBackdropMouseDown}
          onMouseUp={handleBackdropMouseUp}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md h-full md:h-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-white rounded-lg shadow-xl">
              <button
                type="button"
                className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
                <span className="sr-only">Modal schließen</span>
              </button>
              <div className="px-6 py-6 lg:px-8">
                <h3 className="mb-4 text-xl font-medium text-gray-900">
                  {initialData ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}
                </h3>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900">
                      Benutzername
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                      placeholder="Benutzername"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-900">
                      Rolle
                    </label>
                    <select
                      name="role"
                      id="role"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="member">Mitglied</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full text-white bg-primary hover:bg-primary-hover focus:ring-4 focus:outline-none focus:ring-primary/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    {initialData ? 'Benutzer aktualisieren' : 'Benutzer erstellen'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
