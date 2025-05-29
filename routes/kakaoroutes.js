import express from "express";
import {
  kakaoLogin,
  kakaoCallback,
} from "../controller/kakaoAuthController.js";

const router = express.Router();

router.get("/login", kakaoLogin);
router.get("/callback", kakaoCallback);

export default router;
