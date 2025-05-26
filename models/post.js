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
    likes: {
      // 어떤 유저가 눌렀는지 알 수 있도록 ref :"user" 설정
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Post = model("Post", postShema);
