import React from 'react';
import { format } from 'date-fns';
import type { TimeSlot, Apartment } from '../types';

interface TimeSlotGridProps {
  timeSlots: Record<string, TimeSlot[]>;
  apartments: Apartment[];
  userHomeLocation: string;
  date: Date;
  onSlotClick?: (slot: TimeSlot) => void;
  bookings: { [key: string]: number }; // Count of bookings by apartment
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  timeSlots,
  apartments,
  userHomeLocation,
  date,
  onSlotClick,
  bookings = {}
}) => {
  // Get all unique times from all apartments for the time headers
  const allTimes = Object.values(timeSlots)
    .flat()
    .map(slot => slot.startTime)
    .filter((time, index, self) => self.indexOf(time) === index)
    .sort();

  // Sort apartments to show user's home location first
  const sortedApartments = [...apartments].sort((a, b) => {
    if (a.id === userHomeLocation) return -1;
    if (b.id === userHomeLocation) return 1;
    return a.name.localeCompare(b.name);
  });

  const getStatusClass = (status: TimeSlot['status'], isHomeLocation: boolean): string => {
    switch (status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 cursor-pointer';
      case 'booked':
        return isHomeLocation ? 'bg-red-200 text-red-800' : 'bg-red-100 text-red-800';
      case 'unavailable':
        return isHomeLocation ? 'bg-red-200 text-red-800' : 'bg-red-100 text-red-800';
      case 'travel-restricted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusText = (status: TimeSlot['status'], isHomeLocation: boolean, slot: TimeSlot): string => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'booked':
        // Show more details for booked slots
        return slot.booking?.bookedBy === 'admin' ? 'Reserved' : 'Booked';
      case 'unavailable':
        return isHomeLocation ? 'Booked' : 'Unavailable';
      case 'travel-restricted':
        return 'Travel Buffer';
      default:
        return '';
    }
  };
  
  // Get a tooltip message for the status
  const getStatusTooltip = (status: TimeSlot['status'], isHomeLocation: boolean, slot: TimeSlot): string => {
    switch (status) {
      case 'available':
        return 'Click to book this time slot';
      case 'booked':
        if (isHomeLocation) {
          return `This time is booked by ${slot.booking?.bookedBy || 'someone'} at your home pool`;
        } else {
          // Find apartment name by ID
          const bookedApartment = apartments.find(apt => apt.id === slot.booking?.apartmentId);
          return `This time is booked at ${bookedApartment?.name || 'another pool'}`;
        }
      case 'unavailable':
        return 'This time is unavailable';
      case 'travel-restricted':
        return '30-minute travel buffer from another booking';
      default:
        return '';
    }
  };

  // Function to count booked/unavailable slots for an apartment using either the bookings prop or computed from timeSlots
  const countBookedSlots = (apartmentId: string): number => {
    // Use the bookings prop if provided, otherwise calculate from timeSlots
    if (bookings && bookings[apartmentId] !== undefined) {
      return bookings[apartmentId];
    }
    
    // Fallback to counting from timeSlots
    if (!timeSlots[apartmentId]) return 0;
    return timeSlots[apartmentId].filter(slot => 
      slot.status === 'booked' || slot.status === 'unavailable'
    ).length;
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        Schedule for {format(date, 'MMMM d, yyyy')}
      </h2>

      {/* Calendar-Style Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto mb-6">
        <div className="min-w-max"> {/* Ensure table doesn't get squished */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left font-medium text-gray-500">Time</th>
                {sortedApartments.map(apartment => {
                  const isHome = apartment.id === userHomeLocation;
                  const bookedCount = countBookedSlots(apartment.id);
                  
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
              {allTimes.map(time => {
                return (
                  <tr key={time} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 text-sm font-medium text-gray-700 border-r border-gray-200">
                      {time}
                    </td>
                    
                    {sortedApartments.map(apartment => {
                      const aptSlots = timeSlots[apartment.id] || [];
                      const slot = aptSlots.find(s => s.startTime === time);
                      if (!slot) return <td key={`${apartment.id}-${time}`} className="py-2 px-4"></td>;
                      
                      const isHomeLocation = apartment.id === userHomeLocation;
                      
                      return (
                        <td 
                          key={`${apartment.id}-${time}`} 
                          className={`py-2 px-4 ${slot.status === 'available' ? 'cursor-pointer' : ''}`}
                        >
                          <div 
                            onClick={() => slot.status === 'available' && onSlotClick && onSlotClick(slot)}
                            className={`
                              rounded-md px-3 py-2 relative
                              ${getStatusClass(slot.status, isHomeLocation)}
                              ${slot.status === 'available' ? 'hover:bg-green-200 transition-colors' : ''}
                            `}
                            title={getStatusTooltip(slot.status, isHomeLocation, slot)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium">
                                {getStatusText(slot.status, isHomeLocation, slot)}
                              </span>
                              <span className="text-xs">{slot.endTime}</span>
                            </div>
                            
                            {slot.booking && slot.status === 'booked' && (
                              <div className="text-xs truncate mt-1 font-medium">
                                {slot.booking.userName || slot.booking.bookedBy}
                              </div>
                            )}
                            
                            {slot.status === 'travel-restricted' && (
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

export default TimeSlotGrid;
