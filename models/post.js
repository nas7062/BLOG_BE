import mongoose from "mongoose";

const { Schema, model } = mongoose;

const postShema = new Schema(
  {
    title: {
      type: String,
      require: true,
    },
    summary: {
      type: String,
      require: true,
    },
    content: {
      type: String,
      require: true,
    },
    cover: {
      type: String,
    },
    author: {
      type: String,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Post = model("Post", postShema);
