// React is now auto-imported in modern TypeScript React projects
import { format, addDays, subDays, isSameDay } from 'date-fns';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateChange }) => {
  const today = new Date();
  
  const goToNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };
  
  const goToPreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };
  
  const goToToday = () => {
    onDateChange(today);
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-lg shadow">
      <div className="mb-4 sm:mb-0">
        <h2 className="text-xl font-bold">{format(selectedDate, 'EEEE')}</h2>
        <p className="text-gray-500">{format(selectedDate, 'MMMM d, yyyy')}</p>
      </div>
      
      <div className="flex items-center">
        <button
          onClick={goToPreviousDay}
          className="p-2 rounded-l-lg border border-gray-300 hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={goToToday}
          className={`px-4 py-2 border-t border-b border-gray-300 ${
            isSameDay(selectedDate, today) ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
        >
          Today
        </button>
        
        <button
          onClick={goToNextDay}
          className="p-2 rounded-r-lg border border-gray-300 hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <div className="ml-4">
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => onDateChange(new Date(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
