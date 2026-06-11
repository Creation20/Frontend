import 'dotenv/config';
import Fastify from 'fastify';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

const start = async () => {
  try {
    await registerPlugins(app);
    await registerRoutes(app);

    const port = Number(process.env.PORT) || 3000;
    const host = '0.0.0.0';

    await app.listen({ port, host });
    app.log.info(`🚀 LexiAid API running at http://${host}:${port}`);
    app.log.info(`📚 Environment: ${process.env.NODE_ENV}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
