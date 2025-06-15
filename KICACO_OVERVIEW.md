# 🧭 Kicaco: Mission, Vision & Terminology

## 💡 What is Kicaco?

**Kicaco** is a smart, family-focused assistant and calendar system designed to lighten the mental load of parenting—especially for families juggling co-parenting, shifting schedules, school demands, and daily invisible tasks.

This is not just another calendar app. Kicaco is a **thinking partner**, designed to:
- Help parents and caregivers capture fleeting to-dos
- Transform vague thoughts into organized plans
- Share the burden of keeping family life on track

It combines a conversational AI assistant with structured scheduling logic, calendar views, and a system for tracking what matters—even the things that never make it onto a calendar.

---

## ✨ The Assistant's Role

The Kicaco assistant is:
- Warm, supportive, and quietly clever
- Efficient and never robotic
- Designed to **extract structure from natural language**
- Able to guide users with gentle, conversational prompts

It can ask follow-up questions when context is missing, but only when necessary. Its job is to reduce overwhelm—not add to it.

Kicaco lives inside a **global chat drawer** that follows users across the app and stays in sync across views. This is not a static or canned-message system; it's a dynamic assistant that adapts to user input, remembers short-term context, and works alongside the user to build structure from chaos.

---

## 🔖 Key Terminology

### ✅ **Events**
- These are **scheduled happenings**—something with a time and usually a location.
- Examples: Soccer practice at 4:30pm, parent-teacher conference, Olivia's dentist appointment

### ✅ **Keepers**
- These are **time-sensitive tasks** that must be completed by a certain date but do **not** involve attending anything.
- Think: due dates, forms, RSVPs, medical follow-ups, etc.
- Examples:
  - "Return library books by Friday"
  - "Sign permission slip for field trip"
  - "Booster shot due in 3 months"

**Keepers ≠ Caregivers.** This is a critical distinction.

---

## 🎯 Core Goals

Kicaco's purpose is to help users:
- Offload the stress of remembering every detail
- Feel confident that nothing is falling through the cracks
- Share visibility with partners, co-parents, or caregivers
- Get gentle nudges without alarm or judgment

Its tone and design should inspire trust, clarity, and a sense of *"I've got this now."*

---

## 🛠 Tech Stack Snapshot (as of mid-2025)

- React + TypeScript (Vite)
- Tailwind CSS (with custom utility classes for consistent theme)
- Zustand for global state
- Framer Motion for UI animations
- Custom drawer + chat system using React Portals
- Local assistant logic using OpenAI Assistants API
- Short-term memory between pages via session logic
- Event and Keeper management with scoped confirmation cards
- (Planned: role-based access, external reminders, mobile PWA features)

---

## 🗂 Where to Improve or Explore Next

- ⏳ Real-time sync between caregivers
- 🧠 Enhanced assistant logic with broader memory/context retention
- 🔔 Push/email reminders for time-based Keepers
- 👨‍👩‍👧 Smarter role/permissions system
- 📱 PWA polish for mobile users
- 🧪 Unit/integration tests

---

## ❤️ Guiding Philosophy

Kicaco isn't about adding more systems to already-overwhelmed families—it's about **quietly organizing the noise**, bringing the mental load into the light, and helping parents feel *just a little more in control*.

> "Don't worry—I've got this. Let's do it together." 