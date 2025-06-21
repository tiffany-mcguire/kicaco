# Image Upload Feature Guide

Kicaco now supports image upload and analysis! You can upload photos of schedules, flyers, calendars, or any other visual content, and Kicaco will analyze them to extract relevant event and task information.

## How to Use Image Upload

### 1. Upload Button
- Look for the **Upload** button (📤) in the footer of the Home page and Daily View
- Click the upload button to open the image upload interface

### 2. Supported File Types
- **JPG/JPEG** - Most common photo format
- **PNG** - High-quality images with transparency
- **GIF** - Animated or static images
- **WebP** - Modern web image format

### 3. File Size Limit
- Maximum file size: **20MB**
- For best results, use images under 5MB

### 4. Upload Methods
- **Drag & Drop**: Drag an image file directly onto the upload area
- **Browse**: Click "browse" to select a file from your device
- **Mobile**: Tap to access your camera or photo library

### 5. What Kicaco Can Extract
Kicaco can analyze and extract:
- **Event dates and times**
- **Event names and descriptions**
- **Locations and addresses**
- **Contact information**
- **Deadlines and due dates**
- **Recurring schedule information**
- **Task lists and reminders**

## Example Use Cases

### School Flyers
Upload photos of:
- Field trip permission slips
- Sports schedules
- School event announcements
- Parent-teacher conference schedules

### Medical Appointments
Upload images of:
- Appointment cards
- Prescription labels with refill dates
- Medical forms with deadlines

### Activity Schedules
Upload photos of:
- Sports team schedules
- Music lesson timetables
- Summer camp calendars
- Class schedules

### Bills and Reminders
Upload images of:
- Utility bills with due dates
- Insurance renewal notices
- Vehicle registration renewals
- Library book due date slips

## Tips for Best Results

### Image Quality
- Use good lighting when taking photos
- Ensure text is clearly readable
- Avoid blurry or tilted images
- Crop out unnecessary background

### Text Clarity
- Make sure dates and times are visible
- Ensure important details aren't cut off
- Use landscape orientation for wide schedules

### Multiple Items
- For complex schedules, consider uploading one section at a time
- You can upload multiple images for the same event

## Privacy and Security

- Images are processed securely through OpenAI's Vision API
- Images are not permanently stored on our servers
- All analysis happens in real-time and data is not retained

## Troubleshooting

### Upload Fails
- Check your internet connection
- Ensure file size is under 20MB
- Verify file format is supported
- Try refreshing the page

### Poor Recognition
- Retake photo with better lighting
- Ensure text is clearly visible
- Try cropping to focus on relevant information
- Upload a higher resolution image

### Missing Information
- Kicaco will ask follow-up questions if needed
- You can always edit events after they're created
- Provide additional context in your message

## Technical Requirements

### Backend Configuration
The image upload feature requires:
- Backend proxy enabled (`VITE_USE_BACKEND_PROXY=true`)
- OpenAI API key with Vision API access
- Server running on port 3001 (default)

### Environment Variables
Required environment variables:
```
VITE_USE_BACKEND_PROXY=true
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ASSISTANT_ID=your_assistant_id
VITE_OPENAI_PROJECT_ID=your_project_id
```

## Getting Started

1. **Start the backend server**:
   ```bash
   cd server
   npm start
   ```

2. **Open Kicaco** in your browser

3. **Click the Upload button** (📤) in the footer

4. **Select or drag an image** to upload

5. **Wait for analysis** - Kicaco will process and respond

6. **Review and confirm** any events or tasks Kicaco suggests

That's it! Kicaco will help you turn visual information into organized calendar events and tasks. 