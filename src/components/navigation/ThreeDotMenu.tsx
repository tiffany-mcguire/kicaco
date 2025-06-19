import React, { useState } from 'react';
import { DropdownMenu, IconButton } from '../common';

interface ThreeDotMenuProps {
  currentPath: string;
}

function ReportBugPopup({ open, onClose, onSubmit }: { open: boolean, onClose: () => void, onSubmit: (desc: string) => void }) {
  const [desc, setDesc] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <h2 className="text-lg font-bold text-[#b91142] mb-2">Report a Bug</h2>
        <p className="text-sm text-gray-700 mb-3">Please describe the issue you encountered. The more details, the better!</p>
        <textarea
          className="w-full border border-[#c0e2e7] rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] mb-4"
          rows={5}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Describe the bug..."
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
            onClick={onClose}
            type="button"
          >Cancel</button>
          <button
            className="px-4 py-2 rounded bg-[#217e8f] text-white hover:bg-[#1a6e7e] font-semibold"
            onClick={() => { onSubmit(desc); setDesc(''); }}
            type="button"
            disabled={!desc.trim()}
          >Submit</button>
        </div>
      </div>
    </div>
  );
}

function reportBug(desc: string) {
  // TODO: Replace with real bug report logic (API call, email, etc.)
  alert('Thank you for your report!\n\n' + desc);
}

function GiveFeedbackPopup({ open, onClose, onSubmit }: { open: boolean, onClose: () => void, onSubmit: (desc: string) => void }) {
  const [desc, setDesc] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <h2 className="text-lg font-bold text-[#217e8f] mb-2">Give Feedback</h2>
        <p className="text-sm text-gray-700 mb-3">We'd love to hear your thoughts or suggestions to improve Kicaco!</p>
        <textarea
          className="w-full border border-[#c0e2e7] rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] mb-4"
          rows={5}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Share your feedback..."
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
            onClick={onClose}
            type="button"
          >Cancel</button>
          <button
            className="px-4 py-2 rounded bg-[#217e8f] text-white hover:bg-[#1a6e7e] font-semibold"
            onClick={() => { onSubmit(desc); setDesc(''); }}
            type="button"
            disabled={!desc.trim()}
          >Submit</button>
        </div>
      </div>
    </div>
  );
}

function giveFeedback(desc: string) {
  // TODO: Replace with real feedback logic (API call, email, etc.)
  alert('Thank you for your feedback!\n\n' + desc);
}

function ContactSupportPopup({ open, onClose, onSubmit }: { open: boolean, onClose: () => void, onSubmit: (email: string, msg: string) => void }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const isEmailValid = email.includes('@') && email.length > 3;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
        <h2 className="text-lg font-bold text-[#217e8f] mb-2">Contact Support</h2>
        <p className="text-sm text-gray-700 mb-3">Need help? Send us a message and we'll get back to you as soon as possible.</p>
        <input
          className="w-full border border-[#c0e2e7] rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] mb-3"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email"
          required
        />
        <textarea
          className="w-full border border-[#c0e2e7] rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] mb-4"
          rows={5}
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="How can we help you?"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
            onClick={onClose}
            type="button"
          >Cancel</button>
          <button
            className="px-4 py-2 rounded bg-[#217e8f] text-white hover:bg-[#1a6e7e] font-semibold"
            onClick={() => { onSubmit(email, msg); setEmail(''); setMsg(''); }}
            type="button"
            disabled={!msg.trim() || !isEmailValid}
          >Submit</button>
        </div>
      </div>
    </div>
  );
}

function contactSupport(email: string, msg: string) {
  // TODO: Replace with real support logic (API call, email, etc.)
  alert('Thank you for contacting support!\n\n' + (email ? `Email: ${email}\n` : '') + msg);
}

export default function ThreeDotMenu({ currentPath }: ThreeDotMenuProps) {
  const [showBug, setShowBug] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  return (
    <>
      <DropdownMenu
        align="right"
        showCaret={true}
        caretPosition="threedot"
        trigger={
          <IconButton
            variant="frameless"
            IconComponent={() => (
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            )}
            aria-label="Toggle menu"
            style={{ color: '#ffffff' }}
          />
        }
      >
        <div className="py-1 flex flex-col pr-4" role="menu" aria-orientation="vertical" style={{ color: '#c0e2e7' }}>
          <button
            className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
            role="menuitem"
            onClick={() => setShowBug(true)}
          >
            Report a Bug
          </button>
          <button
            className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
            role="menuitem"
            onClick={() => setShowFeedback(true)}
          >
            Give Feedback
          </button>
          <button
            className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
            role="menuitem"
            onClick={() => setShowSupport(true)}
          >
            Contact Support
          </button>
          <button
            className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
            role="menuitem"
          >
            Rate This App
          </button>
          <button
            className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
            role="menuitem"
          >
            Check for Updates
          </button>
          <button
            className="px-4 py-2 hover:bg-[#c0e2e7] hover:text-[#217e8f] rounded transition-colors duration-150 cursor-pointer text-left"
            role="menuitem"
          >
            Log Out
          </button>
        </div>
      </DropdownMenu>
      <ReportBugPopup
        open={showBug}
        onClose={() => setShowBug(false)}
        onSubmit={desc => { reportBug(desc); setShowBug(false); }}
      />
      <GiveFeedbackPopup
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={desc => { giveFeedback(desc); setShowFeedback(false); }}
      />
      <ContactSupportPopup
        open={showSupport}
        onClose={() => setShowSupport(false)}
        onSubmit={(email, msg) => { contactSupport(email, msg); setShowSupport(false); }}
      />
    </>
  );
} 