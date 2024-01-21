import { addDays, formatISO } from 'date-fns';
import { Server } from 'http';
import request from 'supertest';
import { Booking } from '../../../../src/entities/Booking';
import { ParkingSpot } from '../../../../src/entities/ParkingSpot';
import { User, UserRole } from '../../../../src/entities/User';
import { bookingRepository } from '../../../../src/repositories/bookings';
import { clearDB } from '../../../helpers/db';
import {
  createTestBooking,
  createTestParkingSpot,
  createTestUser,
} from '../../../helpers/entities';
import { server, stopServer } from '../../server';

describe('as admin user', () => {
  let app: Server;
  let adminUser: User;
  let standardUser: User;
  let parkingSpot1: ParkingSpot;
  let parkingSpot2: ParkingSpot;

  beforeAll(async () => {
    app = await server();
    await clearDB();

    adminUser = await createTestUser({ role: UserRole.Admin });
    standardUser = await createTestUser();
    parkingSpot1 = await createTestParkingSpot();
    parkingSpot2 = await createTestParkingSpot();
  });

  afterAll(async () => {
    await stopServer(app);
  });

  describe('/GET bookings', () => {
    describe('when no bookings', () => {
      it('returns empty list of bookings', async () => {
        const response = await request(app)
          .get('/bookings')
          .set({ Authorization: adminUser.token });

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(0);
      });
    });

    describe('when there are bookings of different users', () => {
      const bookings: Booking[] = [];

      beforeAll(async () => {
        bookings.push(
          await createTestBooking({
            user: adminUser,
            parkingSpot: parkingSpot1,
          }),
        );
        bookings.push(
          await createTestBooking({
            user: standardUser,
            parkingSpot: parkingSpot1,
          }),
        );
        bookings.push(
          await createTestBooking({
            user: standardUser,
            parkingSpot: parkingSpot2,
          }),
        );
      });

      afterAll(async () => {
        await bookingRepository().remove(bookings);
      });

      it('returns list of all bookings', async () => {
        const response = await request(app)
          .get('/bookings')
          .set({ Authorization: adminUser.token });

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(bookings.length);
      });
    });
  });

  describe('/POST bookings', () => {
    it('creates booking for self', async () => {
      const paload = {
        parkingSpotId: parkingSpot2.id,
        startDate: formatISO(new Date()),
        endDate: formatISO(addDays(new Date(), 1)),
      };

      const response = await request(app)
        .post('/bookings')
        .send(paload)
        .set({ Authorization: adminUser.token });

      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toEqual(adminUser.id);
      expect(response.body.parkingSpotId).toEqual(parkingSpot2.id);
    });

    it('creates booking for other user', async () => {
      const paload = {
        userId: standardUser.id,
        parkingSpotId: parkingSpot2.id,
        startDate: formatISO(new Date()),
        endDate: formatISO(addDays(new Date(), 1)),
      };

      const response = await request(app)
        .post('/bookings')
        .send(paload)
        .set({ Authorization: adminUser.token });

      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toEqual(standardUser.id);
      expect(response.body.parkingSpotId).toEqual(parkingSpot2.id);
    });
  });
});
