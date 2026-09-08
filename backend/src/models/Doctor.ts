import { Schema, model, Document } from "mongoose";

export type DoctorStatus = "active" | "on-leave" | "inactive";

export interface IDoctor extends Document {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  status: DoctorStatus;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Deliberately minimal: just enough to answer "is this doctor currently
    // practicing" for the summary card and table badge — not a scheduling or
    // HR system. Every doctor starts active; nothing sets it to "on-leave" or
    // "inactive" automatically, it's an admin-editable field via PATCH.
    status: { type: String, enum: ["active", "on-leave", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// Search: name/specialization/hospital
doctorSchema.index({ name: "text", specialization: "text", hospital: "text" });
// Specialization filter
doctorSchema.index({ specialization: 1 });
// Hospital filter
doctorSchema.index({ hospital: 1 });
// Date filter + default sort + pagination
doctorSchema.index({ createdAt: -1 });

export const Doctor = model<IDoctor>("Doctor", doctorSchema);
