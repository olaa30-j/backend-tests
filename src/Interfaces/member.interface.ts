import { Types } from "mongoose";

export type FamilyRelationship =
  | "ابن"
  | "ابنة"
  | "زوجة"
  | "زوج"
  | "حفيد"
  | "حفيدة"
  | "الجد الأعلى"
  | "أخرى";

export default interface IMember {
  userId?: Types.ObjectId;
  fname: string;
  lname: string;
  gender: "أنثى" | "ذكر";
  familyBranch: Types.ObjectId;
  familyRelationship: FamilyRelationship;
  birthday?: Date;
  deathDate?: Date;
  summary?: string;
  husband?: Types.ObjectId; //for female
  wives?: Types.ObjectId[]; //for male
  isUser?: boolean;
  image?: string;
  parents?: {
    father?: Types.ObjectId;
    mother?: Types.ObjectId;
  };
  children?: Types.ObjectId[];
}
