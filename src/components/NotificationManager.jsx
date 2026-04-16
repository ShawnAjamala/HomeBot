import { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Toast Component
 * 
 * A temporary notification that appears at the bottom‑right corner.
 * Automatically disappears after 3 seconds.
 * 
 * @param {string} message - The text to display
 * @param {function} onClose - Callback to remove the toast from the DOM
 */
const Toast = ({ message, onClose }) => {
  // Auto‑close after 3 seconds (3000ms)
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

/**
 * Confirm Modal Component
 * 
 * A centered modal that asks the user for confirmation before performing
 * a destructive action (e.g., delete, disapprove).
 * 
 * @param {boolean} isOpen - Controls visibility of the modal
 * @param {function} onClose - Closes the modal without confirming
 * @param {function} onConfirm - Action to execute when user clicks "Confirm"
 * @param {string} title - Heading of the modal
 * @param {string} message - Descriptive text explaining the action
 */
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

/**
 * React Context for Notifications
 * 
 * Provides two functions to any component in the tree:
 * - showToast(message) – displays a success/info toast
 * - showConfirm(title, message, onConfirm) – opens a confirmation modal
 */
const NotificationContext = createContext();

/**
 * Hook to show toast messages.
 * Must be used inside a NotificationProvider.
 * 
 * @returns {function} showToast(message)
 */
export const useToast = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useToast must be used within NotificationProvider');
  return context.showToast;
};

/**
 * Hook to show confirmation modals.
 * Must be used inside a NotificationProvider.
 * 
 * @returns {function} showConfirm(title, message, onConfirm)
 */
export const useConfirm = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useConfirm must be used within NotificationProvider');
  return context.showConfirm;
};

/**
 * Notification Provider Component
 * 
 * Wraps the application and manages the state for toasts and confirmation modals.
 * Any child component can call useToast() or useConfirm() to trigger notifications.
 */
export const NotificationProvider = ({ children }) => {
  // Toast state: stores the current message (null = hidden)
  const [toastMessage, setToastMessage] = useState(null);
  // Confirm modal state: controls visibility, callback, title, and message
  const [confirmState, setConfirmState] = useState({ 
    isOpen: false, 
    onConfirm: null, 
    title: '', 
    message: '' 
  });

  // Expose these functions via context
  const showToast = (message) => setToastMessage(message);
  const showConfirm = (title, message, onConfirm) => {
    setConfirmState({ isOpen: true, onConfirm, title, message });
  };

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {/* Render toast if there is a message */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      {/* Render confirm modal if open */}
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