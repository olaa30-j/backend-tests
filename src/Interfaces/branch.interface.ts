import { Types } from "mongoose";

export default interface IBranch {
  name: String;
  show?: boolean;
  branchOwner?: String;
}
