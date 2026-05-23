import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISpeaker extends Document {
  name: string;
  role: string;
  imageFileId: mongoose.Types.ObjectId;
  order: number;
  talkTitle: string;
  abstract: string;
  bio: string;
}

const SpeakerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    imageFileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    talkTitle: {
      type: String,
      default: "To be Updated Soon",
    },

    abstract: {
      type: String,
      default: "To be Updated Soon",
    },
    bio:{
      type:String,
      default:"To be Updated Soon",
    },

    order: {
    type: Number,
    default: 0,
  },
  },
  {
    timestamps: true,
  }
);

const Speaker: Model<ISpeaker> =
  mongoose.models.Speaker ||
  mongoose.model<ISpeaker>("Speaker", SpeakerSchema);

export default Speaker;