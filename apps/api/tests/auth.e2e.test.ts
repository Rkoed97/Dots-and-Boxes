import 'reflect-metadata';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module.js';

function uniqueEmail() {
  return `user_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
}

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    const origin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
    app.enableCors({ origin, credentials: true });
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register -> login -> me -> logout flow', async () => {
    const server = app.getHttpServer();
    const email = uniqueEmail();
    const username = `u_${Math.floor(Math.random() * 1e6)}`;
    const password = 'TestPassword123!';

    // register
    const reg = await request(server)
      .post('/api/auth/register')
      .send({ email, username, password })
      .expect(201);
    expect(reg.body.email).toBe(email);
    expect(reg.body.username).toBe(username);

    // login
    const login = await request(server)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);
    const setCookie = login.headers['set-cookie'];
    expect(Array.isArray(setCookie)).toBe(true);
    const sidCookie = (setCookie as string[]).find((c) => c.startsWith('sid='));
    expect(sidCookie).toBeTruthy();

    // me
    const me = await request(server).get('/api/auth/me').set('Cookie', sidCookie as string).expect(200);
    expect(me.body.email).toBe(email);

    // logout
    await request(server).post('/api/auth/logout').set('Cookie', sidCookie as string).expect(201);

    // me fails after logout
    await request(server).get('/api/auth/me').set('Cookie', sidCookie as string).expect(401);
  });
});
