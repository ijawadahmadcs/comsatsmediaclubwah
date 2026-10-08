// models/Event.ts
import mongoose, { Schema, Types } from "mongoose";

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    team: { type: String, required: true, trim: true }, // matches Admin.team
    teamLeadId: { type: Types.ObjectId, ref: "Admin", required: false, index: true },
    date: { type: Date, required: true },
    assignedMembers: [{ type: Types.ObjectId, ref: "TeamMember" }],
    attendance: [{ type: Types.ObjectId, ref: "TeamMember" }],
    // rating: memberId -> rating (1-5)
    ratings: { type: Map, of: { type: Number, min: 1, max: 5 } },
    // remarks: memberId -> comment string
    remarks: { type: Map, of: String },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.models.Event || mongoose.model("Event", eventSchema);
