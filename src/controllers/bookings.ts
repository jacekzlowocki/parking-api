import {
  Body,
  Get,
  Middlewares,
  Post,
  Put,
  Request,
  Response,
  Route,
  Security,
} from 'tsoa';
import { AuthenticatedBookingRequest } from '../contracts/AuthenticatedBookingRequest';
import { AuthenticatedRequest } from '../contracts/AuthenticatedRequest';
import { BookingPayload } from '../contracts/BookingPayload';
import { Booking } from '../entities/Booking';
import { UserRole } from '../entities/User';
import { unserializeBooking } from '../helpers/unserializeBooking';
import { loadBooking } from '../middleware/loadBooking';
import { validateEntity } from '../middleware/validateEntity';
import { validateUserId } from '../middleware/validateUserId';
import {
  createBooking,
  findBookings,
  updateBooking,
} from '../repositories/bookings';
import { parkingSpotRepository } from '../repositories/parkingSpots';
import { userRepository } from '../repositories/users';

@Route('bookings')
export class BookingsController {
  @Security('token')
  @Get('/')
  public async list(
    @Request() request: AuthenticatedRequest,
  ): Promise<Booking[]> {
    if (request.user.role === UserRole.Standard) {
      return await request.user.bookings;
    }

    // TODO: pagination
    return findBookings();
  }

  @Security('token')
  @Middlewares(loadBooking)
  @Get('/{id}')
  public async get(
    @Request() { booking }: AuthenticatedBookingRequest,
  ): Promise<Booking> {
    return booking;
  }

  @Security('token')
  @Middlewares(validateUserId)
  @Middlewares(validateEntity('userId', userRepository))
  @Middlewares(validateEntity('parkingSpotId', parkingSpotRepository))
  @Post('/')
  // TODO: more thorough validation rules (start/end)
  @Response(422, 'Validation Failed')
  public async create(
    @Request() request: AuthenticatedRequest,
    @Body() body: BookingPayload,
  ): Promise<Booking> {
    const { user } = request;

    if (!body.userId) {
      body.userId = user.id;
    }

    return createBooking(unserializeBooking(body));
  }

  @Security('token')
  @Middlewares(validateUserId)
  @Middlewares(validateEntity('userId', userRepository))
  @Middlewares(validateEntity('parkingSpotId', parkingSpotRepository))
  @Middlewares(loadBooking)
  @Put('/{id}')
  @Response(422, 'Validation Failed')
  public async update(
    @Request() request: AuthenticatedBookingRequest,
    @Body() body: Partial<BookingPayload>,
  ): Promise<Booking> {
    const { booking } = request;

    return updateBooking(booking, unserializeBooking(body));
  }
}
