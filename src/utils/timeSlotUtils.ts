import { format, parse, addMinutes, isAfter, isBefore, isEqual } from 'date-fns';
import type { Apartment, Booking, TimeSlot } from '../types';
type TimeSlotStatus = 'available' | 'booked' | 'unavailable' | 'travel-restricted';

// Travel time buffer in minutes between different apartments
const TRAVEL_TIME_BUFFER = 30;

// Generate time slots for a specific apartment and date
export const generateTimeSlots = (
  apartment: Apartment,
  date: string,
  bookings: Booking[],
  userHomeLocation?: string
): TimeSlot[] => {
  const { defaultSlotDuration } = apartment;
  const slots: TimeSlot[] = [];
  
  // Parse start and end times - use either operatingHours object or direct properties
  const startTimeStr = apartment.operatingHours?.start || apartment.start;
  const endTimeStr = apartment.operatingHours?.end || apartment.end;
  
  const startTime = parse(startTimeStr, 'HH:mm', new Date());
  const endTime = parse(endTimeStr, 'HH:mm', new Date());
  
  let currentTime = startTime;
  
  while (isBefore(currentTime, endTime) || isEqual(currentTime, endTime)) {
    const startTimeString = format(currentTime, 'HH:mm');
    const endTimeString = format(
      addMinutes(currentTime, defaultSlotDuration),
      'HH:mm'
    );
    
    if (isAfter(parse(endTimeString, 'HH:mm', new Date()), endTime)) {
      break;
    }
    
    // Create the time slot
    const timeSlot: TimeSlot = {
      apartmentId: apartment.id,
      date,
      startTime: startTimeString,
      endTime: endTimeString,
      status: 'available',
    };
    
    // Update slot with booking status if it exists
    const existingBooking = bookings.find(
      (booking) => 
        booking.startTime === startTimeString && 
        booking.endTime === endTimeString &&
        booking.apartmentId === apartment.id
    );
    
    if (existingBooking) {
      // Set the slot as booked if there's an existing booking
      timeSlot.status = 'booked';
      timeSlot.booking = existingBooking;
    }
    
    slots.push(timeSlot);
    currentTime = addMinutes(currentTime, defaultSlotDuration);
  }
  
  return slots;
};

// Apply travel time restrictions based on bookings across different apartments
export const applyTravelTimeRestrictions = (
  allTimeSlots: TimeSlot[],
  userHomeLocation: string
): TimeSlot[] => {
  const bookedSlots = allTimeSlots.filter(slot => 
    slot.status === 'booked' || slot.status === 'unavailable'
  );
  
  return allTimeSlots.map(slot => {
    // Skip already booked/unavailable slots
    if (slot.status !== 'available') {
      return slot;
    }
    
    // Check if this slot conflicts with any booked slot due to travel time
    const hasConflict = bookedSlots.some(bookedSlot => {
      // Skip same apartment comparisons
      if (bookedSlot.apartmentId === slot.apartmentId) {
        return false;
      }
      
      // Skip if the user's home location is same as the booked apartment
      // (no travel time restriction for residents of that apartment)
      if (userHomeLocation === bookedSlot.apartmentId) {
        return false;
      }
      
      const bookedStartTime = parse(
        `${bookedSlot.date} ${bookedSlot.startTime}`, 
        'yyyy-MM-dd HH:mm', 
        new Date()
      );
      const bookedEndTime = parse(
        `${bookedSlot.date} ${bookedSlot.endTime}`, 
        'yyyy-MM-dd HH:mm', 
        new Date()
      );
      
      const slotStartTime = parse(
        `${slot.date} ${slot.startTime}`, 
        'yyyy-MM-dd HH:mm', 
        new Date()
      );
      const slotEndTime = parse(
        `${slot.date} ${slot.endTime}`, 
        'yyyy-MM-dd HH:mm', 
        new Date()
      );
      
      // Check if time slot starts within travel time buffer of booked slot
      const bufferBeforeBooked = addMinutes(bookedStartTime, -TRAVEL_TIME_BUFFER);
      const bufferAfterBooked = addMinutes(bookedEndTime, TRAVEL_TIME_BUFFER);
      
      // If slot starts during the travel buffer time before or after a booked slot,
      // or if the booked slot starts during this slot's time, then there's a travel conflict
      return (
        (isAfter(slotStartTime, bufferBeforeBooked) && 
         isBefore(slotStartTime, bookedStartTime)) ||
        (isAfter(slotStartTime, bookedEndTime) && 
         isBefore(slotStartTime, bufferAfterBooked)) ||
        (isAfter(bookedStartTime, slotStartTime) && 
         isBefore(bookedStartTime, slotEndTime))
      );
    });
    
    if (hasConflict) {
      return { ...slot, status: 'travel-restricted' };
    }
    
    return slot;
  });
};

// Group time slots by apartment for display
export const groupSlotsByApartment = (
  timeSlots: TimeSlot[]
): Record<string, TimeSlot[]> => {
  return timeSlots.reduce((acc, slot) => {
    if (!acc[slot.apartmentId]) {
      acc[slot.apartmentId] = [];
    }
    acc[slot.apartmentId].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);
};
