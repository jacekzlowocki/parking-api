import { addDays, addHours } from 'date-fns';
import { Server } from 'http';
import request from 'supertest';
import { Booking } from '../../../src/entities/Booking';
import { ParkingSpot } from '../../../src/entities/ParkingSpot';
import { User, UserRole } from '../../../src/entities/User';
import { formatISO } from '../../../src/helpers/formatISO';
import {
  bookingRepository,
  getBooking,
} from '../../../src/repositories/bookings';
import { parkingSpotRepository } from '../../../src/repositories/parkingSpots';
import { userRepository } from '../../../src/repositories/users';
import { clearDB } from '../../helpers/db';
import {
  createTestBooking,
  createTestParkingSpot,
  createTestUser,
} from '../../helpers/entities';
import { server, stopServer } from '../server';

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

  describe('GET /bookings', () => {
    it('returns 401 Unauthorized without Authorization', async () => {
      const response = await request(app).get('/bookings');

      expect(response.statusCode).toBe(401);
    });

    describe('when no bookings', () => {
      it('returns empty list of bookings', async () => {
        const response = await request(app)
          .get('/bookings')
          .set({ Authorization: adminUser.token });

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
            userId: adminUser.id,
            parkingSpotId: parkingSpot1.id,
          }),
          await createTestBooking({
            userId: standardUser.id,
            parkingSpotId: parkingSpot1.id,
          }),
          await createTestBooking({
            userId: standardUser.id,
            parkingSpotId: parkingSpot2.id,
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
        expect(response.body.meta.total).toBe(bookings.length);
        expect(response.body.meta.page).toBe(0);
        expect(response.body.meta.pageSize).toBe(10);
        expect(response.body.data.length).toBe(bookings.length);
      });

      it('returns list of all bookings with custom pagination', async () => {
        const response = await request(app)
          .get('/bookings?page=1&pageSize=1')
          .set({ Authorization: adminUser.token });

        expect(response.statusCode).toBe(200);
        expect(response.body.meta.total).toBe(bookings.length);
        expect(response.body.meta.page).toBe(1); // starts with 0
        expect(response.body.meta.pageSize).toBe(1);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0]).toMatchObject({
          userId: standardUser.id,
          parkingSpotId: parkingSpot1.id,
        });
      });

      it('returns own booking by id', async () => {
        const booking = bookings[0]; // own booking

        const response = await request(app)
          .get(`/bookings/${booking.id}`)
          .set({ Authorization: adminUser.token });

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
          id: booking.id,
          userId: booking.userId,
          parkingSpotId: booking.parkingSpotId,
        });
      });

      it("returns other user's booking by id", async () => {
        const booking = bookings[1]; // other's booking

        const response = await request(app)
          .get(`/bookings/${booking.id}`)
          .set({ Authorization: adminUser.token });

        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
          id: booking.id,
          userId: booking.userId,
          parkingSpotId: booking.parkingSpotId,
        });
      });

      describe('for removed booking', () => {
        let removedBooking: Booking;

        beforeAll(async () => {
          removedBooking = await createTestBooking({
            userId: standardUser.id,
            parkingSpotId: parkingSpot1.id,
          });
          await bookingRepository().softRemove(removedBooking);
        });

        it('returns 404', async () => {
          const response = await request(app)
            .get(`/bookings/${removedBooking.id}`)
            .set({ Authorization: adminUser.token });

          expect(response.statusCode).toBe(404);
        });
      });
    });
  });

  describe('POST /bookings', () => {
    it('returns 401 Unauthorized without Authorization', async () => {
      const response = await request(app)
        .post('/bookings')
        .send({ test: 'anything' });

      expect(response.statusCode).toBe(401);
    });

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
      const payload = {
        userId: standardUser.id,
        parkingSpotId: parkingSpot2.id,
        startDate: formatISO(new Date()),
        endDate: formatISO(addDays(new Date(), 1)),
      };

      const response = await request(app)
        .post('/bookings')
        .send(payload)
        .set({ Authorization: adminUser.token });

      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toEqual(standardUser.id);
      expect(response.body.parkingSpotId).toEqual(parkingSpot2.id);
    });
  });

  describe('PUT /bookings/{id}', () => {
    const bookings: Booking[] = [];

    beforeAll(async () => {
      bookings.push(
        await createTestBooking({
          userId: adminUser.id,
          parkingSpotId: parkingSpot1.id,
        }),
        await createTestBooking({
          userId: standardUser.id,
          parkingSpotId: parkingSpot1.id,
        }),
      );
    });

    afterAll(async () => {
      await bookingRepository().remove(bookings);
    });

    it('returns 401 Unauthorized without Authorization', async () => {
      const response = await request(app).put(`/bookings/${bookings[0].id}`);

      expect(response.statusCode).toBe(401);
    });

    it('updates own booking', async () => {
      const booking = bookings[0]; // own booking
      const startDate = formatISO(addHours(booking.startDate, 2));

      const payload = {
        userId: standardUser.id, // assign to different user
        startDate: startDate, // change start data
      };

      const response = await request(app)
        .put(`/bookings/${booking.id}`)
        .send(payload)
        .set({ Authorization: adminUser.token });

      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toEqual(standardUser.id);
      expect(response.body.startDate).toEqual(startDate);
    });

    it("updates other's booking", async () => {
      const booking = bookings[1]; // other's booking

      const payload = {
        userId: adminUser.id, // assign to self
        parkingSpotId: parkingSpot2.id, // change parking spot
      };

      const response = await request(app)
        .put(`/bookings/${booking.id}`)
        .send(payload)
        .set({ Authorization: adminUser.token });

      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toEqual(adminUser.id);
      expect(response.body.parkingSpotId).toEqual(parkingSpot2.id);
    });

    describe('for removed entities', () => {
      let removedUser: User;
      let removedParkingSpot: ParkingSpot;

      beforeAll(async () => {
        removedUser = await createTestUser();
        removedParkingSpot = await createTestParkingSpot();

        await userRepository().softRemove(removedUser);
        await parkingSpotRepository().softRemove(removedParkingSpot);
      });

      it('fails updating to non-existing parkingSpot', async () => {
        const booking = bookings[0];

        const payload = {
          parkingSpotId: removedParkingSpot.id,
        };

        const response = await request(app)
          .put(`/bookings/${booking.id}`)
          .send(payload)
          .set({ Authorization: adminUser.token });

        expect(response.statusCode).toBe(422);
        expect(response.body).toHaveProperty('error');
      });

      it('fails updating to non-existing user', async () => {
        const booking = bookings[0];

        const payload = {
          userId: removedUser.id,
        };

        const response = await request(app)
          .put(`/bookings/${booking.id}`)
          .send(payload)
          .set({ Authorization: adminUser.token });

        expect(response.statusCode).toBe(422);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('DELETE /bookings', () => {
    const bookings: Booking[] = [];
    let removedBooking: Booking;

    beforeAll(async () => {
      bookings.push(
        await createTestBooking({
          userId: adminUser.id,
          parkingSpotId: parkingSpot1.id,
        }),
        await createTestBooking({
          userId: standardUser.id,
          parkingSpotId: parkingSpot1.id,
        }),
      );

      removedBooking = await createTestBooking({
        userId: adminUser.id,
        parkingSpotId: parkingSpot1.id,
      });
      await bookingRepository().softRemove(removedBooking);
    });

    afterAll(async () => {
      await bookingRepository().remove(bookings);
    });

    it('returns 401 Unauthorized without Authorization', async () => {
      const response = await request(app).delete(`/bookings/${bookings[0].id}`);

      expect(response.statusCode).toBe(401);
    });

    it('deletes own booking', async () => {
      const booking = bookings[0]; // own booking

      const response = await request(app)
        .delete(`/bookings/${booking.id}`)
        .set({ Authorization: adminUser.token });

      expect(response.statusCode).toBe(204);
      expect(await getBooking(booking.id)).toBe(null);
    });

    it("deletes other's booking", async () => {
      const booking = bookings[1]; // other's booking

      const response = await request(app)
        .delete(`/bookings/${booking.id}`)
        .set({ Authorization: adminUser.token });

      expect(response.statusCode).toBe(204);
      expect(await getBooking(booking.id)).toBe(null);
    });

    it('fails to delete non-existing booking', async () => {
      const response = await request(app)
        .delete(`/bookings/${removedBooking.id}`)
        .set({ Authorization: adminUser.token });

      expect(response.statusCode).toBe(404);
    });
  });
});
