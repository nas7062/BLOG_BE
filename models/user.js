import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userShema = new Schema(
  {
    email: {
      type: String,
      require: true,
      unique: true,
    },
    nickname: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model("User", userShema);
