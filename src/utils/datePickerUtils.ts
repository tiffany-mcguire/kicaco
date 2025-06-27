// Simplified utility for reliable date picker functionality

export const createSimpleDatePicker = (
  inputType: 'date' | 'month',
  currentValue: string,
  onChange: (value: string) => void,
  onActivate: (active: boolean) => void
) => {
  return () => {
    console.log(`[DatePicker] Creating ${inputType} picker with value:`, currentValue);
    
    // Create and style the input
    const input = document.createElement('input');
    input.type = inputType;
    input.value = currentValue;
    
    // Make it invisible but functional
    input.style.position = 'fixed';
    input.style.top = '-1000px';
    input.style.left = '-1000px';
    input.style.opacity = '0';
    input.style.width = '1px';
    input.style.height = '1px';
    input.style.border = 'none';
    input.style.background = 'transparent';
    
    // Add to DOM
    document.body.appendChild(input);
    console.log('[DatePicker] Input added to DOM');
    
    // Set active state
    onActivate(true);
    console.log('[DatePicker] Set active state to true');
    
    // Handle change
    const handleChange = () => {
      console.log('[DatePicker] Change event fired, new value:', input.value);
      if (input.value) {
        onChange(input.value);
      }
      cleanup();
    };
    
    // Handle blur/cancel
    const handleBlur = () => {
      console.log('[DatePicker] Blur event fired');
      setTimeout(cleanup, 150);
    };
    
    // Cleanup function
    const cleanup = () => {
      console.log('[DatePicker] Cleaning up');
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
      onActivate(false);
    };
    
    // Add event listeners
    input.addEventListener('change', handleChange);
    input.addEventListener('blur', handleBlur);
    input.addEventListener('cancel', cleanup); // For when user cancels picker
    
    // Focus and try to open picker
    setTimeout(() => {
      console.log('[DatePicker] Attempting to focus and open picker');
      input.focus();
      
      // Try showPicker if available
      if (input.showPicker && typeof input.showPicker === 'function') {
        try {
          console.log('[DatePicker] Using showPicker()');
          input.showPicker();
        } catch (e) {
          console.log('[DatePicker] showPicker failed, using fallback:', e);
          input.click();
        }
      } else {
        console.log('[DatePicker] showPicker not available, using click fallback');
        // Fallback: simulate click
        input.click();
      }
    }, 10);
    
    // Cleanup if nothing happens after 30 seconds
    setTimeout(() => {
      if (document.body.contains(input)) {
        console.log('[DatePicker] Auto-cleanup after 30 seconds');
        cleanup();
      }
    }, 30000);
  };
};

// Alternative approach - create a temporarily visible date input
export const createVisibleDatePicker = (
  inputType: 'date' | 'month',
  currentValue: string,
  onChange: (value: string) => void,
  onActivate: (active: boolean) => void
) => {
  return () => {
    console.log(`[VisibleDatePicker] Creating ${inputType} picker with value:`, currentValue);
    
    // Create and style the input to be temporarily visible
    const input = document.createElement('input');
    input.type = inputType;
    input.value = currentValue;
    
    // Make it visible but positioned over the calendar button
    input.style.position = 'fixed';
    input.style.top = '50%';
    input.style.left = '50%';
    input.style.transform = 'translate(-50%, -50%)';
    input.style.zIndex = '9999';
    input.style.padding = '8px';
    input.style.border = '2px solid #217e8f';
    input.style.borderRadius = '8px';
    input.style.background = 'white';
    input.style.fontSize = '16px'; // Prevent zoom on iOS
    input.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    
    // Add to DOM
    document.body.appendChild(input);
    console.log('[VisibleDatePicker] Input added to DOM');
    
    // Set active state
    onActivate(true);
    console.log('[VisibleDatePicker] Set active state to true');
    
    // Handle change
    const handleChange = () => {
      console.log('[VisibleDatePicker] Change event fired, new value:', input.value);
      if (input.value) {
        onChange(input.value);
      }
      cleanup();
    };
    
    // Handle blur/cancel
    const handleBlur = () => {
      console.log('[VisibleDatePicker] Blur event fired');
      setTimeout(cleanup, 100);
    };
    
    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[VisibleDatePicker] Escape key pressed');
        cleanup();
      }
    };
    
    // Cleanup function
    const cleanup = () => {
      console.log('[VisibleDatePicker] Cleaning up');
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
      document.removeEventListener('keydown', handleKeyDown);
      onActivate(false);
    };
    
    // Add event listeners
    input.addEventListener('change', handleChange);
    input.addEventListener('blur', handleBlur);
    input.addEventListener('cancel', cleanup);
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus the input
    setTimeout(() => {
      console.log('[VisibleDatePicker] Focusing input');
      input.focus();
      
      // Try to open picker
      if (input.showPicker && typeof input.showPicker === 'function') {
        try {
          console.log('[VisibleDatePicker] Using showPicker()');
          input.showPicker();
        } catch (e) {
          console.log('[VisibleDatePicker] showPicker failed:', e);
        }
      }
    }, 10);
    
    // Auto cleanup after 30 seconds
    setTimeout(cleanup, 30000);
  };
};

export const createDatePickerHandler = (
  inputType: 'date' | 'month',
  getCurrentValue: () => string,
  onDateChange: (value: string) => void,
  isActive: boolean,
  setActive: (active: boolean) => void
) => {
  return () => {
    console.log(`[DatePicker] Handler called, isActive: ${isActive}`);
    
    // If already active, deactivate
    if (isActive) {
      console.log('[DatePicker] Already active, deactivating');
      setActive(false);
      return;
    }
    
    // Try the visible approach first, fallback to invisible
    const picker = createVisibleDatePicker(
      inputType,
      getCurrentValue(),
      onDateChange,
      setActive
    );
    
    picker();
  };
}; 