import { format } from 'date-fns';
import type { TimeSlot, Apartment } from '../types';

interface TimeSlotGridProps {
  timeSlots: Record<string, TimeSlot[]>;
  apartments: Apartment[];
  userHomeLocation: string;
  date: Date;
  onSlotClick?: (timeSlot: TimeSlot) => void;
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  timeSlots,
  apartments,
  userHomeLocation,
  date,
  onSlotClick
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

  const getStatusClass = (status: TimeSlot['status']): string => {
    switch (status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 cursor-pointer';
      case 'booked':
        return 'bg-red-100 text-red-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      case 'travel-restricted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusText = (status: TimeSlot['status']): string => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'booked':
        return 'Booked';
      case 'unavailable':
        return 'Unavailable';
      case 'travel-restricted':
        return 'Travel Restricted';
      default:
        return '';
    }
  };

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">
        Schedule for {format(date, 'MMMM d, yyyy')}
      </h2>
      
      <div className="min-w-full shadow overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full bg-white">
          {/* Table Header */}
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                Location
              </th>
              {allTimes.map((time) => (
                <th 
                  key={time} 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                >
                  {time}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedApartments.map((apartment) => (
              <tr key={apartment.id}>
                <td className={`sticky left-0 bg-white px-6 py-4 whitespace-nowrap border-r ${apartment.id === userHomeLocation ? 'font-bold' : ''}`}>
                  {apartment.name}
                  {apartment.id === userHomeLocation && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Home
                    </span>
                  )}
                </td>
                
                {allTimes.map((time) => {
                  const slot = timeSlots[apartment.id]?.find(
                    (s) => s.startTime === time
                  );
                  
                  if (!slot) {
                    return <td key={`${apartment.id}-${time}`} className="px-6 py-4 whitespace-nowrap border-r bg-gray-50"></td>;
                  }
                  
                  return (
                    <td
                      key={`${apartment.id}-${time}`}
                      className={`px-6 py-4 whitespace-nowrap border-r ${getStatusClass(slot.status)}`}
                      onClick={() => slot.status === 'available' && onSlotClick && onSlotClick(slot)}
                    >
                      <div className="text-sm">
                        {getStatusText(slot.status)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 mr-2"></div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 mr-2"></div>
          <span className="text-sm">Booked/Unavailable</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 mr-2"></div>
          <span className="text-sm">Travel Restricted</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 border border-blue-500 bg-blue-100 mr-2"></div>
          <span className="text-sm">Your Home Location</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotGrid;
