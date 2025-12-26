import 'reflect-metadata';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Health E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
    app.enableCors({ origin, credentials: true });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health -> { status: "ok" }', async () => {
    const server = app.getHttpServer();
    const res = await request(server).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
