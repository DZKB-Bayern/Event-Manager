import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username: string;
}

export default function DeleteUserModal({ isOpen, onClose, onConfirm, username }: DeleteUserModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const isMouseDownOnBackdrop = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmationInput('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationInput === username) {
      onConfirm();
      onClose();
    }
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
            <div className="relative bg-white rounded-lg shadow-xl border-2 border-red-100">
              <button
                type="button"
                className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
                <span className="sr-only">Modal schließen</span>
              </button>
              
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                
                <h3 className="mb-2 text-xl font-bold text-gray-900">Benutzer löschen?</h3>
                
                <p className="mb-4 text-sm text-gray-500">
                  Diese Aktion kann nicht rückgängig gemacht werden. Der Benutzer <strong>{username}</strong> und alle damit verbundenen Daten werden dauerhaft gelöscht.
                </p>

                <form onSubmit={handleSubmit} className="mt-4">
                  <label htmlFor="confirmation" className="block mb-2 text-sm font-medium text-gray-700">
                    Zur Bestätigung bitte <strong>{username}</strong> eingeben:
                  </label>
                  <input
                    type="text"
                    id="confirmation"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 mb-4"
                    placeholder={username}
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    autoFocus
                  />
                  
                  <div className="flex justify-center gap-3 mt-6">
                    <button
                      type="button"
                      className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                      onClick={onClose}
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={confirmationInput !== username}
                      className={`text-white font-medium rounded-lg text-sm px-5 py-2.5 focus:ring-4 focus:outline-none focus:ring-red-300 ${
                        confirmationInput === username 
                          ? 'bg-red-600 hover:bg-red-800' 
                          : 'bg-red-300 cursor-not-allowed'
                      }`}
                    >
                      Ja, Benutzer löschen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
