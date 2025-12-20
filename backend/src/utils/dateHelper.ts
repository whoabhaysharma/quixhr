export const calculateLeaveDays = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
  return new Date(startDate) <= new Date(endDate);
};


