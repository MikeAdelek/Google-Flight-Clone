import React from "react";

interface CheckboxGroupProps {
  title: string;
  options: Array<{ value: string; label: string; count?: number }>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  title,
  options,
  selectedValues,
  onChange
}) => {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter((v) => v !== value));
    }
  };

  return (
    <div className="mb-6">
      <h3 className="font-medium text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 flex-1">{option.label}</span>
            {option.count && (
              <span className="text-xs text-gray-500">({option.count})</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};
