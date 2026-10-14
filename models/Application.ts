import mongoose, { Schema, Types, type Model } from "mongoose";
import { APPLICATION_FIELD_LIMITS as LIMITS } from "@/lib/applicationRules";

export const APPLICATION_STATUSES = ["Pending", "Reviewed", "Accepted", "Rejected"] as const;
export const PAYMENT_STATUSES = ["Unpaid", "Paid"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface IApplication {
  fullName: string;
  registrationNumber: string;
  department: string;
  semester: string;
  contactNumber: string;
  email: string;
  areaOfInterest: string;
  image?: string;
  teamMemberId?: Types.ObjectId;
  motivation: string;
  expectations?: string;
  // Older records may have no status/paymentStatus; treat them as "Pending"/"Unpaid".
  status?: ApplicationStatus;
  paymentStatus?: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: LIMITS.fullName },
    registrationNumber: { type: String, required: true, trim: true, maxlength: LIMITS.registrationNumber },
    department: { type: String, required: true, trim: true, maxlength: LIMITS.department },
    semester: { type: String, required: true },
    contactNumber: { type: String, required: true, trim: true, maxlength: LIMITS.contactNumber },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: LIMITS.email },
    areaOfInterest: { type: String, required: true, trim: true, maxlength: LIMITS.areaOfInterest },
    image: { type: String, trim: true },
    teamMemberId: { type: Schema.Types.ObjectId, ref: "TeamMember" },
    motivation: { type: String, required: true, trim: true, maxlength: LIMITS.motivation },
    expectations: { type: String, trim: true, maxlength: LIMITS.expectations },
    status: { type: String, enum: APPLICATION_STATUSES, default: "Pending" },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "Unpaid" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

applicationSchema.index({ registrationNumber: 1 });
applicationSchema.index({ createdAt: -1 });

const Application =
  (mongoose.models.Application as Model<IApplication> | undefined) ??
  mongoose.model<IApplication>("Application", applicationSchema);

export default Application;
