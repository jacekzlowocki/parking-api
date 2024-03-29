import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Booking } from './entities/Booking';
import { ParkingSpot } from './entities/ParkingSpot';
import { User } from './entities/User';

let dataSource: DataSource;

export const appDataSource = (options?: DataSourceOptions): DataSource => {
  if (dataSource && options) {
    throw new Error('Data Source is already initialized!');
  }

  if (!dataSource && options) {
    dataSource = new DataSource({
      entities: [User, ParkingSpot, Booking],
      migrations: [],
      subscribers: [],
      ...options,
    });
  }

  if (!dataSource) {
    throw new Error('You need to provide options to create a Data Source!');
  }

  return dataSource;
};
