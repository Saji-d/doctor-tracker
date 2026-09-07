import request from "supertest";
import app from "../src/app";
import { Doctor } from "../src/models/Doctor";
import { connectTestDB, disconnectTestDB } from "./db";
import { authedAgent, createDoctor, clearData } from "./helpers";

// Logs in ONCE for the whole file and reuses the same session, rather than
// once per test — the login rate limiter (5/window) is scoped per test file
// (each file gets a fresh module registry), and this file has more than 5
// tests. Reusing one agent is also just less redundant setup.
let agent: Awaited<ReturnType<typeof authedAgent>>;

beforeAll(async () => {
  await connectTestDB();
  agent = await authedAgent();
});
afterEach(async () => {
  await clearData();
});
afterAll(async () => {
  await disconnectTestDB();
});

describe("Doctors API", () => {
  it("401s without auth", async () => {
    const res = await request(app).get("/api/doctors");
    expect(res.status).toBe(401);
  });

  it("creates a doctor", async () => {
    const res = await agent.post("/api/doctors").send({
      name: "Dr. Test",
      specialization: "Cardiology",
      hospital: "Test Hospital",
      phone: "+15551234567",
      email: "dr.test@test.dev",
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Dr. Test");
  });

  it("400s on a missing required field", async () => {
    const res = await agent.post("/api/doctors").send({ name: "Dr. Test" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("409s on a duplicate email", async () => {
    await createDoctor(agent, { email: "dup@test.dev" });
    const res = await agent.post("/api/doctors").send({
      name: "Dr. Other",
      specialization: "Cardiology",
      hospital: "Test Hospital",
      phone: "+15551234567",
      email: "dup@test.dev",
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("lists doctors with pagination", async () => {
    for (let i = 0; i < 3; i++) {
      await createDoctor(agent);
    }
    const res = await agent.get("/api/doctors?page=1&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  it("filters by specialization and by search", async () => {
    await createDoctor(agent, { name: "Dr. Cardio", specialization: "Cardiology" });
    await createDoctor(agent, { name: "Dr. Derma", specialization: "Dermatology" });

    const bySpec = await agent.get("/api/doctors?specialization=Cardiology");
    expect(bySpec.body.data).toHaveLength(1);
    expect(bySpec.body.data[0].name).toBe("Dr. Cardio");

    const bySearch = await agent.get("/api/doctors?search=Derma");
    expect(bySearch.body.data).toHaveLength(1);
    expect(bySearch.body.data[0].name).toBe("Dr. Derma");
  });

  it("filters by createdAt date range", async () => {
    const recent = await createDoctor(agent, { name: "Dr. Recent" });
    // Mongoose's `timestamps` option only honors a caller-supplied `createdAt`
    // at document-creation time — it's silently stripped from any later
    // `updateOne` (by design, to stop accidental overwrites), so backdating
    // for a test has to happen via a direct `.create()`, not create-then-update.
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const old = await Doctor.create({
      name: "Dr. Old",
      specialization: "Cardiology",
      hospital: "Test Hospital",
      phone: "+15551234567",
      email: "dr.old@test.dev",
      createdAt: oldDate,
      updatedAt: oldDate,
    });

    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const withinLastWeek = await agent.get(`/api/doctors?dateFrom=${from}`);
    expect(withinLastWeek.body.data.map((d: { name: string }) => d.name)).toEqual([recent.name]);

    const to = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const beforeLastMonth = await agent.get(`/api/doctors?dateTo=${to}`);
    expect(beforeLastMonth.body.data.map((d: { name: string }) => d.name)).toEqual([old.name]);
  });

  it("gets a doctor by id; 404s for a missing id; 400s for a malformed id", async () => {
    const doctor = await createDoctor(agent);

    const found = await agent.get(`/api/doctors/${doctor._id}`);
    expect(found.status).toBe(200);
    expect(found.body._id).toBe(doctor._id);

    const missing = await agent.get("/api/doctors/000000000000000000000000");
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe("NOT_FOUND");

    const malformed = await agent.get("/api/doctors/not-an-id");
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("creates and lists patients scoped to a doctor", async () => {
    const doctor = await createDoctor(agent);

    const created = await agent
      .post(`/api/doctors/${doctor._id}/patients`)
      .send({ name: "Patient A", age: 30, condition: "Asthma" });
    expect(created.status).toBe(201);
    expect(created.body.doctorId).toBe(doctor._id);

    const list = await agent.get(`/api/doctors/${doctor._id}/patients`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].name).toBe("Patient A");
  });

  it("404s creating a patient under a nonexistent doctor", async () => {
    const res = await agent
      .post("/api/doctors/000000000000000000000000/patients")
      .send({ name: "X", age: 30, condition: "Asthma" });
    expect(res.status).toBe(404);
  });
});
