import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getUser, userUpdate } from "../controller/usercontroller.js";

const router = express.Router();

router.get("/:nickname/full", authenticateToken, getUser);
router.put("/update", userUpdate);

export default router;
