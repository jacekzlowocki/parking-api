export type BookingPayload = {
  id?: number;
  userId?: number;
  parkingSpotId: number;
  startDate: string;
  endDate: string;
};
