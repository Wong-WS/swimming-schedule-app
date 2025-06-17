# Swimming Pool Schedule Management App

## Overview

This application is a React-based swimming pool availability and scheduling system for apartment complexes. It allows residents to view and book pool time slots while ensuring proper scheduling and avoiding overcrowding.

### Key Features

- **User Authentication**: Google OAuth and email/password login via Firebase Auth
- **Schedule Viewing**: Interactive time slot grid with color-coded availability
- **Smart Travel Time**: 30-minute buffer between bookings at different apartments
- **Admin Dashboard**: Manage bookings and apartment configurations
- **Responsive Design**: Mobile-first interface using Tailwind CSS
- **Real-time Updates**: Firestore listeners for live schedule changes

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore and Authentication)
- **State Management**: React Context API
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Firebase account with a project

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd swimming-schedule-app
   ```

2. Fix npm permissions if needed
   ```bash
   # If you encounter permission issues with npm:
   sudo chown -R $(whoami) ~/.npm
   ```

3. Install dependencies
   ```bash
   npm install
   ```

### Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Enable Authentication with Email/Password and Google providers

3. Create a Firestore database with appropriate security rules

4. Create a `.env` file in the project root with your Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### Running the App

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

### Firebase Database Setup

You'll need to populate your Firestore database with initial data:

1. Create an `apartments` collection with documents for each apartment complex:
   - Fields: `id` (string), `name` (string), `defaultSlotDuration` (number: 30 or 60), `operatingHours` (object with start and end times)

2. Create a `bookings` collection (will populate as users make bookings)

3. Create a `users` collection (will populate as users sign up)

### User Roles

- **Regular User**: Can view schedules and book slots for themselves
- **Admin**: Can manage bookings, set unavailable slots, and override travel time restrictions

## Key Functionality

### Time Slot Management

- Each apartment pool has its own operating hours and slot durations
- Time slots are color-coded for easy visibility:
  - **Green**: Available for booking
  - **Red**: Already booked or unavailable
  - **Yellow**: Travel-time restricted (if user recently booked at a different location)

### Travel Time Restrictions

The app enforces a 30-minute travel buffer between bookings at different apartments to account for travel time. This restriction doesn't apply for users booking at their home apartment.
