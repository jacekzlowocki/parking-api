import { Repository } from 'typeorm';
import { appDataSource } from '../dataSource';
import { ParkingSpot } from '../entities/ParkingSpot';

export const parkingSpotRepository = (): Repository<ParkingSpot> =>
  appDataSource().getRepository(ParkingSpot);

export const getParkingSpot = (id: number): Promise<ParkingSpot | null> => {
  return parkingSpotRepository().findOneBy({ id });
};

export const createParkingSpot = async (
  data: Partial<ParkingSpot>,
): Promise<ParkingSpot> => {
  const parkingSpot = parkingSpotRepository().create(data);
  await parkingSpotRepository().save(parkingSpot);

  return parkingSpot;
};
