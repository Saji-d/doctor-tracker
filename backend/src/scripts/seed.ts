import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env";
import { connectDB } from "../config/db";
import { User } from "../models/User";
import { Doctor, DoctorStatus } from "../models/Doctor";
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

const DOCTOR_COUNT = 20;
const FIRST_PAGE_SIZE = 10; // Doctors table's page size — see doctors/page.tsx LIMIT.

// The Doctors table sorts by createdAt descending, so "page 1" is whichever
// 10 doctors have the most recent createdAt. Split into two status pools —
// one for the 10 doctors that will land on page 1, one for the rest — so the
// page-1 mix (7 active / 2 on-leave / 1 inactive) is guaranteed rather than
// hoping a single shuffle happens to land that way. Combined the two pools
// are 15 active / 3 on-leave / 2 inactive across all 20 doctors.
const FIRST_PAGE_STATUS_POOL: DoctorStatus[] = [
  "active", "active", "active", "active", "active", "active", "active",
  "on-leave", "on-leave",
  "inactive",
];
const REST_STATUS_POOL: DoctorStatus[] = [
  "active", "active", "active", "active", "active", "active", "active", "active",
  "on-leave",
  "inactive",
];

// One explicit target patient-count per doctor (descending, no ties among the
// top 7) instead of letting patients land on doctors uniformly at random —
// uniform assignment tends toward a flat, heavily-tied distribution, which is
// exactly what made the "Patients per Doctor" chart look artificially flat.
// Shuffled onto doctors below so rank has no relationship to seed order. Only
// the first 7 values need to stay distinct (that's all the dashboard chart
// shows); the rest just need to look like a realistic long tail.
const PATIENT_COUNT_TARGETS = [
  14, 12, 10, 9, 8, 7, 6,
  6, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1,
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fisher-Yates — used to decorrelate specialization/hospital/status/patient-
// count assignment from each other and from doctor creation order.
function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Repeats `values` until it's at least `length` long, then trims to exactly
// `length` — guarantees every value appears at least once across all the
// doctors regardless of how few doctors there are relative to the value set.
function cyclicFill<T>(values: T[], length: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < length; i++) out.push(values[i % values.length]);
  return out;
}

function randomDateWithinDays(daysAgo: number): Date {
  const now = Date.now();
  const past = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

// Non-overlapping with randomDateWithinDays(30) by construction — used for
// the "page 2+" doctor group so every one of them sorts strictly older than
// every page-1 doctor, regardless of how the random draws land.
function randomDateBetweenDaysAgo(minDaysAgo: number, maxDaysAgo: number): Date {
  const now = Date.now();
  const earliest = now - maxDaysAgo * 24 * 60 * 60 * 1000;
  const latest = now - minDaysAgo * 24 * 60 * 60 * 1000;
  return new Date(earliest + Math.random() * (latest - earliest));
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
  const specializationAssignments = shuffled(cyclicFill(SPECIALIZATIONS, DOCTOR_COUNT));
  const hospitalAssignments = shuffled(cyclicFill(HOSPITALS, DOCTOR_COUNT));

  // Sampled without replacement (a shuffled slice, not `pick` per doctor) so
  // no two doctors ever share a first name — two different doctors both named
  // "Kamal" (distinguishable only by last name) read as a data-entry mistake
  // in the table, not realistic variety.
  const firstNameAssignments = shuffled(FIRST_NAMES).slice(0, DOCTOR_COUNT);

  const restCount = DOCTOR_COUNT - FIRST_PAGE_SIZE;
  const statusAssignments = [
    ...shuffled(FIRST_PAGE_STATUS_POOL),
    ...shuffled(REST_STATUS_POOL).slice(0, restCount),
  ];

  const doctorDocs = Array.from({ length: DOCTOR_COUNT }, (_, i) => {
    const first = firstNameAssignments[i];
    const last = pick(LAST_NAMES);
    // Short first-name-only address — even the firstname.lastname@gmail.com
    // form was too wide for the Doctors table's Email column at normal
    // desktop widths; a bare first name plus a numeric suffix on collision
    // stays short while remaining realistic. First names are already unique
    // per doctor above, so the collision branch is just a safety net.
    let email = `${first}@gmail.com`.toLowerCase();
    let suffix = 2;
    while (usedDoctorEmails.has(email)) {
      email = `${first}${suffix}@gmail.com`.toLowerCase();
      suffix += 1;
    }
    usedDoctorEmails.add(email);

    // First FIRST_PAGE_SIZE doctors get a recent createdAt (so they're the
    // ones the table's default createdAt-desc sort puts on page 1); the rest
    // get an older one, strictly earlier than any page-1 date.
    const isFirstPage = i < FIRST_PAGE_SIZE;
    const createdAt = isFirstPage ? randomDateWithinDays(30) : randomDateBetweenDaysAgo(40, 180);

    return {
      name: `Dr. ${first} ${last}`,
      specialization: specializationAssignments[i],
      hospital: hospitalAssignments[i],
      phone: randomPhone(),
      email,
      status: statusAssignments[i],
      createdAt,
      updatedAt: createdAt,
    };
  });
  const doctors = await Doctor.insertMany(doctorDocs);

  console.log("Creating patients...");
  const patientCountAssignments = shuffled(PATIENT_COUNT_TARGETS);
  const patientDocs = doctors.flatMap((doctor, doctorIndex) => {
    const count = patientCountAssignments[doctorIndex];
    return Array.from({ length: count }, (_, i) => {
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      // Bias toward recent activity so the last-30-days dashboard trend has
      // real data, while still covering the full range for date-filter
      // testing.
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
