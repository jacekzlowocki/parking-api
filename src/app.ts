import express, { Application } from 'express';
import { readFileSync } from 'fs';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/errorHandler';
import { RegisterRoutes } from './routes/routes';

const app: Application = express();

app.use(morgan('tiny'));
app.use(express.static('public'));
app.use(express.json());
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(
    JSON.parse(readFileSync(__dirname + '/../public/swagger.json', 'utf8')),
  ),
);

RegisterRoutes(app);

app.use(errorHandler);

export default app;
