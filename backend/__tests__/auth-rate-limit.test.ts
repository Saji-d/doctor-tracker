import request from "supertest";
import app from "../src/app";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./db";

// Isolated in its own file: express-rate-limit's default in-memory store is
// keyed by IP and lives for the app instance's lifetime, not per-test — if
// this shared the same file as auth.test.ts, earlier tests' login attempts
// would count toward this budget. Jest gives each test file its own module
// registry (a fresh `app` import), so a separate file gets a clean counter.
beforeAll(async () => {
  await connectTestDB();
});
afterEach(async () => {
  await clearTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

describe("Auth rate limiting", () => {
  it("blocks the 6th login attempt within the window", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post("/api/auth/login").send({ email: "x@x.com", password: "wrong" });
      expect(res.status).toBe(401);
    }
    const sixth = await request(app).post("/api/auth/login").send({ email: "x@x.com", password: "wrong" });
    expect(sixth.status).toBe(429);
    expect(sixth.body.error.code).toBe("RATE_LIMITED");
  });
});
