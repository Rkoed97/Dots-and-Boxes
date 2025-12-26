import 'reflect-metadata';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module.js';

function unique(str: string) {
  return `${str}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

async function register(server: any, email: string, username: string, password: string) {
  const res = await request(server).post('/api/auth/register').send({ email, username, password });
  expect([200, 201]).toContain(res.status);
  return res.body;
}

async function login(server: any, email: string, password: string) {
  const res = await request(server).post('/api/auth/login').send({ email, password }).expect(201);
  const setCookie = res.headers['set-cookie'];
  expect(Array.isArray(setCookie)).toBe(true);
  const sidCookie = (setCookie as string[]).find((c) => c.startsWith('sid='));
  expect(sidCookie).toBeTruthy();
  return sidCookie as string;
}

describe('Users E2E', () => {
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

  it('GET /api/users/me requires auth (401 without cookie)', async () => {
    const server = app.getHttpServer();
    await request(server).get('/api/users/me').expect(401);
  });

  it('username update success and conflict, settings round-trip', async () => {
    const server = app.getHttpServer();
    const password = 'StrongPassw0rd!';

    // Create first user (A)
    const emailA = unique('a') + '@example.com';
    const usernameA = unique('userA');
    await register(server, emailA, usernameA, password);
    const cookieA = await login(server, emailA, password);

    // Check /me and update username
    const meA1 = await request(server).get('/api/users/me').set('Cookie', cookieA).expect(200);
    expect(meA1.body.email).toBe(emailA);

    const newUsernameA = unique('newUserA');
    const updA = await request(server)
      .patch('/api/users/me')
      .set('Cookie', cookieA)
      .send({ username: newUsernameA })
      .expect(200);
    expect(updA.body.username).toBe(newUsernameA);

    // Create second user (B)
    const emailB = unique('b') + '@example.com';
    const usernameB = unique('userB');
    await register(server, emailB, usernameB, password);
    const cookieB = await login(server, emailB, password);

    // Attempt to set B's username to A's new username -> conflict 409
    await request(server)
      .patch('/api/users/me')
      .set('Cookie', cookieB)
      .send({ username: newUsernameA })
      .expect(409);

    // Settings round-trip for A
    const theme = { mode: 'dark' as const, accent: '#ff00aa', boardStyle: 'minimal' as const };
    const putS = await request(server)
      .put('/api/users/me/settings')
      .set('Cookie', cookieA)
      .send(theme)
      .expect(200);
    expect(putS.body).toEqual(theme);

    const getS = await request(server).get('/api/users/me/settings').set('Cookie', cookieA).expect(200);
    expect(getS.body).toEqual(theme);
  });
});
