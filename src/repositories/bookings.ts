import { FindOptionsWhere, Repository } from 'typeorm';
import { appDataSource } from '../dataSource';
import { Booking } from '../entities/Booking';

export const bookingRepository = (): Repository<Booking> =>
  appDataSource().getRepository(Booking);

export const findBookings = (
  where?: FindOptionsWhere<Booking>,
  skip?: number,
  take?: number,
): Promise<Booking[]> => {
  return bookingRepository().find({ where, skip, take });
};

export const countBookings = (
  where?: FindOptionsWhere<Booking>,
): Promise<number> => {
  return bookingRepository().count({ where });
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

export const updateBooking = async (
  booking: Booking,
  data: Partial<Booking> = {},
): Promise<Booking> => {
  return bookingRepository().save({
    ...booking,
    ...data,
  });
};

export const removeBooking = async (booking: Booking): Promise<void> => {
  await bookingRepository().softRemove(booking);
};
