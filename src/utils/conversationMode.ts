import { ParsedFields } from './kicacoFlow';

export enum ConversationMode {
  INTRO = 'INTRO',
  FLOW = 'FLOW',
  CONFIRMATION = 'CONFIRMATION',
  SIGNUP = 'SIGNUP'
}

export class ConversationModeController {
  private currentMode: ConversationMode = ConversationMode.INTRO;
  private introMessages: string[] = [
    "Hi! I'm Kicaco, your family calendar assistant. I can help you keep track of your kids' activities and events.",
    "Just tell me about any events or activities you want to add to your calendar.",
    "For example, you could say 'Olivia has a soccer game on Friday at 4pm at the community center'."
  ];
  private currentIntroIndex: number = 0;
  private pendingIntroMessage: NodeJS.Timeout | null = null;
  private collectedFields: ParsedFields = {};
  private lastRequestedField: keyof ParsedFields | undefined;

  constructor() {
    console.log('🎭 Initializing conversation mode controller');
  }

  getCurrentMode(): ConversationMode {
    return this.currentMode;
  }

  transitionToMode(newMode: ConversationMode): void {
    const oldMode = this.currentMode;
    this.currentMode = newMode;
    console.log(`🔄 Mode transition: ${oldMode} -> ${newMode}`);
    
    if (newMode !== ConversationMode.INTRO) {
      this.cancelPendingIntroMessage();
    }
  }

  shouldTransitionToFlow(message: string, fields: ParsedFields): boolean {
    // Check if we have any event-related fields
    const hasEventFields = fields.eventName || fields.date || fields.time || fields.location;
    
    if (hasEventFields) {
      console.log('🎯 Detected event fields:', fields);
      return true;
    }

    // Check for keeper-related content
    const keeperKeywords = ['remind', 'remember', 'don\'t forget', 'make sure'];
    const hasKeeperContent = keeperKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (hasKeeperContent) {
      console.log('🎯 Detected keeper content');
      return true;
    }

    return false;
  }

  getIntroMessage(): string | null {
    if (this.currentIntroIndex < this.introMessages.length) {
      return this.introMessages[this.currentIntroIndex];
    }
    return null;
  }

  incrementIntroMessages(): void {
    this.currentIntroIndex++;
  }

  scheduleIntroMessage(callback: () => void, delay: number): void {
    if (this.currentMode === ConversationMode.INTRO) {
      this.cancelPendingIntroMessage();
      this.pendingIntroMessage = setTimeout(() => {
        if (this.currentMode === ConversationMode.INTRO) {
          callback();
        }
      }, delay);
    }
  }

  cancelPendingIntroMessage(): void {
    if (this.pendingIntroMessage) {
      clearTimeout(this.pendingIntroMessage);
      this.pendingIntroMessage = null;
      console.log('❌ Cancelled pending intro message');
    }
  }

  updateCollectedFields(fields: ParsedFields): void {
    // Preserve existing event context when updating fields
    const existingEventName = this.collectedFields.eventName;
    const existingIsKeeper = this.collectedFields.isKeeper;
    
    // Check for child name confirmation and handle time/location order
    if (fields.childName && !this.collectedFields.childName) {
      console.log('👶 Child name confirmation detected:', fields.childName);
      // Check for prior event context
      const hasEventContext = this.collectedFields.eventName || this.collectedFields.date || 
                            this.collectedFields.time || this.collectedFields.location || 
                            this.collectedFields.isKeeper;
      
      if (hasEventContext) {
        console.log('✅ Preserved event context, deferring to field order helper');
      }
    }
    
    // Always merge with existing fields to preserve state
    const updatedFields = {
      ...this.collectedFields,  // Start with all existing fields
      ...fields,  // Overlay new fields
      // Special handling for timeVague flag
      timeVague: fields.timeVague !== undefined ? fields.timeVague : this.collectedFields.timeVague,
      // Preserve isKeeper status unless explicitly changed
      isKeeper: fields.isKeeper !== undefined ? fields.isKeeper : this.collectedFields.isKeeper
    };
    
    // Update state with merged fields
    this.collectedFields = updatedFields;
    
    console.log('💾 Merged fields:', updatedFields);
    
    // Log context preservation
    if (fields.childName && existingEventName) {
      console.log('🔍 Preserved event context after child confirmation:', {
        eventName: existingEventName,
        childName: fields.childName
      });
    }
  }

  setLastRequestedField(field: keyof ParsedFields | undefined): void {
    this.lastRequestedField = field;
    console.log(`🎯 Set last requested field to: ${field || 'none'}`);
  }

  getLastRequestedField(): keyof ParsedFields | undefined {
    return this.lastRequestedField;
  }

  getCollectedFields(): ParsedFields {
    return this.collectedFields;
  }

  reset(): void {
    this.currentMode = ConversationMode.INTRO;
    this.currentIntroIndex = 0;
    this.collectedFields = {};
    this.cancelPendingIntroMessage();
    console.log('�� Reset conversation state');
  }
}

// Create a singleton instance
const conversationController = new ConversationModeController();

export default conversationController; 