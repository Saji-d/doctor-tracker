import request from "supertest";
import app from "../src/app";
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
    .send({ name: "Patient Z", age: 40, condition: "Migraine" });
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

  it("updates a patient (partial update leaves other fields untouched)", async () => {
    const { patient } = await createDoctorAndPatient();

    const res = await agent.patch(`/api/patients/${patient._id}`).send({ condition: "Chronic Migraine" });
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
    const res = await agent.patch("/api/patients/000000000000000000000000").send({ condition: "X" });
    expect(res.status).toBe(404);
  });

  it("reassigns a patient to a different doctor", async () => {
    const { patient } = await createDoctorAndPatient();
    const newDoctor = await createDoctor(agent, { name: "Dr. New", specialization: "Neurology" });

    const res = await agent.patch(`/api/patients/${patient._id}`).send({ doctorId: newDoctor._id });
    expect(res.status).toBe(200);
    expect(res.body.doctorId).toBe(newDoctor._id);
  });

  it("404s reassigning to a nonexistent doctor", async () => {
    const { patient } = await createDoctorAndPatient();
    const res = await agent.patch(`/api/patients/${patient._id}`).send({ doctorId: "000000000000000000000000" });
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
