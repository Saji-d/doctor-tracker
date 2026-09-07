import { Schema, model, Document, Types } from "mongoose";

export interface IPatient extends Document {
  name: string;
  age: number;
  condition: string;
  phone?: string;
  doctorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    condition: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  },
  { timestamps: true }
);

// Search: name/condition
patientSchema.index({ name: "text", condition: "text" });
// Doctor's patient list, paginated newest-first (highest-traffic query)
patientSchema.index({ doctorId: 1, createdAt: -1 });
// Condition filter
patientSchema.index({ condition: 1 });
// Patients page date filter + dashboard trend
patientSchema.index({ createdAt: -1 });

export const Patient = model<IPatient>("Patient", patientSchema);
