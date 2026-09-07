import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env";
import { connectDB } from "../config/db";
import { User } from "../models/User";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "General Medicine",
];

const HOSPITALS = [
  "City General Hospital",
  "St. Mary's Medical Center",
  "Green Valley Clinic",
  "Sunrise Health Institute",
  "Metro Care Hospital",
];

const CONDITIONS = [
  "Hypertension",
  "Diabetes Type 2",
  "Asthma",
  "Migraine",
  "Arthritis",
  "Eczema",
  "Anxiety Disorder",
  "Common Cold",
  "Back Pain",
  "Allergic Rhinitis",
];

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Daniel", "Nancy", "Matthew", "Lisa",
  "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithinDays(daysAgo: number): Date {
  const now = Date.now();
  const past = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

function randomPhone(): string {
  const rest = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
  return `+1${rest}`;
}

async function seed() {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Patient.deleteMany({}),
  ]);

  console.log("Creating admin user...");
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  await User.create({ email: env.ADMIN_EMAIL, passwordHash });

  console.log("Creating doctors...");
  const usedDoctorEmails = new Set<string>();
  const doctorDocs = Array.from({ length: 12 }, (_, i) => {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    let email = `dr.${first}.${last}.${i}@doctortracker.dev`.toLowerCase();
    while (usedDoctorEmails.has(email)) {
      email = `dr.${first}.${last}.${i}.${Math.floor(Math.random() * 1000)}@doctortracker.dev`.toLowerCase();
    }
    usedDoctorEmails.add(email);

    const createdAt = randomDateWithinDays(180);
    return {
      name: `Dr. ${first} ${last}`,
      specialization: pick(SPECIALIZATIONS),
      hospital: pick(HOSPITALS),
      phone: randomPhone(),
      email,
      createdAt,
      updatedAt: createdAt,
    };
  });
  const doctors = await Doctor.insertMany(doctorDocs);

  console.log("Creating patients...");
  const patientDocs = Array.from({ length: 80 }, (_, i) => {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const doctor = pick(doctors);
    // Bias toward recent activity so the last-30-days dashboard trend has real data,
    // while still covering the full range for date-filter testing.
    const createdAt = i % 2 === 0 ? randomDateWithinDays(30) : randomDateWithinDays(90);

    return {
      name: `${first} ${last}`,
      age: 1 + Math.floor(Math.random() * 89),
      condition: pick(CONDITIONS),
      phone: randomPhone(),
      doctorId: doctor._id,
      createdAt,
      updatedAt: createdAt,
    };
  });
  await Patient.insertMany(patientDocs);

  console.log(`Seeded: 1 admin user, ${doctors.length} doctors, ${patientDocs.length} patients.`);
}

seed()
  .then(() => mongoose.disconnect())
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
