import React, { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create Your Password</h2>
        <input
          type="password"
          placeholder="Enter a secure password"
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-sm rounded-lg px-4 py-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-pink-600 text-white hover:bg-pink-700 text-sm rounded-lg px-4 py-2"
            onClick={() => {
              onSubmit(password);
              setPassword('');
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal; 