import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './MonthYearPicker.css';

/**
 * Custom Month/Year Picker Component
 * Features:
 * - Month and Year selection
 * - "Present" option for current jobs/education
 * - Clean, accessible UI
 * - Consistent date formatting
 */

function MonthYearPicker({ value, onChange, placeholder = "Select date", allowPresent = false }) {
  // Parse the value (format: YYYY-MM or "present")
  const parseDate = (dateString) => {
    if (!dateString || dateString === 'present') return null;
    const [year, month] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  };

  // Format date to YYYY-MM
  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const selectedDate = parseDate(value);
  const isPresent = value === 'present';

  const handleDateChange = (date) => {
    if (date) {
      onChange(formatDate(date));
    } else {
      onChange('');
    }
  };

  const handlePresentToggle = () => {
    if (isPresent) {
      onChange('');
    } else {
      onChange('present');
    }
  };

  // Custom input component
  const CustomInput = forwardRef(({ value, onClick }, ref) => (
    <div className="date-picker-wrapper">
      <input
        type="text"
        value={isPresent ? 'Present' : value || ''}
        onClick={onClick}
        ref={ref}
        placeholder={placeholder}
        readOnly
        className="date-picker-input"
      />
    </div>
  ));

  return (
    <div className="month-year-picker">
      <DatePicker
        selected={isPresent ? null : selectedDate}
        onChange={handleDateChange}
        dateFormat="MMM yyyy"
        showMonthYearPicker
        showFullMonthYearPicker
        placeholderText={placeholder}
        customInput={<CustomInput />}
        maxDate={new Date()}
        yearDropdownItemNumber={50}
        scrollableYearDropdown
        disabled={isPresent}
      />
      {allowPresent && (
        <label className="present-checkbox">
          <input
            type="checkbox"
            checked={isPresent}
            onChange={handlePresentToggle}
          />
          <span>Present</span>
        </label>
      )}
    </div>
  );
}

export default MonthYearPicker;
