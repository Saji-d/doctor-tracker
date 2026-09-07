import request from "supertest";
import app from "../src/app";
import { Patient } from "../src/models/Patient";
import { connectTestDB, disconnectTestDB } from "./db";
import { authedAgent, createDoctor, clearData } from "./helpers";

// One login for the whole file — see doctors.test.ts for why.
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

describe("Dashboard API", () => {
  it("401s without auth", async () => {
    const res = await request(app).get("/api/dashboard/summary");
    expect(res.status).toBe(401);
  });

  it("keeps totals and patientsPerDoctor stable across different ranges — regression test for the range-leaking-into-totals bug", async () => {
    const doctor = await createDoctor(agent);

    // One patient created "now" — falls inside every range.
    await agent.post(`/api/doctors/${doctor._id}/patients`).send({ name: "Recent", age: 20, condition: "Asthma" });

    // One patient backdated 60 days — falls outside a 7-day range but must
    // still count toward totals and patientsPerDoctor, which are supposed
    // to be all-time regardless of the `range` query param.
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    await Patient.create({
      name: "Old",
      age: 50,
      condition: "Migraine",
      doctorId: doctor._id,
      createdAt: oldDate,
      updatedAt: oldDate,
    });

    const wide = await agent.get("/api/dashboard/summary?range=90d");
    const narrow = await agent.get("/api/dashboard/summary?range=7d");

    expect(wide.body.totalPatients).toBe(2);
    expect(narrow.body.totalPatients).toBe(2); // must NOT shrink with a narrower range
    expect(wide.body.totalDoctors).toBe(1);
    expect(narrow.body.totalDoctors).toBe(1);
    expect(wide.body.patientsPerDoctor[0].count).toBe(2);
    expect(narrow.body.patientsPerDoctor[0].count).toBe(2); // must NOT shrink either

    // dateTrend, by contrast, SHOULD differ between ranges — that's the one
    // field `range` is meant to scope.
    const sum = (entries: { count: number }[]) => entries.reduce((s, e) => s + e.count, 0);
    expect(sum(wide.body.dateTrend)).toBe(2);
    expect(sum(narrow.body.dateTrend)).toBe(1);
  });

  it("orders patientsPerDoctor descending by count and includes doctor names", async () => {
    const docA = await createDoctor(agent, { name: "Dr. A" });
    const docB = await createDoctor(agent, { name: "Dr. B" });

    await agent.post(`/api/doctors/${docA._id}/patients`).send({ name: "P1", age: 20, condition: "Asthma" });
    await agent.post(`/api/doctors/${docB._id}/patients`).send({ name: "P2", age: 20, condition: "Asthma" });
    await agent.post(`/api/doctors/${docB._id}/patients`).send({ name: "P3", age: 20, condition: "Asthma" });

    const res = await agent.get("/api/dashboard/summary");
    expect(res.body.patientsPerDoctor[0]).toMatchObject({ name: "Dr. B", count: 2 });
    expect(res.body.patientsPerDoctor[1]).toMatchObject({ name: "Dr. A", count: 1 });
  });

  it("400s on a malformed range", async () => {
    const res = await agent.get("/api/dashboard/summary?range=abc");
    expect(res.status).toBe(400);
  });
});
