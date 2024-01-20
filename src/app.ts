import express, { Application } from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../public/swagger.json';
import router from './router';

const app: Application = express();

app.use(morgan('tiny'));
app.use(express.static('public'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(router);

export default app;
