import React from 'react';
import { format } from 'date-fns';
import type { Booking, Apartment } from '../types';

interface DirectBookingGridProps {
  apartments: Apartment[];
  bookings: Booking[];
  userHomeLocation: string;
  date: Date;
  onSlotClick?: (apartmentId: string, time: string, endTime: string) => void;
}

/**
 * A simplified grid component that directly shows bookings without complex time slot generation
 */
const DirectBookingGrid: React.FC<DirectBookingGridProps> = ({
  apartments,
  bookings,
  userHomeLocation,
  date,
  onSlotClick
}) => {
  // Generate time slots from 8:00 to 20:00 (8am to 8pm)
  const timeSlots = [];
  for (let hour = 8; hour < 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // Sort apartments to show user's home location first
  const sortedApartments = [...apartments].sort((a, b) => {
    if (a.id === userHomeLocation) return -1;
    if (b.id === userHomeLocation) return 1;
    return a.name.localeCompare(b.name);
  });

  // Function to get end time (1 hour later)
  const getEndTime = (time: string) => {
    const [hours] = time.split(':');
    const nextHour = (parseInt(hours) + 1) % 24;
    return `${nextHour.toString().padStart(2, '0')}:00`;
  };

  // Function to check if a slot is booked
  const isSlotBooked = (apartmentId: string, startTime: string): Booking | undefined => {
    return bookings.find(
      booking => 
        booking.apartmentId === apartmentId && 
        booking.startTime === startTime
    );
  };

  // Function to check if slot falls within travel buffer
  const isTravelBufferSlot = (apartmentId: string, startTime: string): boolean => {
    // Don't apply travel buffer to user's home location
    if (apartmentId === userHomeLocation) return false;
    
    // Look for any booking in any apartment
    for (const booking of bookings) {
      // Skip bookings in the current apartment (those are direct bookings, not travel buffers)
      if (booking.apartmentId === apartmentId) continue;
      
      // Get booking time as hour number for easy comparison
      const bookingHour = parseInt(booking.startTime.split(':')[0]);
      const slotHour = parseInt(startTime.split(':')[0]);
      
      // If slot is within +/- 1 hour of a booking, it's a travel buffer slot
      if (Math.abs(slotHour - bookingHour) <= 1) {
        return true;
      }
    }
    return false;
  };

  // Function to get display classes based on slot status
  const getSlotClasses = (apartmentId: string, time: string): string => {
    const booking = isSlotBooked(apartmentId, time);
    const isHomeLocation = apartmentId === userHomeLocation;
    
    if (booking) {
      // Booked slot
      return isHomeLocation 
        ? 'bg-red-200 text-red-800' 
        : 'bg-red-100 text-red-800';
    } else if (isTravelBufferSlot(apartmentId, time)) {
      // Travel buffer slot
      return 'bg-yellow-100 text-yellow-800';
    } else {
      // Available slot
      return 'bg-green-100 hover:bg-green-200 cursor-pointer';
    }
  };

  // Function to get slot text based on status
  const getSlotText = (apartmentId: string, time: string): string => {
    const booking = isSlotBooked(apartmentId, time);
    
    if (booking) {
      return booking.bookedBy === 'admin' ? 'Reserved' : 'Booked';
    } else if (isTravelBufferSlot(apartmentId, time)) {
      return 'Travel Buffer';
    } else {
      return 'Available';
    }
  };

  // Function to get tooltip text
  const getTooltip = (apartmentId: string, time: string): string => {
    const booking = isSlotBooked(apartmentId, time);
    const isHomeLocation = apartmentId === userHomeLocation;
    
    if (booking) {
      if (isHomeLocation) {
        return `This time is booked by ${booking.bookedBy || 'someone'} at your home pool`;
      } else {
        const bookedApartment = apartments.find(apt => apt.id === booking.apartmentId);
        return `This time is booked at ${bookedApartment?.name || 'another pool'}`;
      }
    } else if (isTravelBufferSlot(apartmentId, time)) {
      return 'Travel buffer from another booking (30 min before/after)';
    } else {
      return 'Click to book this time slot';
    }
  };

  // Count bookings per apartment
  const countBookings = (apartmentId: string): number => {
    return bookings.filter(b => b.apartmentId === apartmentId).length;
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        Schedule for {format(date, 'MMMM d, yyyy')}
      </h2>

      {/* Calendar-Style Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto mb-6">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left font-medium text-gray-500">Time</th>
                {sortedApartments.map(apartment => {
                  const isHome = apartment.id === userHomeLocation;
                  const bookedCount = countBookings(apartment.id);
                  
                  return (
                    <th key={apartment.id} className="py-3 px-4 text-left min-w-[150px]">
                      <div className={`font-medium ${isHome ? 'text-blue-600 border-b-2 border-blue-500 pb-1' : ''}`}>
                        {apartment.name}
                        {isHome && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Home
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {apartment.operatingHours?.start || '08:00'}-{apartment.operatingHours?.end || '20:00'}
                        </span>
                        <span className={`text-xs ${bookedCount > 0 ? 'text-red-600' : 'text-green-600'} font-medium`}>
                          {bookedCount > 0 ? `${bookedCount} booked` : 'Available'}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            
            <tbody>
              {timeSlots.map(time => {
                const endTime = getEndTime(time);
                
                return (
                  <tr key={time} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 text-sm font-medium text-gray-700 border-r border-gray-200">
                      {time}
                    </td>
                    
                    {sortedApartments.map(apartment => {
                      const booking = isSlotBooked(apartment.id, time);
                      const slotClasses = getSlotClasses(apartment.id, time);
                      const slotText = getSlotText(apartment.id, time);
                      const tooltip = getTooltip(apartment.id, time);
                      const isAvailable = !booking && !isTravelBufferSlot(apartment.id, time);
                      
                      return (
                        <td 
                          key={`${apartment.id}-${time}`} 
                          className="py-2 px-4"
                        >
                          <div 
                            onClick={() => isAvailable && onSlotClick && onSlotClick(apartment.id, time, endTime)}
                            className={`
                              rounded-md px-3 py-2 relative
                              ${slotClasses}
                              ${isAvailable ? 'hover:bg-green-200 transition-colors' : ''}
                            `}
                            title={tooltip}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium">
                                {slotText}
                              </span>
                              <span className="text-xs">{endTime}</span>
                            </div>
                            
                            {booking && (
                              <div className="text-xs truncate mt-1 font-medium">
                                {booking.userName || booking.bookedBy}
                              </div>
                            )}
                            
                            {isTravelBufferSlot(apartment.id, time) && !booking && (
                              <span className="absolute top-0 right-0 -mt-1 -mr-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Legend */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <h3 className="font-semibold text-sm mb-2">Legend:</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded-sm mr-2"></div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 border border-red-300 rounded-sm mr-2"></div>
            <span className="text-sm">Booked (Home Pool)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded-sm mr-2"></div>
            <span className="text-sm">Booked (Other Pool)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded-sm mr-2"></div>
            <span className="text-sm">Travel Buffer (30 min)</span>
          </div>
          <div className="flex items-center">
            <div className="text-blue-600 font-medium border-b-2 border-blue-500 px-2 mr-2">Pool</div>
            <span className="text-sm">Home Pool</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectBookingGrid;
