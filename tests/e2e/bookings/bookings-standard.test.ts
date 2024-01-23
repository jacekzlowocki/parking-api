import { addDays, addHours, addMinutes, subMinutes } from 'date-fns';
import { Server } from 'http';
import request from 'supertest';
import { Booking } from '../../../src/entities/Booking';
import { ParkingSpot } from '../../../src/entities/ParkingSpot';
import { User } from '../../../src/entities/User';
import { formatISO } from '../../../src/helpers/formatISO';
import {
  bookingRepository,
  getBooking,
} from '../../../src/repositories/bookings';
import { parkingSpotRepository } from '../../../src/repositories/parkingSpots';
import { clearDB } from '../../helpers/db';
import {
  createTestBooking,
  createTestParkingSpot,
  createTestUser,
} from '../../helpers/entities';
import { server, stopServer } from '../server';

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
        expect(response.body.meta.total).toBe(0);
        expect(response.body.meta.page).toBe(0);
        expect(response.body.meta.pageSize).toBe(10);
        expect(response.body.data.length).toBe(0);
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
        expect(response.body.meta.total).toBe(1);
        expect(response.body.meta.page).toBe(0);
        expect(response.body.meta.pageSize).toBe(10);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].userId).toBe(user1.id);
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
    let existingBooking: Booking;

    beforeAll(async () => {
      existingBooking = await createTestBooking({
        userId: user2.id,
        parkingSpotId: parkingSpot2.id,
        startDate: addMinutes(new Date(), 1),
        endDate: addMinutes(new Date(), 60),
      });
    });

    afterAll(async () => {
      bookingRepository().remove(existingBooking);
    });

    it('creates booking for self', async () => {
      const payload = {
        parkingSpotId: parkingSpot1.id,
        startDate: formatISO(addMinutes(new Date(), 1)),
        endDate: formatISO(addDays(new Date(), 1)),
      };

      const response = await request(app)
        .post('/bookings')
        .send(payload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toEqual(user1.id);
      expect(response.body.parkingSpotId).toEqual(parkingSpot1.id);
    });

    it('fails to create booking for already booked parking spot', async () => {
      const payload = {
        parkingSpotId: parkingSpot2.id, // <- matches with `existingBooking`
        startDate: formatISO(addMinutes(new Date(), 10)), // <- overlaps with `existingBooking`
        endDate: formatISO(addDays(new Date(), 1)),
      };

      const response = await request(app)
        .post('/bookings')
        .send(payload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('fails to create booking for other user', async () => {
      const payload = {
        userId: user2.id, // not the same user as makes the request
        parkingSpotId: parkingSpot2.id,
        startDate: formatISO(new Date()),
        endDate: formatISO(addDays(new Date(), 1)),
      };

      const response = await request(app)
        .post('/bookings')
        .send(payload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(422);
      expect(response.body).toHaveProperty('error');
    });

    describe('for non-existing parkingSpot', () => {
      let removedParkingSpot: ParkingSpot;

      beforeAll(async () => {
        removedParkingSpot = await createTestParkingSpot({ name: 'removed-1' });
        await parkingSpotRepository().softRemove(removedParkingSpot);
      });

      it('fails to create booking', async () => {
        const payload = {
          userId: user1.id,
          parkingSpotId: removedParkingSpot.id,
          startDate: formatISO(new Date()),
          endDate: formatISO(addDays(new Date(), 1)),
        };

        const response = await request(app)
          .post('/bookings')
          .send(payload)
          .set({ Authorization: user1.token });

        expect(response.statusCode).toBe(422);
        expect(response.body).toHaveProperty('error');
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
          parkingSpotId: parkingSpot2.id,
          startDate: addMinutes(new Date(), 1),
          endDate: addMinutes(new Date(), 60),
        }),
      );
    });

    afterAll(async () => {
      await bookingRepository().remove(bookings);
    });

    it('updates own booking', async () => {
      const booking = bookings[0]; // own booking
      const startDate = formatISO(addHours(booking.startDate, 2));

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

    it('fails updating when conflicts with existing', async () => {
      const booking = bookings[0];

      const payload = {
        parkingSpotId: parkingSpot2.id, // <- changing to parkingSpot2
        startDate: formatISO(addMinutes(new Date(), 10)), // <- which alread has booking here
        endDate: formatISO(addDays(new Date(), 1)),
      };

      const response = await request(app)
        .put(`/bookings/${booking.id}`)
        .send(payload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('fails updating startDate to past', async () => {
      const booking = bookings[0];

      const payload = {
        startDate: subMinutes(new Date(), 10),
      };

      const response = await request(app)
        .put(`/bookings/${booking.id}`)
        .send(payload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(422);
      expect(response.body).toHaveProperty('error');
    });

    it('fails updating startDate to after endDate', async () => {
      const booking = bookings[0];

      const payload = {
        startDate: addHours(booking.endDate, 1),
      };

      const response = await request(app)
        .put(`/bookings/${booking.id}`)
        .send(payload)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(422);
      expect(response.body).toHaveProperty('error');
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
      expect(response.body).toHaveProperty('error');
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

  describe('DELETE /bookings', () => {
    const bookings: Booking[] = [];
    let removedBooking: Booking;

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

      removedBooking = await createTestBooking({
        userId: user1.id,
        parkingSpotId: parkingSpot1.id,
      });
      await bookingRepository().softRemove(removedBooking);
    });

    afterAll(async () => {
      await bookingRepository().remove(bookings);
    });

    it('deletes own booking', async () => {
      const booking = bookings[0]; // own booking

      const response = await request(app)
        .delete(`/bookings/${booking.id}`)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(204);
      expect(await getBooking(booking.id)).toBe(null);
    });

    it("deletes other's booking", async () => {
      const booking = bookings[1]; // other's booking

      const response = await request(app)
        .delete(`/bookings/${booking.id}`)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(404);
    });

    it('fails to delete non-existing booking', async () => {
      const response = await request(app)
        .delete(`/bookings/${removedBooking.id}`)
        .set({ Authorization: user1.token });

      expect(response.statusCode).toBe(404);
    });
  });
});
