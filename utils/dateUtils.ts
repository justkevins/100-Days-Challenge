// Replaced date-fns with native implementation
export const getLocalDateString = (isoDateString: string): string => {
  // Take the first 10 chars (YYYY-MM-DD) from the ISO string provided by Strava's start_date_local
  // This avoids any browser timezone conversion issues.
  return isoDateString.substring(0, 10);
};

export const generateChallengeDates = (startDate: string, duration: number): string[] => {
  const dates: string[] = [];
  const [y, m, d] = startDate.split('-').map(Number);
  // Create date at noon to avoid timezone/DST edge cases shifting the day
  const cursor = new Date(y, m - 1, d, 12, 0, 0); 

  for (let i = 0; i < duration; i++) {
    const current = new Date(cursor);
    current.setDate(cursor.getDate() + i);
    
    // Format to YYYY-MM-DD
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
};

export const formatDistance = (meters: number): string => {
  return (meters / 1000).toFixed(2);
};