/**
 * Format Date into ISO string, without altering a timezone (keeps UTC).
 *
 * @param date
 * @returns string
 */
export const uformatISO = (date: Date): string => {
  const isoDate = date.toISOString();

  return `${isoDate.substring(0, 10)}T${isoDate.substring(11, 23)}Z`;
};
