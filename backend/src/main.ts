import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    // origin: true refleja el origen del request → permite cualquier origen.
    // Seguro porque la auth usa Bearer tokens (no cookies), por lo que CSRF no aplica.
    // Los webhooks de terceros (Mercado Pago, etc.) necesitan acceso sin restricción de origen.
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
