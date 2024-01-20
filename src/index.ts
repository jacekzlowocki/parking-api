import fs from 'fs';
import { DataSourceOptions } from 'typeorm';
import app from './app';
import { appDataSource } from './dataSource';

const PORT = process.env.PORT ?? 8000;

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER,
  password: fs.readFileSync(process.env.DB_PASSWORD_FILE ?? '', 'utf8').trim(),
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
};

appDataSource(dataSourceOptions)
  .initialize()
  .then(() => {
    console.log('Data Source initialized');
  })
  .catch((error) => {
    console.error('Error initializing Data Source', error);
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
