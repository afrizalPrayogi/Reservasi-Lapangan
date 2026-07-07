import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { getLocalIp } from './common/network.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new LoggerService(),
  });

  // Enable CORS - konfigurasi untuk shared hosting (Harus diletakkan di atas agar static assets juga mendapat header CORS)
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Set global prefix dulu sebelum static assets
  app.setGlobalPrefix('api/v1');

  // Serve static files untuk uploads - gunakan process.cwd() agar path selalu dari root project
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable validation pipe untuk DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );


  const port = parseInt(process.env.PORT || '4000');
  const host = process.env.HOST || '0.0.0.0';
  
  await app.listen(port, host);

  // Log server info
  const logger = app.get(LoggerService);
  logger.logServerInfo(port);

  // Tampilkan IP jaringan agar user tahu URL untuk akses dari perangkat lain
  const localIp = getLocalIp();
  logger.log(``, 'Bootstrap');
  logger.log(`🌐 Akses dari perangkat ini : http://localhost:${port}`, 'Bootstrap');
  logger.log(`🌐 Akses dari jaringan lokal: http://${localIp}:${port}`, 'Bootstrap');
  logger.log(``, 'Bootstrap');
  logger.log(`📱 Untuk Flutter mobile .env, gunakan:`, 'Bootstrap');
  logger.log(`   BASE_URL=http://${localIp}:${port}`, 'Bootstrap');
  logger.log(``, 'Bootstrap');
}
bootstrap();

