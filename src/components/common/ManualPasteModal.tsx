import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clipboard } from 'lucide-react';

interface ManualPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaste: (content: string) => void;
}

const ManualPasteModal: React.FC<ManualPasteModalProps> = ({
  isOpen,
  onClose,
  onPaste
}) => {
  const [pasteContent, setPasteContent] = useState('');

  const handleSubmit = () => {
    if (pasteContent.trim()) {
      onPaste(pasteContent.trim());
      setPasteContent('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clipboard size={20} className="text-[#217e8f]" />
                <h3 className="text-lg font-semibold text-gray-900">Paste Content</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Instructions */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>iOS Tip:</strong> Copy your text from Messages/Email, then paste it here using <kbd className="bg-white px-1 rounded">⌘+V</kbd> or long-press → Paste
              </p>
            </div>

            {/* Textarea */}
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste your text here... (messages, emails, schedules, etc.)"
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#217e8f] focus:border-transparent"
              autoFocus
            />

            {/* Footer */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-gray-500">
                ⌘+Enter to submit
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!pasteContent.trim()}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    pasteContent.trim()
                      ? 'bg-[#217e8f] hover:bg-[#1a6670]'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Process
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ManualPasteModal; 