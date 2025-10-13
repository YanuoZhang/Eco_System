// Time unit utilities for consistent display across all quiz components

export type TimeUnit = "week" | "month" | "quarter" | "year";

/**
 * Get the display label for a time unit
 */
export const getTimeUnitLabel = (timeUnit: TimeUnit): string => {
  switch (timeUnit) {
    case "week":
      return "Weekly";
    case "month":
      return "Monthly";
    case "quarter":
      return "Quarterly";
    case "year":
      return "Yearly";
    default:
      return "Yearly";
  }
};

/**
 * Get the scale factor to convert from year to the specified time unit
 */
export const getTimeUnitScale = (timeUnit: TimeUnit): number => {
  switch (timeUnit) {
    case "week":
      return 52.143;
    case "month":
      return 12;
    case "quarter":
      return 4;
    case "year":
      return 1;
    default:
      return 1;
  }
};

/**
 * Convert annual emissions to the specified time unit
 */
export const convertAnnualToTimeUnit = (annualEmissions: number, timeUnit: TimeUnit): number => {
  const scale = getTimeUnitScale(timeUnit);
  return annualEmissions / scale;
};

/**
 * Format emissions display with proper unit
 */
export const formatEmissions = (annualEmissions: number, timeUnit: TimeUnit): string => {
  const converted = convertAnnualToTimeUnit(annualEmissions, timeUnit);
  const unitLabel = getTimeUnitLabel(timeUnit);
  return `${converted.toFixed(1)} kg CO₂/${unitLabel}`;
};
