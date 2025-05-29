import express from "express";
import {
  createComment,
  getComment,
  deleteComment,
  updateComment,
} from "../controller/commentcontroller.js";

import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateToken, createComment);
router.get("/:postId", getComment);
router.delete("/:commentId", authenticateToken, deleteComment);
router.put("/:commentId", authenticateToken, updateComment);

export default router;
