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
  "Dhaka Care Medical Center",
  "Uttara Health Institute",
  "Dhanmondi General Hospital",
  "Green Life Medical Center",
  "Chattogram Care Hospital",
  "Sylhet Medical Institute",
  "Mirpur Community Hospital",
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

// A realistic mix of Bangladeshi given names — mostly Muslim-pattern names
// (reflecting the country's Muslim-majority population) with a minority of
// Hindu Bengali names, matching the country's actual demographic makeup.
const FIRST_NAMES = [
  "Fahim", "Tanvir", "Mahmud", "Arif", "Rafiul", "Kamal", "Shakil", "Nayeem", "Rakib", "Imran",
  "Nusrat", "Sadia", "Farzana", "Tasnim", "Sumaiya", "Nazia", "Ayesha", "Tania", "Mahmuda", "Rima",
  "Bikash", "Anup", "Sujon", "Provash",
  "Priya", "Sunita", "Rina", "Shikha", "Mitali", "Anita",
];

const LAST_NAMES = [
  "Rahman", "Ahmed", "Islam", "Hossain", "Chowdhury", "Karim", "Khan", "Uddin", "Alam", "Haque",
  "Akter", "Jahan", "Siddique", "Kabir", "Rashid", "Talukder", "Sarker", "Bhuiyan", "Molla", "Sheikh",
  "Das", "Roy", "Sarkar", "Chakraborty", "Dutta", "Paul", "Sen",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithinDays(daysAgo: number): Date {
  const now = Date.now();
  const past = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

// Bangladeshi mobile numbers: 01 + operator digit + 8-digit subscriber number
// (e.g. 01712345678), written in +880 international format.
const BD_OPERATOR_PREFIXES = ["13", "14", "15", "16", "17", "18", "19"];

function randomPhone(): string {
  const prefix = pick(BD_OPERATOR_PREFIXES);
  const rest = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");
  return `+880${prefix}${rest}`;
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
