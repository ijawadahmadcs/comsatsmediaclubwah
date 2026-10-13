import mongoose, { Schema, Types, type Model } from "mongoose";

export const EVENT_TITLE_MAX_LENGTH = 150;
export const EVENT_DESCRIPTION_MAX_LENGTH = 2000;

export interface IEvent {
  title: string;
  description?: string;
  team: string; // matches Admin.team
  teamLeadId?: Types.ObjectId;
  date: Date;
  assignedMembers: Types.ObjectId[];
  attendance: Types.ObjectId[];
  // Set when attendance is saved, so statistics can skip events whose attendance was never taken.
  attendanceRecordedAt?: Date;
  ratings: Map<string, number>; // memberId -> rating (1-5)
  remarks: Map<string, string>; // memberId -> comment
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true, maxlength: EVENT_TITLE_MAX_LENGTH },
    description: { type: String, trim: true, maxlength: EVENT_DESCRIPTION_MAX_LENGTH },
    team: { type: String, required: true, trim: true },
    teamLeadId: { type: Schema.Types.ObjectId, ref: "Admin", required: false, index: true },
    date: { type: Date, required: true },
    assignedMembers: [{ type: Schema.Types.ObjectId, ref: "TeamMember" }],
    attendance: [{ type: Schema.Types.ObjectId, ref: "TeamMember" }],
    attendanceRecordedAt: { type: Date },
    ratings: { type: Map, of: { type: Number, min: 1, max: 5 }, default: () => new Map() },
    remarks: { type: Map, of: String, default: () => new Map() },
  },
  { timestamps: true, versionKey: false },
);

const Event = (mongoose.models.Event as Model<IEvent> | undefined) ?? mongoose.model<IEvent>("Event", eventSchema);

export default Event;
