import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
export const PORT = process.env.PORT;
export const CORS_ORIGIN = process.env.CORS_ORIGIN;
export const SALT = process.env.SALT;

app.use(express.json()); // 요청의 body에 있는 JSON 데이터를 파있게싱
app.use(cookieParser()); // 토큰을 쿠키로 받을 수

//CORS 설정
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true, // 쿠키 포함한 요청을 허용하는 것
  })
);
import connectDB from "./config/db.js";
connectDB(); // DB연결

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
// __dirname 설정 (ES 모듈에서는 __dirname이 기본적으로 제공되지 않음)
const __filename = fileURLToPath(import.meta.url); // 현재 모듈 파일의 경로 ex)'file:///Users/minseok/project/server/index.js'
const __dirname = path.dirname(__filename); //일반 경로로 바꿔줍니다. ex ) '/Users/minseok/project/server/index.js'

// 요청할 때 uploads로 시작한다면 uploads 에 있는 파일을 준다
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 정적 파일 접근 시 CORS 오류를 방지하기 위한 설정
app.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "uploads", filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("파일이 존재하지 않습니다.");
  }
  res.sendFile(filePath);
}); // 사용자가 요청하면 filename을 꺼내 uploads 폴더에 있는 filename이름의 파일을 보내준다.

const uploadDir = "uploads"; // uplaod 폴더가 없을 시 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 라우트 가져오기
import authRoutes from "./routes/authroutes.js";
import postRoutes from "./routes/postroutes.js";
import commentRoutes from "./routes/commentroutes.js";
import userRoutes from "./routes/userroutes.js";
import kakaoAuthRoutes from "./routes/kakaoroutes.js";
app.use("/auth", authRoutes);
app.use("/post", postRoutes);
app.use("/comments", commentRoutes);
app.use("/user", userRoutes);
app.use("/auth/kakao", kakaoAuthRoutes);

app.listen(PORT, () => {
  console.log(`연결성공 port = ${PORT}`);
});
