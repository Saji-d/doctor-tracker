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

async function createDoctorAndPatient() {
  const doctor = await createDoctor(agent);
  const patientRes = await agent
    .post(`/api/doctors/${doctor._id}/patients`)
    .send({ name: "Patient Z", age: 40, condition: "Migraine", phone: "+15559876543" });
  return { doctorId: doctor._id, patient: patientRes.body };
}

describe("Patients API", () => {
  it("401s without auth", async () => {
    const res = await request(app).get("/api/patients");
    expect(res.status).toBe(401);
  });

  it("lists patients globally, filterable by condition", async () => {
    await createDoctorAndPatient();

    const res = await agent.get("/api/patients?condition=Migraine");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].condition).toBe("Migraine");
  });

  it("lists patients globally, filterable by search", async () => {
    await createDoctorAndPatient();

    const found = await agent.get("/api/patients?search=Patient Z");
    expect(found.body.data).toHaveLength(1);
    expect(found.body.data[0].name).toBe("Patient Z");

    const notFound = await agent.get("/api/patients?search=Nobody Here");
    expect(notFound.body.data).toHaveLength(0);
  });

  it("lists patients globally, filterable by doctorId", async () => {
    const { doctorId } = await createDoctorAndPatient();
    const otherDoctor = await createDoctor(agent, { name: "Dr. Other", specialization: "Neurology" });
    await agent.post(`/api/doctors/${otherDoctor._id}/patients`).send({ name: "Other Patient", age: 25, condition: "Asthma", phone: "+15559876543" });

    const res = await agent.get(`/api/patients?doctorId=${doctorId}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Patient Z");
  });

  it("paginates the global patient list", async () => {
    const doctor = await createDoctor(agent);
    for (let i = 0; i < 3; i++) {
      await agent.post(`/api/doctors/${doctor._id}/patients`).send({ name: `Patient ${i}`, age: 30, condition: "Asthma", phone: "+15559876543" });
    }

    const res = await agent.get("/api/patients?page=1&limit=2");
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  it("filters the global patient list by createdAt date range", async () => {
    const { doctorId, patient: recent } = await createDoctorAndPatient();
    // See the equivalent doctors.test.ts case for why this backdates via a
    // direct `.create()` rather than `.updateOne()` after the fact.
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const old = await Patient.create({
      name: "Old Patient",
      age: 60,
      condition: "Arthritis",
      phone: "+15559876543",
      doctorId,
      createdAt: oldDate,
      updatedAt: oldDate,
    });

    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const withinLastWeek = await agent.get(`/api/patients?dateFrom=${from}`);
    expect(withinLastWeek.body.data.map((p: { name: string }) => p.name)).toEqual([recent.name]);

    const to = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const beforeLastMonth = await agent.get(`/api/patients?dateTo=${to}`);
    expect(beforeLastMonth.body.data.map((p: { name: string }) => p.name)).toEqual([old.name]);
  });

  it("updates a patient (partial update leaves other fields untouched)", async () => {
    const { patient } = await createDoctorAndPatient();

    const res = await agent
      .patch(`/api/patients/${patient._id}`)
      .send({ condition: "Chronic Migraine", phone: "+15559876543" });
    expect(res.status).toBe(200);
    expect(res.body.condition).toBe("Chronic Migraine");
    expect(res.body.name).toBe("Patient Z");
    expect(res.body.age).toBe(40);
  });

  it("400s updating with an empty body", async () => {
    const { patient } = await createDoctorAndPatient();
    const res = await agent.patch(`/api/patients/${patient._id}`).send({});
    expect(res.status).toBe(400);
  });

  it("404s updating a nonexistent patient", async () => {
    const res = await agent
      .patch("/api/patients/000000000000000000000000")
      .send({ condition: "X", phone: "+15559876543" });
    expect(res.status).toBe(404);
  });

  it("reassigns a patient to a different doctor", async () => {
    const { patient } = await createDoctorAndPatient();
    const newDoctor = await createDoctor(agent, { name: "Dr. New", specialization: "Neurology" });

    const res = await agent
      .patch(`/api/patients/${patient._id}`)
      .send({ doctorId: newDoctor._id, phone: "+15559876543" });
    expect(res.status).toBe(200);
    expect(res.body.doctorId).toBe(newDoctor._id);
  });

  it("404s reassigning to a nonexistent doctor", async () => {
    const { patient } = await createDoctorAndPatient();
    const res = await agent
      .patch(`/api/patients/${patient._id}`)
      .send({ doctorId: "000000000000000000000000", phone: "+15559876543" });
    expect(res.status).toBe(404);
  });

  it("deletes a patient, then 404s deleting it again", async () => {
    const { patient } = await createDoctorAndPatient();

    const del = await agent.delete(`/api/patients/${patient._id}`);
    expect(del.status).toBe(204);

    const delAgain = await agent.delete(`/api/patients/${patient._id}`);
    expect(delAgain.status).toBe(404);
  });
});
