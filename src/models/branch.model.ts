import mongoose, { Schema } from "mongoose";
import IBranch from "../Interfaces/branch.interface";

export const branchSchema = new Schema<IBranch>(
  {
    name: {
      type: String,
      required: true,
    },
    show: {
      type: Boolean,
    },
    branchOwner: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Branch = mongoose.model("branch", branchSchema);

export default Branch;
