import express from "express";

import {
  createpost,
  postlist,
  getPostById,
  deletePost,
  updatePost,
  toggleLike,
} from "../controller/postcontroller.js";

import { upload } from "../middleware/upload.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", authenticateToken, upload.single("files"), createpost);
router.get("/list", postlist);
router.get("/:postId", getPostById);
router.delete("/:postId", deletePost);
router.put("/:postId", upload.single("files"), updatePost);
router.post("/like/:postId", toggleLike);

export default router;
