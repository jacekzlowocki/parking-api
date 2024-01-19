import express, { Application } from 'express';
import morgan from 'morgan';

const PORT = process.env.PORT ?? 8000;

const app: Application = express();

app.use(morgan('tiny'));

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
