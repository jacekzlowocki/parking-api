import { parseISO } from 'date-fns';
import {
  Body,
  Get,
  Path,
  Post,
  Put,
  Request,
  Response,
  Route,
  Security,
} from 'tsoa';
import { ApiError } from '../contracts/ApiError';
import { AuthenticatedRequest } from '../contracts/AuthenticatedRequest';
import { BookingPayload } from '../contracts/BookingPayload';
import { Booking } from '../entities/Booking';
import { UserRole } from '../entities/User';
import {
  createBooking,
  findBookings,
  getBooking,
} from '../repositories/bookings';
import { getParkingSpot } from '../repositories/parkingSpots';
import { getUser } from '../repositories/users';

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

    return findBookings();
  }

  @Security('token')
  @Post('/')
  @Response(422, 'Validation Failed')
  public async create(
    @Request() request: AuthenticatedRequest,
    @Body() body: BookingPayload,
  ): Promise<Booking> {
    const { user } = request;

    if (!body.userId) {
      body.userId = user.id;
    }

    if (body.userId !== user.id && user.role !== UserRole.Admin) {
      throw new ApiError('Illegal userId set', 422);
    }

    const parkingSpot = await getParkingSpot(body.parkingSpotId);
    const bookingUser = body.userId ? await getUser(body.userId) : user;

    if (!parkingSpot) {
      throw new ApiError(`ParkingSpot ${body.parkingSpotId} not found`, 422);
    }

    if (!bookingUser) {
      throw new ApiError(`User ${body.userId} not found`, 422);
    }

    return createBooking({
      ...body,
      startDate: parseISO(body.startDate),
      endDate: parseISO(body.endDate),
    });
  }

  @Security('token')
  @Put('/{id}')
  @Response(422, 'Validation Failed')
  public async update(
    @Request() request: AuthenticatedRequest,
    @Path() id: number,
    @Body() body: BookingPayload,
  ): Promise<Booking> {
    const { user } = request;
    const booking = await getBooking(id);

    if (
      !booking ||
      (booking?.user.id !== user.id && user.role !== UserRole.Admin)
    ) {
      throw new ApiError('Booking not found', 404);
    }

    if (
      body.userId &&
      body.userId !== user.id &&
      user.role !== UserRole.Admin
    ) {
      throw new ApiError('Illegal userId set', 422);
    }

    const parkingSpot = await getParkingSpot(body.parkingSpotId);
    const bookingUser = body.userId ? await getUser(body.userId) : user;

    if (!parkingSpot) {
      throw new ApiError(`ParkingSpot ${body.parkingSpotId} not found`, 400);
    }

    if (!bookingUser) {
      throw new ApiError(`User ${body.userId} not found`, 400);
    }

    return createBooking({
      parkingSpot: parkingSpot,
      user: bookingUser,
      startDate: parseISO(body.startDate),
      endDate: parseISO(body.endDate),
    });
  }
}
