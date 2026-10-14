import mongoose, { Schema, Types, type Model } from "mongoose";

// Audit trail of state-changing actions by admins and Team Leads.
export interface ILog {
  action: string; // e.g. "application_updated", "admin_created", "event_deleted"
  adminId: Types.ObjectId;
  // Snapshot of the actor, so entries stay readable after the account is deleted.
  actorRole?: string;
  actorRegistrationNumber?: string;
  targetType?: string;
  targetId?: string;
  details?: unknown; // extra context, e.g. { before, after }
  createdAt: Date;
  updatedAt: Date;
}

const logSchema = new Schema<ILog>(
  {
    action: { type: String, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    actorRole: { type: String },
    actorRegistrationNumber: { type: String },
    targetType: { type: String },
    targetId: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false },
);

logSchema.index({ createdAt: -1 });

const Log = (mongoose.models.Log as Model<ILog> | undefined) ?? mongoose.model<ILog>("Log", logSchema);

export default Log;
