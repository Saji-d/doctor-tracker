import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app";
import { User } from "../src/models/User";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./db";
import { TEST_EMAIL, TEST_PASSWORD } from "./helpers";

beforeAll(async () => {
  await connectTestDB();
});
afterEach(async () => {
  await clearTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

async function seedUser() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  await User.create({ email: TEST_EMAIL, passwordHash });
}

describe("Auth", () => {
  it("logs in with correct credentials and sets a cookie", async () => {
    await seedUser();
    const res = await request(app).post("/api/auth/login").send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects a wrong password with a generic message", async () => {
    await seedUser();
    const res = await request(app).post("/api/auth/login").send({ email: TEST_EMAIL, password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("rejects a nonexistent email with the same generic message (no user enumeration)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nobody@test.dev", password: "x" });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("400s on a missing field", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: TEST_EMAIL });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("/me returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("/me returns the user with a valid session, and logout invalidates it", async () => {
    await seedUser();
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(TEST_EMAIL);

    await agent.post("/api/auth/logout");
    const meAfterLogout = await agent.get("/api/auth/me");
    expect(meAfterLogout.status).toBe(401);
  });
});
