import mongoose, { Schema, type Model } from "mongoose";

export const ADMIN_ROLES = ["superadmin", "admin", "teamlead"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface IAdmin {
  registrationNumber: string;
  passwordHash: string;
  name?: string;
  role: AdminRole;
  team?: string;
  isActive: boolean;
  // Incremented to revoke every session issued for the account (logout, password reset, deactivation).
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    registrationNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    role: { type: String, enum: ADMIN_ROLES, default: "admin", required: true },
    team: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

const Admin = (mongoose.models.Admin as Model<IAdmin> | undefined) ?? mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
