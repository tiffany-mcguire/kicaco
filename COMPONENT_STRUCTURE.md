# Component Structure

The components directory has been reorganized into feature-based subdirectories for better maintainability and clearer separation of concerns.

## Directory Structure

```
src/components/
├── chat/           # Chat and messaging components
├── calendar/       # Calendar and event/keeper related components  
├── navigation/     # Navigation and layout components
├── common/         # Shared/common components and utilities
└── index.ts        # Main barrel export file
```

## Component Categories

### Chat Components (`/chat`)
- **ChatBubble** - Message display component with sender side styling
- **ChatInput** - Input field for chat messages (if separate from footer)
- **GlobalChatDrawer** - Persistent drawer UI for chat interface

### Calendar Components (`/calendar`)
- **CalendarMenu** - Dropdown menu for calendar view navigation
- **EventCard** - Card component for displaying event details
- **EventConfirmationCard** - Confirmation UI for created events
- **KeeperCard** - Card component for displaying keeper tasks

### Navigation Components (`/navigation`)
- **GlobalHeader** - Main app header with navigation controls
- **GlobalFooter** - Footer with chat input and action buttons
- **GlobalSubheader** - Page-specific subheader with title and actions
- **HamburgerMenu** - Main navigation menu
- **ThreeDotMenu** - Settings and additional options menu

### Common Components (`/common`)
- **AddKeeperButton** - Button for adding new keeper tasks
- **DropdownMenu** - Reusable dropdown menu component
- **IconButton** - Reusable icon button with consistent styling
- **PasswordModal** - Modal for password input
- **Portal** - React portal for rendering outside DOM hierarchy
- **PostSignupOptions** - Post-signup flow component
- **icons** - Icon components and definitions

## Import Changes

### Before
```typescript
import GlobalHeader from '../components/GlobalHeader';
import EventCard from '../components/EventCard';
```

### After
```typescript
import { GlobalHeader } from '../components/navigation';
import { EventCard } from '../components/calendar';
```

## Benefits

1. **Better Organization** - Components are grouped by feature/purpose
2. **Easier Discovery** - Clear categories make finding components intuitive
3. **Cleaner Imports** - Named exports from category modules
4. **Scalability** - Easy to add new components to appropriate categories
5. **Maintainability** - Related components are co-located

## Usage

All components can still be imported from the main components directory:

```typescript
// Import from category
import { ChatBubble, GlobalChatDrawer } from '../components/chat';

// Or import from main index
import { ChatBubble, GlobalChatDrawer } from '../components';
```

Both approaches work, but importing from categories is recommended for clarity. 