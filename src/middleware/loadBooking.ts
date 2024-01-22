import { NextFunction, Response } from 'express';
import { AuthenticatedBookingRequest } from '../contracts/AuthenticatedBookingRequest';
import { User, UserRole } from '../entities/User';
import { getBooking } from '../repositories/bookings';

export const loadBooking = async (
  request: AuthenticatedBookingRequest,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const { user, params } = request;

  const id = parseInt(params.id);
  const booking = await getBooking(id, getUserIdCriteria(user));

  if (booking) {
    request.booking = booking;
    return next();
  }

  response.status(404).send('Not Found');
};

function getUserIdCriteria(user: User) {
  return user.role === UserRole.Admin ? undefined : user.id;
}
