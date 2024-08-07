import { Timestamp } from 'firebase/firestore';

export const isEmptyObject = (obj: Object) =>
  Object.keys(obj || {}).length === 0;

export const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const daysBetweenDates = (date1: Date, date2: Date): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

// Returns number of days in a month
export const getNumOfDays = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};
export const capitalizeFirstLetter = (str: string) => {
  return str[0].toUpperCase() + str.slice(1);
};

// Function to convert a Date object to a string in the format "dd-mm-yyyy"
export function dateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Function to convert a string in the format "dd-mm-yyyy" to a Date object
export function stringToDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('-').map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error('Invalid date string');
  }
  return new Date(year, month - 1, day); // Month is 0-based in JavaScript
}

export const isTodayOrBefore = (date: Date | Timestamp) => {
  if (date instanceof Timestamp) {
    date = date.toDate();
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date <= today;
};

export const calculateWorkingDaysUntil = (targetDate: Date): number => {
  const currentDate = new Date();
  let workingDaysCount = 0;
  let currentDateCopy = new Date(currentDate);
  let targetDateCopy = new Date(targetDate);

  currentDateCopy.setHours(0, 0, 0, 0);
  targetDateCopy.setHours(0, 0, 0, 0);

  // Iterate from current date until the target date
  while (currentDateCopy.getTime() < targetDateCopy.getTime()) {
    // Check if the current day is a working day (Monday to Friday)
    if (currentDateCopy.getDay() !== 0 && currentDateCopy.getDay() !== 6) {
      workingDaysCount++; // Increment the working days count
    }
    currentDateCopy.setDate(currentDateCopy.getDate() + 1); // Move to the next day
  }

  return workingDaysCount;
};

export const generateCompanyInviteToken = () => {
  function rand() {
    return Math.random().toString(36).slice(2); // remove `0.`
  }
  return rand() + rand() + rand();
};
