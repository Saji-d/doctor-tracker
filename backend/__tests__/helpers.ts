import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app";
import { User } from "../src/models/User";
import { Doctor } from "../src/models/Doctor";
import { Patient } from "../src/models/Patient";

export const TEST_EMAIL = "admin@test.dev";
export const TEST_PASSWORD = "correct-password";

const DOCTOR_DEFAULTS = {
  specialization: "Cardiology",
  hospital: "Test Hospital",
  phone: "+15551234567",
};

// Creates the seeded user and returns a supertest agent that's already
// logged in (supertest's agent persists the httpOnly cookie across requests
// automatically, same as a browser).
export async function authedAgent() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  await User.create({ email: TEST_EMAIL, passwordHash });

  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email: TEST_EMAIL, password: TEST_PASSWORD });
  return agent;
}

// Clears domain data only (not `users`) — used by test files that log in
// once in beforeAll and reuse the same agent across tests, so wiping users
// isn't needed and doesn't risk anything re-hitting the login rate limiter.
export async function clearData() {
  await Promise.all([Doctor.deleteMany({}), Patient.deleteMany({})]);
}

export async function createDoctor(agent: ReturnType<typeof request.agent>, overrides: Partial<Record<string, string>> = {}) {
  const email = overrides.email ?? `dr.${Math.random().toString(36).slice(2)}@test.dev`;
  const res = await agent.post("/api/doctors").send({
    name: "Dr. Test",
    ...DOCTOR_DEFAULTS,
    ...overrides,
    email,
  });
  return res.body;
}
