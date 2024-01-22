import { FindManyOptions, Repository } from 'typeorm';
import { appDataSource } from '../dataSource';
import { Booking } from '../entities/Booking';

export const bookingRepository = (): Repository<Booking> =>
  appDataSource().getRepository(Booking);

export const findBookings = (
  options?: FindManyOptions<Booking>,
): Promise<Booking[]> => {
  return bookingRepository().find(options);
};

export const getBooking = (
  id: number,
  userId?: number,
): Promise<Booking | null> => {
  return bookingRepository().findOneBy({ id, userId });
};

export const createBooking = async (
  data: Partial<Booking>,
): Promise<Booking> => {
  const booking = bookingRepository().create(data);
  await bookingRepository().save(booking);

  return booking;
};
