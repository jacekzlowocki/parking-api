import { isBefore, isPast } from 'date-fns';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { getBooking } from '../repositories/bookings';

export const validateStartEndDates =
  (required: boolean, againstStored: boolean = false): RequestHandler =>
  async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    const errors: string[] = [];
    const {
      params: { id },
    } = request;

    let {
      body: { startDate, endDate },
    } = request;

    if (againstStored && id && (!startDate || !endDate)) {
      const booking = await getBooking(parseInt(id));

      if (booking) {
        startDate ??= booking.startDate;
        endDate ??= booking.endDate;
      }
    }

    if (required && !startDate) {
      errors.push('startDate is required');
    }

    if (required && !endDate) {
      errors.push('endDate is required');
    }

    if (startDate && !isValidDateInput(startDate)) {
      errors.push('Invalid startDate value');
    }

    if (endDate && !isValidDateInput(endDate)) {
      errors.push('Invalid endDate value');
    }

    if (startDate && endDate && !isBefore(startDate, endDate)) {
      errors.push('startDate has to be before endDate');
    }

    if (startDate && isPast(startDate)) {
      errors.push('startDate cannot be in the past');
    }

    if (errors.length === 0) {
      return next();
    }

    response.status(422).send({ error: errors.join('; ') });
  };

function isValidDateInput(input: string): boolean {
  return !isNaN(Date.parse(input));
}
