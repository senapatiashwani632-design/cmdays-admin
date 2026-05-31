import mongoose, { Schema, Document, Model } from "mongoose";
import { ISpeaker } from "./Speaker";

export interface ICommitee extends Document {
  name: string;
  role: string;
  category:string;
  imageFileId: mongoose.Types.ObjectId;
  order: number;
}

const CommiteeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      options:[
        "Central Organizing Committee",
        "Central Advisory Committee",
        "Local Organizing Committee",
      ],
      required: true,
    },
    imageFileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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

const Commitee: Model<ICommitee> =
  mongoose.models.Commitee ||
  mongoose.model<ICommitee>("Commitee", CommiteeSchema);

export default Commitee;