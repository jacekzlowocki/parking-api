import { BookingPayload } from '../contracts/BookingPayload';
import { Booking } from '../entities/Booking';
import { parseDate } from './parseDate';

export const unserializeBooking = (
  payload: Partial<BookingPayload>,
): Partial<Booking> => ({
  ...payload,
  startDate: parseDate(payload.startDate),
  endDate: parseDate(payload.endDate),
});
