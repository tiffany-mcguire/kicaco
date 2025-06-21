# Image Upload Follow-Up Questions Testing Guide

## Overview
This guide helps verify that the OpenAI Assistant correctly asks follow-up questions after creating events from image uploads, treating the image upload as the start of a conversation rather than a one-time interaction.

## What Changed

### 1. System Prompt Updates (`src/utils/talkToKicaco.ts`)
- Added explicit rules for image uploads vs chat conversations
- Specified that after creating events from images, the assistant MUST ask for missing information
- Provided exact phrases to use for each type of missing information
- Emphasized treating image uploads as conversation starters

### 2. Function Return Values (`server/server.js`)
- Modified `updateEvent` and `updateKeeper` to return `missingRequiredFields` array
- Added guidance message in function response to prompt follow-up questions
- Helps the assistant understand what information is still needed

### 3. Image Upload Prompts
- Updated prompts in `Home.tsx` and `DailyView.tsx` to explicitly instruct continuation
- Emphasizes creating events immediately then asking for missing details

## Testing Scenarios

### Scenario 1: Image with Partial Information
**Upload:** Image showing "Emma's swim meet tomorrow at 3 PM"
**Expected Flow:**
1. Assistant creates event with available info
2. Assistant responds: "I've created Emma's swim meet for tomorrow at 3:00 PM. Where is this taking place?"
3. User: "Jackson High School"
4. Assistant updates event with location
5. Assistant confirms: "Perfect! I've added the location. Emma's swim meet is all set for tomorrow at 3:00 PM at Jackson High School."

### Scenario 2: Image Missing Multiple Fields
**Upload:** Image showing just "Soccer practice Tuesday"
**Expected Flow:**
1. Assistant creates event with name and date
2. Assistant asks: "I've created the soccer practice for Tuesday. Which child is this for?"
3. User: "Michael"
4. Assistant asks: "Got it, this is for Michael. What time does this start?"
5. User: "4:30 PM"
6. Assistant asks: "Thanks! Where is this taking place?"
7. User: "City Sports Complex"
8. Assistant confirms all details

### Scenario 3: Keeper/Task from Image
**Upload:** Image showing "Permission slip due Friday"
**Expected Flow:**
1. Assistant creates keeper with available info
2. Assistant asks: "I've created a reminder for the permission slip due Friday. Which child is this for?"
3. User provides child name
4. Assistant confirms and asks if any other details are needed

## Key Phrases to Verify

The assistant should use these EXACT phrases:
- **Location:** "Where is this taking place?"
- **Child:** "Which child is this for?"
- **Time:** "What time does this start?"
- **Date:** "What date is this happening?"

## Testing Steps

1. **Start Fresh**
   - Clear browser cache/storage
   - Ensure you have a new thread ID

2. **Upload Test Image**
   - Use an image with partial event information
   - Can be a photo of handwritten note, flyer, or calendar

3. **Verify Initial Response**
   - Confirms event creation (brief, one sentence)
   - Immediately asks ONE specific follow-up question
   - Does NOT end with generic "let me know if you need anything" type message

4. **Provide Missing Information**
   - Answer the assistant's question in chat
   - Verify assistant updates the event
   - Check if assistant asks for next missing field (if any)

5. **Complete the Flow**
   - Continue until all required fields are filled
   - Verify final confirmation includes all details

## Common Issues to Check

1. **Assistant Ends Too Early**
   - If assistant says "Let me know if there's anything else" after first creation
   - Should instead ask specific question about missing info

2. **Multiple Questions at Once**
   - Assistant should ask ONE question at a time
   - Not "What time and where is this?"

3. **Generic Questions**
   - Avoid: "Do you have any other details?"
   - Use: "Where is this taking place?"

4. **Not Updating Existing Event**
   - Verify `updateEvent` is called again with new info
   - Check that duplicate events aren't created

## Debugging Tips

1. **Check Browser Console**
   - Look for "createdEvents" in console logs
   - Verify function responses include `missingRequiredFields`

2. **Network Tab**
   - Monitor `/api/upload-image` response
   - Check that assistant's response asks questions

3. **Server Logs**
   - Verify "Event created but missing: location" type messages
   - Check function call handling

## Success Criteria

✅ Assistant creates event/keeper immediately from image
✅ Assistant asks specific follow-up questions
✅ Questions use exact prescribed wording
✅ Assistant continues conversation until all fields filled
✅ Each response focuses on ONE missing field
✅ Final confirmation includes all collected details
✅ No duplicate events created during updates

## Example Test Images

1. **Handwritten Note:** "Ballet recital Dec 15 at 7pm"
   - Missing: child name, location

2. **School Flyer:** "Field trip permission slip due Monday"
   - Missing: child name, specific date

3. **Sports Schedule:** "Team practice every Tuesday 4-6pm"
   - Missing: child name, location, start date

4. **Medical Card:** "Dr. Smith appointment 3/15 at 2:30"
   - Missing: child name, location (doctor's office)

## Rollback Instructions

If issues arise, revert these files:
- `src/utils/talkToKicaco.ts` (system prompt)
- `server/server.js` (function responses)
- `src/pages/Home.tsx` (image upload prompt)
- `src/pages/DailyView.tsx` (image upload prompt) 