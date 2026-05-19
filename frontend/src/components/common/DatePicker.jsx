import React, { useState, useEffect, useRef } from 'react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getRelativeDescription(date) {
  if (!date) return ''
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  
  const diffMs = target - now
  const diffDays = Math.round(diffMs / 86400000)
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7) return `${DAY_NAMES[target.getDay()]}, this week`
  if (diffDays > 7 && diffDays <= 14) return `${DAY_NAMES[target.getDay()]}, next week`
  if (diffDays > 14 && diffDays <= 30) return `In ${Math.ceil(diffDays / 7)} weeks`
  if (diffDays > 30 && diffDays <= 60) return 'Next month'
  if (diffDays > 60 && diffDays <= 365) return `In ${Math.round(diffDays / 30)} months`
  if (diffDays > 365) return `In ${Math.round(diffDays / 365)} year(s)`
  if (diffDays < -1 && diffDays >= -7) return `${DAY_NAMES[target.getDay()]}, last week`
  if (diffDays < -7 && diffDays >= -30) return `${Math.abs(Math.ceil(diffDays / 7))} weeks ago`
  if (diffDays < -30 && diffDays >= -60) return 'Last month'
  if (diffDays < -60 && diffDays >= -365) return `${Math.abs(Math.round(diffDays / 30))} months ago`
  if (diffDays < -365) return `${Math.abs(Math.round(diffDays / 365))} year(s) ago`
  return ''
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

// iOS-style Scroll Wheel Column
function ScrollColumn({ items, selectedIndex, onSelect, label }) {
  const containerRef = useRef(null)
  const itemHeight = 40

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = selectedIndex * itemHeight
    }
  }, [selectedIndex])

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop
      const newIndex = Math.round(scrollTop / itemHeight)
      if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < items.length) {
        onSelect(newIndex)
      }
    }
  }

  return (
    <div className="flex flex-col items-center flex-1">
      <span className="text-xs text-gray-500 mb-1 font-medium">{label}</span>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[120px] overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        <div style={{ height: `${itemHeight}px` }} />
        {items.map((item, i) => (
          <div 
            key={i}
            onClick={() => onSelect(i)}
            className={`h-[40px] flex items-center justify-center cursor-pointer snap-center transition-all duration-200 ${
              i === selectedIndex 
                ? 'text-lg font-bold text-[#CB7246]' 
                : 'text-sm text-gray-400'
            }`}
            style={{ scrollSnapAlign: 'center' }}
          >
            {item}
          </div>
        ))}
        <div style={{ height: `${itemHeight}px` }} />
      </div>
    </div>
  )
}

export default function DatePicker({ 
  selectedDate, 
  onDateChange, 
  label = "Select Date",
  showDay = true,
  yearRange = 10
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [viewYear, setViewYear] = useState((selectedDate || new Date()).getFullYear())
  const [viewMonth, setViewMonth] = useState((selectedDate || new Date()).getMonth())
  const [isMobile, setIsMobile] = useState(false)
  const pickerRef = useRef(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate)
      setViewYear(selectedDate.getFullYear())
      setViewMonth(selectedDate.getMonth())
    }
  }, [selectedDate])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateSelect = (date) => {
    setCurrentDate(date)
    onDateChange(date)
  }

  const formatDisplayDate = () => {
    if (!selectedDate) return 'Select date'
    const day = DAY_NAMES[selectedDate.getDay()].slice(0, 3)
    const month = MONTHS[selectedDate.getMonth()].slice(0, 3)
    return `${day}, ${month} ${selectedDate.getDate()}`
  }

  // Calendar Grid (Android-style)
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-9 h-9" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day)
      const isSelected = selectedDate && 
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getFullYear() === viewYear
      const isToday = new Date().toDateString() === date.toDateString()

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(date)}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
            isSelected 
              ? 'bg-[#CB7246] text-white font-bold' 
              : isToday 
                ? 'border-2 border-[#CB7246] text-[#CB7246] font-medium'
                : 'text-gray-700 hover:bg-orange-50'
          }`}
        >
          {day}
        </button>
      )
    }

    return days
  }

  // iOS Scroll Wheel
  const renderScrollWheel = () => {
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: yearRange * 2 }, (_, i) => currentYear - yearRange + i)
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const dayItems = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const selectedDay = currentDate.getDate()
    const selectedMonth = currentDate.getMonth()
    const selectedYear = currentDate.getFullYear()

    return (
      <div className="flex items-center justify-center gap-2 py-4 border-t border-b border-gray-100 my-2">
        {showDay && (
          <ScrollColumn
            items={dayItems}
            selectedIndex={selectedDay - 1}
            onSelect={(i) => {
              const newDate = new Date(selectedYear, selectedMonth, i + 1)
              handleDateSelect(newDate)
            }}
            label="Day"
          />
        )}
        <ScrollColumn
          items={MONTHS}
          selectedIndex={selectedMonth}
          onSelect={(i) => {
            setViewMonth(i)
            const maxDay = getDaysInMonth(selectedYear, i)
            const day = Math.min(selectedDay, maxDay)
            const newDate = new Date(selectedYear, i, day)
            handleDateSelect(newDate)
          }}
          label="Month"
        />
        <ScrollColumn
          items={years}
          selectedIndex={years.indexOf(selectedYear)}
          onSelect={(i) => {
            setViewYear(years[i])
            const maxDay = getDaysInMonth(years[i], selectedMonth)
            const day = Math.min(selectedDay, maxDay)
            const newDate = new Date(years[i], selectedMonth, day)
            handleDateSelect(newDate)
          }}
          label="Year"
        />
      </div>
    )
  }

  return (
    <div className="relative" ref={pickerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      
      {/* Input Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-[#CB7246] transition-colors flex items-center justify-between bg-white"
      >
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-400'}>
          {formatDisplayDate()}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Picker Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#CB7246] to-[#F27C12] text-white p-4">
            <p className="text-xs uppercase tracking-wider opacity-80">Select Date</p>
            <h3 className="text-xl font-bold mt-1">{formatDisplayDate()}</h3>
            {selectedDate && (
              <p className="text-sm opacity-90 mt-1">{getRelativeDescription(selectedDate)}</p>
            )}
          </div>

          {/* Desktop: Calendar Grid */}
          {!isMobile && (
            <div className="p-4">
              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => {
                  if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
                  else setViewMonth(viewMonth - 1)
                }} className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="font-semibold text-gray-800">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button type="button" onClick={() => {
                  if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
                  else setViewMonth(viewMonth + 1)
                }} className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map((day, i) => (
                  <div key={i} className="w-9 h-8 flex items-center justify-center text-xs font-semibold text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendarGrid()}
              </div>
            </div>
          )}

          {/* Mobile: iOS Scroll Wheel */}
          {isMobile && renderScrollWheel()}

          {/* Footer */}
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                handleDateSelect(new Date())
                setIsOpen(false)
              }}
              className="text-sm text-[#CB7246] font-medium hover:text-[#F27C12]"
            >
              Today
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-500 font-medium hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm text-[#CB7246] font-bold hover:text-[#F27C12]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
