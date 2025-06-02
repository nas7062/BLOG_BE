import mongoose from "mongoose";

const { Schema, model } = mongoose;

const NotificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User", // 알림 받는 유저
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User", // 알림을 발생시킨 유저
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment"], // 알림 유형
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    commentText: {
      type: String, // 댓글 내용
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false, // 읽음 여부
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = model("Notification", NotificationSchema);
