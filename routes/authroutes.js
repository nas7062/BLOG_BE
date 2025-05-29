import express from "express";
import {
  register,
  login,
  getProfile,
  logout,
} from "../controller/authcontroller.js";
import { authenticateToken } from "../middleware/auth.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);
router.post("/logout", logout);

export default router;
