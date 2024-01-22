import { Booking } from '../entities/Booking';
import { AuthenticatedRequest } from './AuthenticatedRequest';

export interface AuthenticatedBookingRequest extends AuthenticatedRequest {
  booking: Booking;
}
