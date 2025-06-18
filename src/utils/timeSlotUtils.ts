import { format, parse, addMinutes, isAfter, isBefore, isEqual } from 'date-fns';
import type { Apartment, Booking, TimeSlot } from '../types';
// TimeSlotStatus is already defined in types.ts, no need to redefine it here

// Travel time buffer in minutes between different apartments
const TRAVEL_TIME_BUFFER = 30;

// Generate time slots for a specific apartment and date
export const generateTimeSlots = (
  apartment: Apartment,
  date: string,
  bookings: Booking[]
  // userHomeLocation removed as it's not used in this function
): TimeSlot[] => {
  // If no bookings or empty bookings array, log it
  if (!bookings || bookings.length === 0) {
    console.log('WARNING: No bookings provided for', apartment.name, 'on', date);
  } else {
    console.log(`Processing ${bookings.length} bookings for ${apartment.name} on ${date}`);
  }
  try {
    console.log('Generating time slots for apartment:', apartment.name, 'date:', date);
    console.log('Bookings provided:', bookings);
    
    // Make sure apartment has required properties
    if (!apartment || !apartment.id) {
      console.error('Invalid apartment data:', apartment);
      return [];
    }
    
    // Ensure apartment has a defaultSlotDuration
    const defaultSlotDuration = apartment.defaultSlotDuration || 60; // Default to 1 hour
    const slots: TimeSlot[] = [];
    
    // Parse start and end times - use either operatingHours object or direct properties
    const startTimeStr = apartment.operatingHours?.start || apartment.start || '08:00';
    const endTimeStr = apartment.operatingHours?.end || apartment.end || '20:00';
    
    try {
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
        
        // Update slot with booking status if it exists - handle potential undefined values
        try {
          // Make sure bookings is an array
          const safeBookings = Array.isArray(bookings) ? bookings : [];
          
          // Log the current time slot we're checking
          console.log('Checking for bookings matching:', apartment.id, startTimeString, endTimeString);
          
          const existingBooking = safeBookings.find(
            (booking) => 
              booking && 
              booking.startTime === startTimeString && 
              booking.endTime === endTimeString &&
              booking.apartmentId === apartment.id
          );
          
          if (existingBooking) {
            // Set the slot as booked if there's an existing booking
            timeSlot.status = 'booked';
            timeSlot.booking = existingBooking;
            console.log('✓ FOUND BOOKING for slot:', startTimeString, '-', endTimeString, 'at', apartment.name);
          } else {
            // Debug output for detailed booking check
            console.log(`No exact match found for ${startTimeString}-${endTimeString} at ${apartment.name}`);
            
            // Log all bookings for debugging
            safeBookings.forEach((booking, idx) => {
              if (booking.apartmentId === apartment.id) {
                console.log(`Booking ${idx+1} available:`, 
                  'apartmentId:', booking.apartmentId, 
                  'time:', booking.startTime, '-', booking.endTime,
                  'matches current slot:', (booking.startTime === startTimeString && booking.endTime === endTimeString) ? 'YES' : 'NO'
                );
              }
            });
          }
        } catch (bookingErr) {
          console.error('Error processing bookings for time slot:', bookingErr);
        }
        
        slots.push(timeSlot);
        currentTime = addMinutes(currentTime, defaultSlotDuration);
      }
      
      console.log(`Generated ${slots.length} time slots for apartment ${apartment.name}`);
      return slots;
    } catch (timeParseError) {
      console.error('Time parsing error:', timeParseError);
      return [];
    }
  } catch (error) {
    console.error('Error in generateTimeSlots:', error);
    return [];
  }
  
  // No need for this return as we already return in all paths above
};

/**
 * Apply travel time restrictions based on bookings across all apartments
 * 
 * Core Logic:
 * 1. Show ALL booked slots across all locations
 * 2. Apply 30-minute travel buffer based on user's home location
 * 3. Example: If 3-4 PM is booked at Tamarind:
 *    - Tamarind residents see: 3-4 PM as unavailable
 *    - Quayside residents see: 2:30-4:30 PM as unavailable (with travel buffer)
 */
export const applyTravelTimeRestrictions = (
  allTimeSlots: TimeSlot[],
  userHomeLocation: string
): TimeSlot[] => {
  // First, find all bookings across all apartments
  const bookedSlots = allTimeSlots.filter(slot => 
    slot.status === 'booked' || slot.status === 'unavailable'
  );
  
  console.log('Applying travel time restrictions for user with home location:', userHomeLocation);
  console.log('Found booked slots:', bookedSlots.length);

  // Create a copy of all time slots to modify
  return allTimeSlots.map(slot => {
    // Skip modification for slots that are already booked or unavailable
    if (slot.status === 'booked' || slot.status === 'unavailable') {
      return slot;
    }
    
    // For each available slot, check if it needs a travel restriction
    for (const bookedSlot of bookedSlots) {
      // Don't apply travel restrictions for the same apartment
      // Users can book adjacent slots in the same apartment
      if (bookedSlot.apartmentId === slot.apartmentId) {
        continue;
      }
      
      // For each booked slot in other apartments, determine if this slot is affected
      // due to travel time restrictions
      
      try {
        // Parse times to Date objects for comparison
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
        
        // Calculate travel buffer times
        // If someone books 3:00-4:00 PM at Tamarind, the travel-restricted time at Quayside would be 2:30-4:30 PM
        const bufferBeforeBooked = addMinutes(bookedStartTime, -TRAVEL_TIME_BUFFER);
        const bufferAfterBooked = addMinutes(bookedEndTime, TRAVEL_TIME_BUFFER);
        
        // IMPORTANT LOGIC: How to apply the travel buffer
        // 1. Only apply travel buffer when the user is coming from a DIFFERENT apartment (not their home)
        // 2. For users whose home is in the booked apartment, no travel buffer needed
        // 3. For users whose home is elsewhere, apply travel buffer to both ends
        
        let hasConflict = false;
        
        if (userHomeLocation === bookedSlot.apartmentId) {
          // User's home is where the booking exists - they only see the exact booking time as unavailable
          // No travel buffer needed - only check if the slot directly overlaps with booked time
          hasConflict = (
            (isAfter(slotStartTime, bookedStartTime) || isEqual(slotStartTime, bookedStartTime)) &&
            (isBefore(slotStartTime, bookedEndTime))
          ) || (
            (isAfter(slotEndTime, bookedStartTime)) &&
            (isBefore(slotEndTime, bookedEndTime) || isEqual(slotEndTime, bookedEndTime))
          ) || (
            (isBefore(slotStartTime, bookedStartTime) || isEqual(slotStartTime, bookedStartTime)) &&
            (isAfter(slotEndTime, bookedEndTime) || isEqual(slotEndTime, bookedEndTime))
          );
        } else {
          // User's home is different than where the booking exists
          // Apply travel buffer on both sides of the booking
          hasConflict = (
            // Is slot start time within the buffered booking time (including buffer)?
            (isAfter(slotStartTime, bufferBeforeBooked) || isEqual(slotStartTime, bufferBeforeBooked)) &&
            (isBefore(slotStartTime, bufferAfterBooked) || isEqual(slotStartTime, bufferAfterBooked))
          ) || (
            // Is slot end time within the buffered booking time?
            (isAfter(slotEndTime, bufferBeforeBooked) || isEqual(slotEndTime, bufferBeforeBooked)) &&
            (isBefore(slotEndTime, bufferAfterBooked) || isEqual(slotEndTime, bufferAfterBooked))
          ) || (
            // Does slot fully encompass the buffered booking time?
            (isBefore(slotStartTime, bufferBeforeBooked) || isEqual(slotStartTime, bufferBeforeBooked)) &&
            (isAfter(slotEndTime, bufferAfterBooked) || isEqual(slotEndTime, bufferAfterBooked))
          );
        }
        
        // If there's a conflict, mark the slot as travel-restricted and break the loop
        if (hasConflict) {
          slot = { ...slot, status: 'travel-restricted' };
          if (userHomeLocation === bookedSlot.apartmentId) {
            // For residents of the apartment where booking exists, mark as unavailable instead
            slot.status = 'unavailable';
          }
          // No need to check other booked slots since we've already determined this one is restricted
          break;
        }
      } catch (error) {
        console.error('Error checking travel time restrictions:', error);
        // Continue with next booked slot if there's an error
        continue;
      }
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
