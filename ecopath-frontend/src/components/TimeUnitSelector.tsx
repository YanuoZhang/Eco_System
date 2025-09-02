"use client";

export interface TimeUnit {
  value: "day" | "week" | "month" | "quarter";
  label: string;
  multiplier: number;
}

interface TimeUnitSelectorProps {
  selectedUnit: TimeUnit["value"];
  onUnitChange: (unit: TimeUnit["value"]) => void;
  className?: string;
  dataTestId?: string;
  type?: "energy" | "transport";
}

const energyTimeUnits: TimeUnit[] = [
  { value: "month", label: "Month", multiplier: 12 },
  { value: "quarter", label: "Quarter", multiplier: 4 },
];

const transportTimeUnits: TimeUnit[] = [
  { value: "day", label: "Day", multiplier: 365 },
  { value: "month", label: "Month", multiplier: 12 },
  { value: "quarter", label: "Year", multiplier: 1 },
];

const allTimeUnits: TimeUnit[] = [
  { value: "day", label: "Day", multiplier: 365 },
  { value: "week", label: "Week", multiplier: 52 },
  { value: "month", label: "Month", multiplier: 12 },
  { value: "quarter", label: "Quarter", multiplier: 4 },
];

export default function TimeUnitSelector({
  selectedUnit,
  onUnitChange,
  className = "",
  dataTestId = "time-unit-select",
  type = "energy",
}: TimeUnitSelectorProps) {
  const getTimeUnits = () => {
    switch (type) {
      case "energy":
        return energyTimeUnits;
      case "transport":
        return transportTimeUnits;
      default:
        return allTimeUnits;
    }
  };

  const timeUnits = getTimeUnits();

  return (
    <div
      className={`flex items-center space-x-2 bg-green-100 rounded-lg p-1 ${className}`}
      data-testid={dataTestId}
    >
      {timeUnits.map((unit) => (
        <button
          key={unit.value}
          type="button"
          onClick={() => onUnitChange(unit.value)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
            selectedUnit === unit.value
              ? "bg-green-500 text-white"
              : "text-green-600 hover:bg-green-200"
          }`}
          data-testid={`time-unit-${unit.value}`}
        >
          {unit.label}
        </button>
      ))}
    </div>
  );
}

export { allTimeUnits, energyTimeUnits, transportTimeUnits };
