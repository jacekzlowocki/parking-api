import express, { Application } from 'express';

const PORT = process.env.PORT || 8000;

const app: Application = express();

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
