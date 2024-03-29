import { Server } from 'http';
import { DataSourceOptions } from 'typeorm';
import { promisify } from 'util';
import app from '../../src/app';
import { appDataSource } from '../../src/dataSource';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_SERVER || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  username: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'test',
  database: process.env.TEST_DB_NAME || 'test',
  synchronize: true,
  logging: false,
};

export const server = async (): Promise<Server> => {
  await appDataSource(dataSourceOptions)
    .initialize()
    .catch((e) => {
      console.error('Error initializing test Data Source', e);
    });

  return app.listen(2222);
};

export const stopServer = async (server: Server): Promise<void> => {
  await appDataSource().destroy();
  await promisify(server.close).bind(server)();
};
