import { addDays, addHours } from 'date-fns';
import { Server } from 'http';
import request from 'supertest';
import { Booking } from '../../../../src/entities/Booking';
import { ParkingSpot } from '../../../../src/entities/ParkingSpot';
import { User } from '../../../../src/entities/User';
import { uformatISO } from '../../../../src/helpers/uformatISO';
import { bookingRepository } from '../../../../src/repositories/bookings';
import { parkingSpotRepository } from '../../../../src/repositories/parkingSpots';
import { clearDB } from '../../../helpers/db';
import {
  createTestBooking,
  createTestParkingSpot,
  createTestUser,
} from '../../../helpers/entities';
import { server, stopServer } from '../../server';

describe('as standard user', () => {
  let app: Server;
  let user1: User;
  let user2: User;
  let parkingSpot1: ParkingSpot;
  let parkingSpot2: ParkingSpot;

  beforeAll(async () => {
    app = await server();
    await clearDB();

    user1 = await createTestUser();
    user2 = await createTestUser();
    parkingSpot1 = await createTestParkingSpot();
    parkingSpot2 = await createTestParkingSpot();
  });

  afterAll(async () => {
    await stopServer(app);
  });

  describe('GET /bookings', () => {
    describe('when no bookings', () => {
      it('returns empty list of bookings', async () => {
        const response = await request(app)
          .get('/bookings')
          .set({ Authorization: user1.token });

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(0);
      });
    });

    describe('when there are bookings of different users', () => {
      const bookings: Booking[] = [];

      beforeAll(async () => {
        bookings.push(
          await createTestBooking({
            userId: user1.id,
            parkingSpotId: parkingSpot1.id,
          }),
          await createTestBooking({
            userId: user2.id,
            parkingSpotId: parkingSpot1.id,
          }),
          await createTestBooking({
            userId: user2.id,
            parkingSpotId: parkingSpot2.id,
          }),
        );
      });

      afterAll(async () => {
        await bookingRepository().remove(bookings);
      });

      it("returns list of user's bookings", async () => {
        const response = await request(app)
          .get('/bookings')
          .set({ Authorization: user1.token });

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].userId).toBe(user1.id);
      });

      it('returns own booking by id', async () => {
        const booking = bookings[0]; // own booking

        const response = await request(app)
          .get(`/bookings/${booking.id}`)
          .set({ Authorization: user1.token });

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
          id: booking.id,
          userId: booking.userId,
          parkingSpotId: booking.parkingSpotId,
        });
      });

      it("returns 404 for other user's booking", async () => {
        const booking = bookings[1]; // other's booking

        const response = await request(app)
          .get(`/bookings/${booking.id}`)
          .set({ Authorization: user1.token });

        expect(response.statusCode).toBe(404);
      });
    });
  });

  describe('POST /bookings', () => {
    it('creates booking for self', async () => {
      const paload = {
        parkingSpotId: parkingSpot2.id,
        startDate: uformatISO(new Date()),
        endDate: uformatISO(addDays(new Date(), 1)),
      };

      const response = await request(app)
        .post('/bookings')
        .send(paload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toEqual(user1.id);
      expect(response.body.parkingSpotId).toEqual(parkingSpot2.id);
    });

    it('fails to create booking for other user', async () => {
      const paload = {
        userId: user2.id, // not the same user as makes the request
        parkingSpotId: parkingSpot2.id,
        startDate: uformatISO(new Date()),
        endDate: uformatISO(addDays(new Date(), 1)),
      };

      const response = await request(app)
        .post('/bookings')
        .send(paload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(422);
    });

    describe('for non-existing parkingSpot', () => {
      let removedParkingSpot: ParkingSpot;

      beforeAll(async () => {
        removedParkingSpot = await createTestParkingSpot({ name: 'removed-1' });
        await parkingSpotRepository().softRemove(removedParkingSpot);
      });

      it('fails to create booking', async () => {
        const paload = {
          userId: user1.id,
          parkingSpotId: removedParkingSpot.id,
          startDate: uformatISO(new Date()),
          endDate: uformatISO(addDays(new Date(), 1)),
        };

        const response = await request(app)
          .post('/bookings')
          .send(paload)
          .set({ Authorization: user1.token });

        expect(response.statusCode).toBe(422);
      });
    });
  });

  describe('PUT /bookings/{id}', () => {
    const bookings: Booking[] = [];

    beforeAll(async () => {
      bookings.push(
        await createTestBooking({
          userId: user1.id,
          parkingSpotId: parkingSpot1.id,
        }),
        await createTestBooking({
          userId: user2.id,
          parkingSpotId: parkingSpot1.id,
        }),
      );
    });

    afterAll(async () => {
      await bookingRepository().remove(bookings);
    });

    it('updates own booking', async () => {
      const booking = bookings[0]; // own booking
      const startDate = uformatISO(addHours(booking.startDate, 2));

      const payload = {
        parkingSpotId: parkingSpot2.id,
        startDate: startDate,
      };

      const response = await request(app)
        .put(`/bookings/${booking.id}`)
        .send(payload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toEqual(user1.id);
      expect(response.body.parkingSpotId).toEqual(parkingSpot2.id);
      expect(response.body.startDate).toEqual(startDate);
    });

    it('fails changing own booking userId', async () => {
      const booking = bookings[0]; // own booking

      const payload = {
        userId: user2.id, // try to ssign to different user
      };

      const response = await request(app)
        .put(`/bookings/${booking.id}`)
        .send(payload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(422);
    });

    it("fails updating other's booking", async () => {
      const booking = bookings[1]; // other's booking

      const payload = {
        parkingSpotId: parkingSpot2.id, // change parking spot
      };

      const response = await request(app)
        .put(`/bookings/${booking.id}`)
        .send(payload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(404);
    });
  });
});
