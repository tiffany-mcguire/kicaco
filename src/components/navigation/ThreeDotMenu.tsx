import { useState, useEffect, useRef } from 'react';
import { DropdownMenu, IconButton } from '../common';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock-upgrade';
import { AlertCircle, MessageSquare, HelpCircle } from 'lucide-react';

interface ThreeDotMenuProps {
  currentPath: string;
}

function ReportBugPopup({ open, onClose, onSubmit }: { open: boolean, onClose: () => void, onSubmit: (desc: string) => void }) {
  const [desc, setDesc] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetElement = popupRef.current;
    if (open && targetElement) {
      disableBodyScroll(targetElement);
    }
    return () => {
      if (targetElement) {
        enableBodyScroll(targetElement);
      }
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-30 p-4 backdrop-blur-sm" ref={popupRef}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle size={24} className="text-[#d4919f]" />
          <h2 className="text-lg font-semibold text-gray-800">Report a Bug</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4 ml-1">Please describe the issue you encountered. The more details, the better!</p>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] bg-gray-50 transition"
          rows={5}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Describe the bug..."
          autoFocus
        />
        <div className="flex justify-end gap-3 mt-5">
          <button
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl font-medium transition-all hover:shadow-sm border border-gray-200"
            onClick={onClose}
            type="button"
          >Cancel</button>
          <button
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-md border-2 bg-[#2f8fa4] hover:bg-[#217e8f] text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none border-[#217e8f] disabled:border-gray-300"
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
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetElement = popupRef.current;
    if (open && targetElement) {
      disableBodyScroll(targetElement);
    }
    return () => {
      if (targetElement) {
        enableBodyScroll(targetElement);
      }
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-30 p-4 backdrop-blur-sm" ref={popupRef}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-3">
          <MessageSquare size={24} className="text-[#9fc2c7]" />
          <h2 className="text-lg font-semibold text-gray-800">Give Feedback</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4 ml-1">We'd love to hear your thoughts or suggestions to improve Kicaco!</p>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] bg-gray-50 transition"
          rows={5}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Share your feedback..."
          autoFocus
        />
        <div className="flex justify-end gap-3 mt-5">
          <button
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl font-medium transition-all hover:shadow-sm border border-gray-200"
            onClick={onClose}
            type="button"
          >Cancel</button>
          <button
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-md border-2 bg-[#2f8fa4] hover:bg-[#217e8f] text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none border-[#217e8f] disabled:border-gray-300"
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
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetElement = popupRef.current;
    if (open && targetElement) {
      disableBodyScroll(targetElement);
    }
    return () => {
      if (targetElement) {
        enableBodyScroll(targetElement);
      }
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-30 p-4 backdrop-blur-sm" ref={popupRef}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-3">
          <HelpCircle size={24} className="text-[#9fc2c7]" />
          <h2 className="text-lg font-semibold text-gray-800">Contact Support</h2>
        </div>
        <p className="text-sm text-gray-600 mb-2 ml-1">Need help? Send us a message and we'll get back to you as soon as possible.</p>
        <input
          className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] bg-gray-50 transition mb-1.5"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Your email"
          required
        />
        <textarea
          className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0e2e7] bg-gray-50 transition"
          rows={1}
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="How can we help you?"
          autoFocus
        />
        <div className="flex justify-end gap-3 mt-2">
          <button
            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl font-medium transition-all hover:shadow-sm border border-gray-200"
            onClick={onClose}
            type="button"
          >Cancel</button>
          <button
            className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all hover:shadow-md border-2 bg-[#2f8fa4] hover:bg-[#217e8f] text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none border-[#217e8f] disabled:border-gray-300"
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

type ActivePopup = 'bug' | 'feedback' | 'support' | null;

export default function ThreeDotMenu({}: ThreeDotMenuProps) {
  const [activePopup, setActivePopup] = useState<ActivePopup>(null);

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
        {({ close: closeMenu }) => (
          <div className="py-1 flex flex-col pr-4" role="menu" aria-orientation="vertical" style={{ color: '#ffffff' }}>
            <button
              className="px-4 py-2 hover:bg-[#217e8f] hover:text-white rounded transition-colors duration-150 cursor-pointer text-left text-white"
              role="menuitem"
              onClick={() => { setActivePopup('bug'); closeMenu(); }}
            >
              Report a Bug
            </button>
            <button
              className="px-4 py-2 hover:bg-[#217e8f] hover:text-white rounded transition-colors duration-150 cursor-pointer text-left text-white"
              role="menuitem"
              onClick={() => { setActivePopup('feedback'); closeMenu(); }}
            >
              Give Feedback
            </button>
            <button
              className="px-4 py-2 hover:bg-[#217e8f] hover:text-white rounded transition-colors duration-150 cursor-pointer text-left text-white"
              role="menuitem"
              onClick={() => { setActivePopup('support'); closeMenu(); }}
            >
              Contact Support
            </button>
            <button
              className="px-4 py-2 hover:bg-[#217e8f] hover:text-white rounded transition-colors duration-150 cursor-pointer text-left text-white"
              role="menuitem"
            >
              Rate This App
            </button>
            <button
              className="px-4 py-2 hover:bg-[#217e8f] hover:text-white rounded transition-colors duration-150 cursor-pointer text-left text-white"
              role="menuitem"
            >
              Check for Updates
            </button>
            <button
              className="px-4 py-2 hover:bg-[#217e8f] hover:text-white rounded transition-colors duration-150 cursor-pointer text-left text-white"
              role="menuitem"
            >
              Log Out
            </button>
          </div>
        )}
      </DropdownMenu>
      <ReportBugPopup
        open={activePopup === 'bug'}
        onClose={() => setActivePopup(null)}
        onSubmit={desc => { reportBug(desc); setActivePopup(null); }}
      />
      <GiveFeedbackPopup
        open={activePopup === 'feedback'}
        onClose={() => setActivePopup(null)}
        onSubmit={desc => { giveFeedback(desc); setActivePopup(null); }}
      />
      <ContactSupportPopup
        open={activePopup === 'support'}
        onClose={() => setActivePopup(null)}
        onSubmit={(email, msg) => { contactSupport(email, msg); setActivePopup(null); }}
      />
    </>
  );
}