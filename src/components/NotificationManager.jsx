import { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

// Toast component
const Toast = ({ message, onClose }) => {
  setTimeout(onClose, 3000);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-3 pr-8 min-w-[250px] animate-slide-up">
      <span className="text-sm text-gray-700">{message}</span>
      <button onClick={onClose} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
        <X size={14} />
      </button>
    </div>
  );
};

// Confirm modal component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 bg-red-600 text-white rounded-lg">Confirm</button>
        </div>
      </div>
    </div>
  );
};

// Context and provider
const NotificationContext = createContext();

export const useToast = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useToast must be used within NotificationProvider');
  return context.showToast;
};

export const useConfirm = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useConfirm must be used within NotificationProvider');
  return context.showConfirm;
};

export const NotificationProvider = ({ children }) => {
  const [toastMessage, setToastMessage] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });

  const showToast = (message) => setToastMessage(message);
  const showConfirm = (title, message, onConfirm) => {
    setConfirmState({ isOpen: true, onConfirm, title, message });
  };

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
      />
    </NotificationContext.Provider>
  );
};