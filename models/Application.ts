import mongoose, { Schema } from "mongoose";

const applicationSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    semester: { type: String, required: true },
    contactNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    areaOfInterest: { type: String, required: true, trim: true },
    motivation: { type: String, required: true, trim: true },
    expectations: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

const Application =
  mongoose.models.Application || mongoose.model("Application", applicationSchema);

export default Application;