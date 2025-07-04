# Component Structure

The components directory has been reorganized into feature-based subdirectories for better maintainability and clearer separation of concerns.

## Directory Structure

```
src/components/
├── flow/           # Kicaco Flow components for smart event creation
├── chat/           # Chat and messaging components
├── calendar/       # Calendar and event/keeper related components  
├── navigation/     # Navigation and layout components
├── common/         # Shared/common components and utilities
└── index.ts        # Main barrel export file
```

## Component Categories

### Flow Components (`/flow`) - **NEW**
The heart of Kicaco's smart event creation system with 16 specialized components:

**Core Flow Components:**
- **SmartActionButton** - Intelligent action buttons with context-aware styling
- **FlowNavigationHeader** - Navigation header with smart back button logic
- **SportsTypeSelection** - Sport category selection interface

**Date & Time Components:**
- **DateSelection** - Main date picker with month navigation
- **SmallDateButton** - Individual date selection buttons with day-of-week colors
- **TimeSelection** - Single event time picker with ROYGBIV styling
- **TimePickerButton** - Time selection button component
- **DayBasedTimeGrid** - Multi-event time picker organized by day of week
- **CustomTimeSelection** - Custom time picker for specific dates

**Location Components:**
- **LocationSelection** - Single event location picker
- **LocationButton** - Location selection button component
- **DayBasedLocationGrid** - Multi-event location picker organized by day
- **CustomLocationSelection** - Custom location picker for specific dates

**Child & Event Components:**
- **ChildSelectionButton** - Child selection with color-coded styling
- **EventNotes** - Event notes input with smart suggestions

### Chat Components (`/chat`)
- **ChatBubble** - Message display component with sender side styling
- **ChatInput** - Input field for chat messages
- **ChatMessageList** - Scrollable message history
- **GlobalChatDrawer** - Persistent drawer UI for chat interface

### Calendar Components (`/calendar`)
- **CalendarMenu** - Dropdown menu for calendar view navigation
- **EventCard** - Card component for displaying event details
- **EventConfirmationCard** - Confirmation UI for created events
- **KeeperCard** - Card component for displaying keeper tasks
- **SevenDayEventOutlook** - Weekly event preview
- **ThirtyDayKeeperOutlook** - Monthly keeper overview

### Navigation Components (`/navigation`)
- **GlobalHeader** - Main app header with navigation controls
- **GlobalFooter** - Footer with chat input and action buttons
- **GlobalSubheader** - Page-specific subheader with title and actions
- **HamburgerMenu** - Main navigation menu
- **ThreeDotMenu** - Settings and additional options menu

### Common Components (`/common`)
- **AddKeeperButton** - Button for adding new keeper tasks
- **ChildFilterDropdown** - Filter events/keepers by child
- **ConfirmDialog** - Confirmation dialog component
- **DropdownMenu** - Reusable dropdown menu component
- **IconButton** - Reusable icon button with consistent styling
- **ImageUpload** - Image upload and analysis component
- **ManualPasteModal** - Manual paste functionality modal
- **MobileDebugPanel** - Mobile debugging interface
- **PasswordModal** - Modal for password input
- **Portal** - React portal for rendering outside DOM hierarchy
- **PostSignupOptions** - Post-signup flow component
- **SearchBar** - Search input component
- **SearchResults** - Search results display
- **StackedChildBadges** - Display multiple child associations
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
import { TimeSelection, LocationSelection } from '../components/flow';
```

## Key Features

### Flow Components Architecture
The flow components implement Kicaco's signature smart event creation system:
- **ROYGBIV Color System**: Monday-Sunday color coding (Red, Orange, Yellow, Green, Blue, Indigo, Violet)
- **Multi-Event Support**: Handle recurring events with different patterns
- **Smart Time Pickers**: Same time, day-based, and custom time selection
- **Smart Location Pickers**: Same location, day-based, and custom location selection
- **Responsive Design**: Mobile-first with desktop enhancements

### Component Relationships
- Flow components work together to create seamless event creation
- Common components provide shared functionality across features
- Navigation components maintain consistent app-wide experience
- Calendar components display and manage created events/keepers

## Benefits

1. **Better Organization** - Components are grouped by feature/purpose
2. **Easier Discovery** - Clear categories make finding components intuitive
3. **Cleaner Imports** - Named exports from category modules
4. **Scalability** - Easy to add new components to appropriate categories
5. **Maintainability** - Related components are co-located
6. **Flow-First Design** - Specialized components for Kicaco's core feature

## Usage

All components can be imported from categories or the main index:

```typescript
// Import from specific category (recommended)
import { TimeSelection, LocationSelection } from '../components/flow';
import { ChatBubble, GlobalChatDrawer } from '../components/chat';
import { EventCard, KeeperCard } from '../components/calendar';

// Or import from main index
import { TimeSelection, EventCard, ChatBubble } from '../components';
```

## Component Counts by Category

- **Flow Components**: 16 components (Kicaco's core feature)
- **Common Components**: 14 components (shared utilities)
- **Calendar Components**: 6 components (event/keeper display)
- **Navigation Components**: 5 components (app navigation)
- **Chat Components**: 4 components (messaging system)

**Total: 45+ components** organized into 5 feature-based categories. 