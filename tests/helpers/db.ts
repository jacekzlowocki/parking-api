import { appDataSource } from '../../src/dataSource';

export const clearDB = async (): Promise<void> => {
  await appDataSource().query('DELETE FROM "booking"');
  await appDataSource().query('DELETE FROM "parking_spot"');
  await appDataSource().query('DELETE FROM "user"');
};
