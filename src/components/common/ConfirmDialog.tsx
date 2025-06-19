import React from 'react';
import { AlertCircle } from 'lucide-react';
import Portal from './Portal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  secondaryMessage?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  secondaryMessage,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const confirmButtonColors = {
    danger: 'bg-[#e7a5b4] hover:bg-[#d4919f] text-gray-800 border-[#d4919f]',
    warning: 'bg-[#e3d27c] hover:bg-[#d4c36d] text-gray-800 border-[#d4c36d]',
    info: 'bg-[#aed1d6] hover:bg-[#9fc2c7] text-gray-800 border-[#9fc2c7]'
  };

  const iconColors = {
    danger: '#e7a5b4',
    warning: '#e3d27c', 
    info: '#aed1d6'
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop with blur */}
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Dialog */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-auto overflow-hidden">
          {/* Subtle glow effect at top */}
          <div 
            className="absolute top-0 left-0 right-0 h-20 opacity-20 blur-2xl"
            style={{ 
              background: `radial-gradient(ellipse at center top, ${iconColors[type]}, transparent)`
            }}
          />
          
          {/* Content */}
          <div className="relative p-6">
            {/* Title with icon */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-shrink-0">
                {/* Light pink fill circle */}
                <div 
                  className="absolute inset-0 w-6 h-6 rounded-full"
                  style={{ backgroundColor: `${iconColors[type]}30` }}
                />
                {/* Dark pink icon on top */}
                <AlertCircle size={24} style={{ color: iconColors[type] }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            </div>
            
            {/* Message content - aligned with left edge of icon */}
            <div className="text-gray-600 text-sm ml-1">
              <div className="block">{message}</div>
              {secondaryMessage && (
                <div className="block">{secondaryMessage}</div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl font-medium transition-all hover:shadow-sm border border-gray-200"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-md border ${confirmButtonColors[type]}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ConfirmDialog; 