# LexiAid Comprehensive Feature Specification

This document provides an exhaustive list of every functional feature and UI component in the LexiAid application. It serves as the definitive blueprint for backend architecture, API endpoints, and data modeling.

## 1. Authentication & Onboarding
*   **User Onboarding:** Multi-step introduction to the app's value proposition for dyslexic readers.
*   **Login & Registration:** Secure entry points for users (Email/Password based).
*   **Diagnostic Style Setup:** A unique onboarding "test" where users choose between different reading styles (Standard, Visual Comfort, High Focus).
    *   Automatically configures initial **Theme**, **Font**, **Spacing**, and **Line Height** based on user preference.
*   **Route Protection:** Logic to ensure only authenticated users access the dashboard.

## 2. Dashboard (Home Screen)
*   **Executive Greeting:** Personalized welcome message with dynamic date display.
*   **Daily Progress Dashboard:**
    *   **Time Tracking:** Real-time display of focused reading minutes today vs. daily goal.
    *   **Goal Visualization:** Circular/Linear progress indicators showing goal completion percentage.
    *   **XP & Leveling:** Display of current User Level and a precision XP bar showing progress to the next level.
    *   **Streak Counter:** Visual "fire" icon tracking consecutive days of reading.
    *   **Accuracy Metric:** Average comprehension score from recent quizzes.
*   **Action Grid:** Rapid access to Scan (OCR), Vocabulary Studio, Stats (Profile), and Setup (Settings).
*   **Personalized Recommendations:**
    *   **Algorithm:** Surfacing unread or incomplete documents from the library.
    *   **Visual Cards:** Displaying document title, estimated reading time, and subject-coded covers.
*   **Recent Activity:** Quick-access list of the last 4 opened documents with progress indicators.

## 3. Library Management
*   **Document Upload:** Support for importing local PDF and TXT files.
*   **High-Precision OCR Scan:**
    *   **Camera Integration:** Captures physical pages using device camera.
    *   **OCR Engine (Simulated):** Extracts text from images and converts it into accessible digital format.
    *   **AI Simplification:** Automatically generates a simplified version of scanned text.
    *   **XP Rewards:** Users earn +100 XP for each successful document scan.
*   **Library Search:** Real-time fuzzy search across titles, authors, and subjects.
*   **Document Management:** Ability to delete documents with confirmation dialogs.
*   **Metadata Tracking:** Tracking of word count, page count, and estimated reading time.

## 4. Advanced Reader Screen
*   **Reading Mechanics:**
    *   **Semantic Chunking:** Automatically breaks long text into small, manageable units (1-3 sentences).
    *   **Chunk Navigation:** Smooth transitions between sections with "Prev" and "Next" controls.
    *   **Progress Visualization:** Top-mounted progress bar tracking the reader's journey through the doc.
*   **Personalized Formatting (Adaptive Engine):**
    *   **Bionic Reading:** Highlighting the initial part of words to guide ocular fixation.
    *   **Typography:** Choice between 4 specialized fonts (Lexend, OpenDyslexic, Inter, System).
    *   **Sizing & Spacing:** Real-time adjustment of Font Size (14-32px), Line Height (1.0-3.0), and Letter Spacing.
    *   **Visual Overlays (Irlen Filters):** Six distinct color overlays to reduce "letter dancing" and visual stress.
*   **Advanced Reading Modes:**
    *   **Distraction-Free Mode:** Hides all UI elements (Header, Toolbar) to focus purely on the text.
    *   **Simplified Text Toggle:** Instantly switches between original content and AI-simplified summaries.
    *   **Focus Ruler:**
        *   **Manual Mode:** A draggable guide to keep track of the current line.
        *   **AI-Sync Mode:** Automatically follows the TTS highlight during audio playback.
*   **Audio & Focus Tools:**
    *   **Read Aloud (TTS):** High-quality voice synthesis with adjustable speed and pitch.
    *   **Word Highlighting:** Real-time visual sync between the audio and the active word on screen.
    *   **Focus Soundscapes:** Ambient background sounds (Rain, White Noise, Birds) to mask external distractions.
*   **AI Interaction (Ask Lexi):**
    *   **AI Chat Interface:** A dedicated modal where users can ask questions about the current document.
    *   **Context-Aware Responses:** Capabilities to summarize, define words, or explain concepts in simpler terms.
*   **Contextual Study Tools:**
    *   **Word Tooltip:** Triggered by tapping any word. Provides Definition, Syllables, and Etymology.
    *   **Pronunciation Coach:** Microphone-based practice tool with success feedback and XP rewards.
    *   **Vocabulary Bookmarking:** Add words directly to the "Vocabulary Studio" with custom notes.
    *   **Deep AI Summary:** Multi-section "TL;DR" (Core Concept, Key Takeaways, Conclusion) with loading state.
    *   **Flashcards:** Auto-generated study deck for the specific document.
    *   **Comprehension Quizzes:** Round-based checks after reading chunks. Correct answers award XP; missed questions are tracked for future study.

## 5. Vocabulary Studio & Challenge
*   **Personal Word Journal:** List of all "tapped" words during reading sessions.
*   **Mastery Tracking:** Ability to mark words as "Mastered" (+50 XP reward).
*   **Detail View:** Display of syllables, definitions, and "view count" (how many times the user tapped the word).
*   **Vocabulary Filters:** Quick filtering by "Learning", "Mastered", or "All".
*   **Vocab Challenge (Matching Game):**
    *   **Gamified Exercise:** A 5-round definition-matching game.
    *   **Interactive Feedback:** Haptic vibrations on correct/incorrect answers and card-shake animations on error.
    *   **Dynamic Scoring:** Earn 30 XP per correct match + 50 XP completion bonus.
    *   **Victory Dashboard:** Detailed summary of performance and total XP gained.

## 6. Profile & Performance Analytics
*   **User Identity:** Management of Avatar, Name, Username, and Email.
*   **XP & Leveling Dashboard:** High-visibility level display with precision XP progress bar.
*   **Precision Reading Stats:**
    *   **Average WPM:** Real-time calculation based on actual words read and "Active Time".
    *   **Comprehension Accuracy:** Percentage score from all completed quizzes.
    *   **Reading Streak:** Tracked daily consistency.
*   **Performance Visualization:** Weekly bar chart showing WPM improvement over time.
*   **Milestones (Badges):** Visual trophy room for earned achievements (e.g., "Scholar", "Fast Reader").
*   **Progress Report Generation:** Exportable PDF report containing the student's name, WPM history, and accuracy for sharing with educators.

## 7. System-Wide Settings
*   **Live Settings Preview:** A persistent "Live Preview" card that shows how typography changes will look in the reader.
*   **Appearance & Themes:** Six system themes (Light, Dark, Night, Cream, High Contrast, Blue Overlay).
*   **Reading Preferences:** Global defaults for TTS (Speed, Pitch, Highlighting), Chunking, and Reading Modes.
*   **Reset Logic:** Ability to revert all settings to factory defaults.

## 8. Backend-Ready Logic & Tracking
*   **Precision WPM Engine:**
    *   Tracks **Active Reading Time** only (pauses on background, screen lock, or 60s inactivity).
    *   Calculates WPM by dividing exact words read in a session by accumulated active minutes.
*   **XP Engine:** Centralized logic for awarding points for diverse activities (Reading, Quiz, Scan, Vocab, Summary).
*   **Adaptive Formatting Engine:** Rule-based logic that automatically nudges reading settings based on performance drops/gains.
*   **Local-First Persistence:** Fully implemented with Zustand and AsyncStorage, ready for API synchronization.
