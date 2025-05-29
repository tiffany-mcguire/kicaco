import React, { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (password.trim()) {
      onSubmit(password);
      setPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-[#b91142]">Create Your Password</h2>
        <input
          type="password"
          placeholder="Enter a secure password"
          className="w-full border border-[#c0e2e7] rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] text-gray-900"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
        />
        <div className="flex justify-end space-x-2">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-sm rounded-lg px-4 py-2 text-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-[#217e8f] text-white hover:bg-[#1a6e7e] text-sm rounded-lg px-4 py-2"
            onClick={handleSubmit}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal; 