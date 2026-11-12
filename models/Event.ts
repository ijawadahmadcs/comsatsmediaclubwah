import mongoose, { Schema, Types, type Model } from "mongoose";

export const EVENT_TITLE_MAX_LENGTH = 150;
export const EVENT_DESCRIPTION_MAX_LENGTH = 2000;
export const EVENT_LOCATION_MAX_LENGTH = 150;
export const EVENT_SOCIETY_MAX_LENGTH = 150;
export const EVENT_CONTACT_MAX_LENGTH = 30;
export const EVENT_NAME_MAX_LENGTH = 100;
export const EVENT_REQUEST_ID_MAX_LENGTH = 80;
export const EVENT_TEAMS = ["Photography", "Videography"] as const;
export const EVENT_REQUESTED_TEAMS = ["Photography", "Videography", "Both"] as const;
export type EventTeam = (typeof EVENT_TEAMS)[number];

export interface IEvent {
  title: string;
  description?: string;
  team: string; // matches Admin.team
  teamLeadId?: Types.ObjectId;
  date: Date;
  endsAt?: Date;
  location?: string;
  society?: string;
  studentLeadName?: string;
  studentLeadContact?: string;
  facultyLeadName?: string;
  requestedTeam?: (typeof EVENT_REQUESTED_TEAMS)[number];
  requestedPersons?: number;
  requestId?: string;
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
    endsAt: { type: Date },
    location: { type: String, trim: true, maxlength: EVENT_LOCATION_MAX_LENGTH },
    society: { type: String, trim: true, maxlength: EVENT_SOCIETY_MAX_LENGTH },
    studentLeadName: { type: String, trim: true, maxlength: EVENT_NAME_MAX_LENGTH },
    studentLeadContact: { type: String, trim: true, maxlength: EVENT_CONTACT_MAX_LENGTH },
    facultyLeadName: { type: String, trim: true, maxlength: EVENT_NAME_MAX_LENGTH },
    requestedTeam: { type: String, enum: EVENT_REQUESTED_TEAMS },
    requestedPersons: { type: Number, min: 1, max: 100 },
    requestId: { type: String, trim: true, maxlength: EVENT_REQUEST_ID_MAX_LENGTH, index: true },
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
