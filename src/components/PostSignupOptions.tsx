import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PostSignupOptionsProps {
  onRemindLater?: () => void;
}

const PostSignupOptions: React.FC<PostSignupOptionsProps> = ({ onRemindLater }) => {
  const navigate = useNavigate();

  const onFinishProfile = () => {
    navigate('/profiles-roles');
  };

  const onAddChild = () => {
    navigate('/edit-child');
  };

  const onAddGuardian = () => {
    navigate('/keepers');
  };

  const onSetPreferences = () => {
    navigate('/chat-defaults');
  };

  const onAddEvent = () => {
    navigate('/add-event');
  };

  const onAddKeeper = () => {
    navigate('/add-keeper');
  };

  const onChatWithKicaco = () => {
    // Just close the options and let them chat
    if (onRemindLater) onRemindLater();
  };

  const onTryVoice = () => {
    // TODO: Implement voice input
    console.log('Voice input clicked');
  };

  const buttonClass = "h-[30px] px-2 border border-[#c0e2e7] rounded-md font-nunito font-semibold text-xs sm:text-sm text-[#217e8f] bg-white shadow-[-2px_2px_0px_rgba(0,0,0,0.25)] hover:shadow-[0_0_16px_4px_#c0e2e7aa,-2px_2px_0px_rgba(0,0,0,0.25)] transition-all duration-200 focus:outline-none active:scale-95 active:shadow-[0_0_16px_4px_#c0e2e7aa,-2px_2px_0px_rgba(0,0,0,0.15)]";
  const descriptionClass = "text-gray-500 font-inter text-xs sm:text-sm";

  return (
    <div className="bg-gray-100 rounded-2xl shadow-md p-4 w-full max-w-3xl text-sm">
      <p className="mb-4 font-inter">All set! 🎉 What would you like to do next?</p>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 items-center">
          <div className="w-full sm:w-[140px] flex-shrink-0">
            <button onClick={onFinishProfile} className={buttonClass + " w-[140px]"}>
              Finish profile
            </button>
          </div>
          <span className={descriptionClass + " w-full text-left"}>The more you share, the more personalized Kicaco can be</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 items-center">
          <div className="w-full sm:w-[140px] flex-shrink-0">
            <button onClick={onAddChild} className={buttonClass + " w-[140px]"}>
              Add a child
            </button>
          </div>
          <span className={descriptionClass + " w-full text-left"}>Add another kid to the calendar</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 items-center">
          <div className="w-full sm:w-[140px] flex-shrink-0">
            <button onClick={onAddGuardian} className={buttonClass + " w-[140px]"}>
              Add guardian
            </button>
          </div>
          <span className={descriptionClass + " w-full text-left"}>Share your calendar with co-parents and guardians with roles and permissions</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 items-center">
          <div className="w-full sm:w-[140px] flex-shrink-0">
            <button onClick={onSetPreferences} className={buttonClass + " w-[140px]"}>
              Set chat defaults
            </button>
          </div>
          <span className={descriptionClass + " w-full text-left"}>Tell Kicaco how you like to create Events and Keepers</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 items-center">
          <div className="w-full sm:w-[140px] flex-shrink-0">
            <button onClick={onAddEvent} className={buttonClass + " w-[140px]"}>
              Add an event
            </button>
          </div>
          <span className={descriptionClass + " w-full text-left"}>Events are anything scheduled outside your normal routine</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 items-center">
          <div className="w-full sm:w-[140px] flex-shrink-0">
            <button onClick={onAddKeeper} className={buttonClass + " w-[140px]"}>
              Add a keeper
            </button>
          </div>
          <span className={descriptionClass + " w-full text-left"}>Keepers are unscheduled but important — like assignments or permission slips</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 items-center">
          <div className="w-full sm:w-[140px] flex-shrink-0">
            <button onClick={onChatWithKicaco} className={buttonClass + " w-[140px]"}>
              Chat with Kicaco
            </button>
          </div>
          <span className={descriptionClass + " w-full text-left"}>Just want to talk? Kicaco's all ears</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6 items-center">
          <div className="w-full sm:w-[140px] flex-shrink-0">
            <button onClick={onTryVoice} className={buttonClass + " w-[140px]"}>
              Try voice input
            </button>
          </div>
          <span className={descriptionClass + " w-full text-left"}>Want to speak instead of type? You've got options</span>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={onRemindLater} className="text-gray-500 text-xs underline font-inter">
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostSignupOptions; 