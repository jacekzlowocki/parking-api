import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
  Path,
  Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
} from 'tsoa';
import { ApiError } from '../contracts/ApiError';
import { AuthenticatedBookingRequest } from '../contracts/AuthenticatedBookingRequest';
import { AuthenticatedRequest } from '../contracts/AuthenticatedRequest';
import { BookingPayload } from '../contracts/BookingPayload';
import { PaginatedResponse } from '../contracts/PaginatedResponse';
import { PotentialBooking } from '../contracts/PotentialBooking';
import { Booking } from '../entities/Booking';
import { UserRole } from '../entities/User';
import { unserializeBooking } from '../helpers/unserializeBooking';
import { loadBooking } from '../middleware/loadBooking';
import { validateEntity } from '../middleware/validateEntity';
import { validateStartEndDates } from '../middleware/validateStartEndDates';
import { validateUserId } from '../middleware/validateUserId';
import {
  countBookings,
  createBooking,
  findBookings,
  removeBooking,
  updateBooking,
} from '../repositories/bookings';
import { parkingSpotRepository } from '../repositories/parkingSpots';
import { userRepository } from '../repositories/users';
import { isConflictingBooking } from '../services/booking-service';

const PAGE_SIZE_MAX = 100;
const PAGE_SIZE_DEFAULT = 10;

type RequestError = {
  error: string;
};

@Route('bookings')
export class BookingsController extends Controller {
  @Security('token')
  @Get('/')
  public async list(
    @Request() request: AuthenticatedRequest,
    @Query('page') page: number = 0,
    @Query('pageSize') requestedPageSize: number = PAGE_SIZE_DEFAULT,
  ): Promise<PaginatedResponse<Booking[]>> {
    const criteria: Partial<Booking> = {};
    const pageSize = Math.min(requestedPageSize, PAGE_SIZE_MAX);

    if (request.user.role === UserRole.Standard) {
      criteria.userId = request.user.id;
    }

    return {
      data: await findBookings(criteria, page * pageSize, pageSize),
      meta: {
        page,
        pageSize,
        total: await countBookings(criteria),
      },
    };
  }

  @Security('token')
  @Middlewares(loadBooking)
  @Get('/{id}')
  @Response<RequestError>(422, 'Unprocessable Content')
  public async get(
    @Request() { booking }: AuthenticatedBookingRequest,
    @Path('id')
    id: number /* eslint-disable-line @typescript-eslint/no-unused-vars */,
  ): Promise<Booking> {
    return booking;
  }

  @Security('token')
  @Middlewares(validateUserId)
  @Middlewares(validateStartEndDates(true))
  @Middlewares(validateEntity('userId', userRepository))
  @Middlewares(validateEntity('parkingSpotId', parkingSpotRepository))
  @Post('/')
  @Response<RequestError>(400, 'Invalid Request')
  @Response<RequestError>(422, 'Unprocessable Content')
  public async create(
    @Request() request: AuthenticatedRequest,
    @Body() body: BookingPayload,
  ): Promise<Booking> {
    const { user } = request;
    const booking = unserializeBooking({
      userId: user.id,
      ...body,
    }) as PotentialBooking;

    if (await isConflictingBooking(booking)) {
      throw new ApiError(
        'This Parking Spot is already booked for that time period',
        400,
      );
    }

    return createBooking(booking);
  }

  @Security('token')
  @Middlewares(loadBooking)
  @Middlewares(validateUserId)
  @Middlewares(validateStartEndDates(false, true))
  @Middlewares(validateEntity('userId', userRepository))
  @Middlewares(validateEntity('parkingSpotId', parkingSpotRepository))
  @Put('/{id}')
  @Response<RequestError>(400, 'Invalid Request')
  @Response<RequestError>(422, 'Unprocessable Content')
  public async update(
    @Request() request: AuthenticatedBookingRequest,
    @Body() body: Partial<BookingPayload>,
    @Path('id')
    id: number /* eslint-disable-line @typescript-eslint/no-unused-vars */,
  ): Promise<Booking> {
    const { booking } = request;

    const updated = {
      ...booking,
      ...unserializeBooking(body),
    };

    if (await isConflictingBooking(updated)) {
      throw new ApiError(
        'This Parking Spot is already booked for that time period',
        400,
      );
    }

    return updateBooking(updated);
  }

  @Security('token')
  @Middlewares(validateUserId)
  @Middlewares(loadBooking)
  @Delete('/{id}')
  @Response<RequestError>(422, 'Unprocessable Content')
  public async delete(
    @Request() request: AuthenticatedBookingRequest,
    @Path('id')
    id: number /* eslint-disable-line @typescript-eslint/no-unused-vars */,
  ): Promise<void> {
    const { booking } = request;

    return removeBooking(booking);
  }
}
