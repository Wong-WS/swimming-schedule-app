// User related types
export type UserRole = 'user' | 'admin';

export interface User {
  uid?: string;
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  homeLocation?: string;
  homeApartment?: string;
  profileComplete?: boolean;
  createdAt?: any;
}

// Apartment related types
export interface Apartment {
  id: string;
  name: string;
  defaultSlotDuration: number; // in minutes
  // Support both formats since the code seems to use both
  operatingHours?: {
    start: string; // format: "HH:MM"
    end: string;   // format: "HH:MM"
  };
  // Direct properties also referenced in the code
  start: string; // format: "HH:MM"
  end: string;   // format: "HH:MM"
}

// Booking related types
export interface Booking {
  id: string;
  apartmentId: string;
  date: string;     // format: "YYYY-MM-DD"
  startTime: string; // format: "HH:MM"
  endTime: string;   // format: "HH:MM"
  bookedBy: string;  // userId
  createdAt: Date;
  userName?: string;
}

// Time slot related types
export interface TimeSlot {
  apartmentId: string;
  date: string;      // format: "YYYY-MM-DD"
  startTime: string; // format: "HH:MM"
  endTime: string;   // format: "HH:MM"
  status: 'available' | 'booked' | 'unavailable' | 'travel-restricted';
  booking?: Booking;
}
