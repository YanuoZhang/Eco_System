'use client';

import { useState } from 'react';

export interface TimeRange {
  label: string;
  value: number;
}

interface RangeSelectorProps {
  ranges: TimeRange[];
  selectedValue: number;
  onRangeChange: (value: number) => void;
  label?: string;
  className?: string;
}

export default function RangeSelector({ 
  ranges, 
  selectedValue, 
  onRangeChange, 
  label = "Time Range:",
  className = ""
}: RangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleRangeChange = (value: number) => {
    onRangeChange(value);
    setIsOpen(false);
  };

  const selectedRange = ranges.find(range => range.value === selectedValue);

  return (
    <div className={`relative ${className}`}>
      <label className="text-sm text-gray-600 mb-2 block">{label}</label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:bg-gray-50 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="block truncate">{selectedRange?.label || 'Select range'}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <ul className="py-1 max-h-60 overflow-auto">
              {ranges.map((range) => (
                <li key={range.value}>
                  <button
                    type="button"
                    onClick={() => handleRangeChange(range.value)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-green-50 hover:text-green-900 transition-colors ${
                      range.value === selectedValue 
                        ? 'bg-green-100 text-green-900' 
                        : 'text-gray-900'
                    }`}
                  >
                    {range.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
