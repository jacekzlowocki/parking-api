import {
  Body,
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
import { AuthenticatedBookingRequest } from '../contracts/AuthenticatedBookingRequest';
import { AuthenticatedRequest } from '../contracts/AuthenticatedRequest';
import { BookingPayload } from '../contracts/BookingPayload';
import { PaginatedResponse } from '../contracts/PaginatedResponse';
import { Booking } from '../entities/Booking';
import { UserRole } from '../entities/User';
import { unserializeBooking } from '../helpers/unserializeBooking';
import { loadBooking } from '../middleware/loadBooking';
import { validateEntity } from '../middleware/validateEntity';
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

const PAGE_SIZE_MAX = 100;
const PAGE_SIZE_DEFAULT = 10;

@Route('bookings')
export class BookingsController {
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
  public async get(
    @Request() { booking }: AuthenticatedBookingRequest,
    @Path('id')
    id: number /* eslint-disable-line @typescript-eslint/no-unused-vars */,
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
    @Path('id')
    id: number /* eslint-disable-line @typescript-eslint/no-unused-vars */,
  ): Promise<Booking> {
    const { booking } = request;

    return updateBooking(booking, unserializeBooking(body));
  }

  @Security('token')
  @Middlewares(validateUserId)
  @Middlewares(loadBooking)
  @Delete('/{id}')
  @Response(422, 'Validation Failed')
  public async delete(
    @Request() request: AuthenticatedBookingRequest,
    @Path('id')
    id: number /* eslint-disable-line @typescript-eslint/no-unused-vars */,
  ): Promise<void> {
    const { booking } = request;

    return removeBooking(booking);
  }
}
