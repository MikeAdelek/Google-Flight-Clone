import React, { useState } from "react";

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label: string;
  formatValue?: (value: number) => string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  label,
  formatValue = (v) => v.toString()
}) => {
  const [localValue, setLocalValue] = useState(value);
  const handleChange = (index: number, newValue: number) => {
    const newRange: [number, number] = [...localValue];
    newRange[index] = newValue;
    setLocalValue(newRange);
    onChange(newRange);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-600">
          {formatValue(localValue[0])} - {formatValue(localValue[1])}
        </span>
      </div>
      <div className="relative">
        <input
          aria-label="Range"
          type="range"
          min={min}
          max={max}
          value={localValue[0]}
          onChange={(e) => handleChange(0, parseInt(e.target.value))}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <input
          aria-label="Range"
          type="range"
          min={min}
          max={max}
          value={localValue[1]}
          onChange={(e) => handleChange(1, parseInt(e.target.value))}
          className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};
