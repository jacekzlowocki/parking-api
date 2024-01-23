import { Between, FindOptionsWhere, LessThan, MoreThan, Not } from 'typeorm';
import { PotentialBooking } from '../contracts/PotentialBooking';
import { Booking } from '../entities/Booking';
import { bookingRepository } from '../repositories/bookings';

export const isConflictingBooking = async (
  booking: PotentialBooking,
): Promise<boolean> => {
  const baseCondition: FindOptionsWhere<Booking> = {
    parkingSpotId: booking.parkingSpotId,
    id: booking.id ? Not(booking.id) : undefined,
  };

  const existing = await bookingRepository().findBy([
    {
      ...baseCondition,
      startDate: Between(booking.startDate, booking.endDate),
    },
    {
      ...baseCondition,
      parkingSpotId: booking.parkingSpotId,
      endDate: Between(booking.startDate, booking.endDate),
    },
    {
      ...baseCondition,
      parkingSpotId: booking.parkingSpotId,
      startDate: LessThan(booking.startDate),
      endDate: MoreThan(booking.endDate),
    },
  ]);

  return existing.length > 0;
};
