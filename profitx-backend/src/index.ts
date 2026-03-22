import cors from 'cors';
import express from 'express';
import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import { authRouter } from './routes/auth';
import { financeRouter } from './routes/finance';
import { healthRouter } from './routes/health';
import { savingRouter } from './routes/saving';
import { settingsRouter } from './routes/settings';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    service: 'profitx-backend',
    message: 'Backend is running',
    docs: '/api/health',
  });
});

app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', settingsRouter);
app.use('/api', financeRouter);
app.use('/api', savingRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`ProfitX backend listening on http://localhost:${config.port}`);
});
