import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix('v1', { exclude: ['health'] });

  const config = new DocumentBuilder()
    .setTitle('EcoRide EV Mobility API')
    .setDescription('Authoritative OpenAPI 3.0 specification for EcoRide original EV-only mobility platform in Andhra Pradesh')
    .setVersion('1.0.0')
    .addTag('Health', 'Platform health check and synthetic dependency probes')
    .addTag('Release Boundaries', 'Gated release scopes, feature flags, and pilot zone permissions')
    .addTag('Journeys', 'User state machine flows and role-based transitions')
    .addTag('Design System', 'Original EV-only design tokens and bilingual UI parity')
    .addTag('Test Matrix', 'Traceability matrix and release blocker governance')
    .addTag('Quotes', 'Electric ride quoting with geofencing and integer paise calculation')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = path.resolve(process.cwd(), '../../docs/openapi.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');
  console.log(`OpenAPI specification successfully exported to: ${outputPath}`);

  await app.close();
  process.exit(0);
}

exportOpenApi().catch((err) => {
  console.error('Failed to export OpenAPI document:', err);
  process.exit(1);
});

