import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema(
  {
    registrationNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    role: { type: String, enum: ["superadmin", "admin"], default: "admin", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;