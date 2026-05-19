import React from 'react'
import DatePicker from './DatePicker'

export default function DateDropdown({ 
  selectedDate, 
  onDateChange, 
  label = "Date",
  showDay = false,
  yearRange = 10,
}) {
  return (
    <DatePicker
      selectedDate={selectedDate}
      onDateChange={onDateChange}
      label={label}
      showDay={showDay}
      yearRange={yearRange}
    />
  )
}
