import { faker } from '@faker-js/faker';
import { addDays, addHours } from 'date-fns';
import { v4 } from 'uuid';
import { Booking } from '../../src/entities/Booking';
import { ParkingSpot } from '../../src/entities/ParkingSpot';
import { User, UserRole } from '../../src/entities/User';
import { createBooking } from '../../src/repositories/bookings';
import { createParkingSpot } from '../../src/repositories/parkingSpots';
import { createUser } from '../../src/repositories/users';

export const createTestUser = async (params?: Partial<User>): Promise<User> => {
  return await createUser({
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    token: v4(),
    role: UserRole.Standard,
    ...params,
  });
};

export const createTestParkingSpot = async (
  params?: Partial<ParkingSpot>,
): Promise<ParkingSpot> => {
  return await createParkingSpot({
    name: faker.lorem.words(2),
    ...params,
  });
};

export const createTestBooking = async (
  params: { userId: number; parkingSpotId: number } & Partial<Booking>,
): Promise<Booking> => {
  return await createBooking({
    startDate: addHours(new Date(), 1),
    endDate: addDays(new Date(), 1),
    ...params,
  });
};
