import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { User } from "./models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();
const port = 3000;

const SALT = 10;
const SECRET = "KMSBLOG";
const EXPIRES_IN = "1d";

app.use(express.json()); // 요청의 body에 있는 JSON 데이터를 파싱
app.use(cookieParser()); // 토큰을 쿠키로 받을 수 있게
//CORS 설정
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // 쿠키 포함한 요청을 허용하는 것
  })
);

const cookieOptions = {
  httpOnly: true, // XSS 공격으로부터 쿠키 보호됨 (자바스크립트 접근 불가)
  maxAge: 1000 * 60 * 60, // 1시간
  secure: process.env.NODE_ENV === "production", //HTTPS 환경에서만 쿠키 전송, 민감 데이터 보호에 필수
  sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict", //크로스 사이트 요청 시 쿠키가 포함될 수 있는지
  /* 개발 중에는 엄격한 쿠키 정책으로 동작을 점검 (strict), 배포 후에는 실제 사용자 환경에 맞춰 유연하게 동작 (lax) */
  path: "/",
  // domain: ".yourdomain.com", // 필요 시 도메인 추가
};

mongoose // mongoDB와 연결
  .connect(
    "mongodb+srv://nas7062:706270@cluster0.dpcdx0t.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("mongoDB 연결"))
  .catch(() => console.log("mongoDB 연결 실패"));

// 회원가입
app.post("/register", async (req, res) => {
  const { email, nickname, password } = req.body; // 요청받은 데이터

  try {
    const exists = await User.findOne({ email }); // 중복 이메일 확인
    if (exists)
      return res.status(409).json({ message: "이미 사용 중인 이메일입니다." });

    // 중복된 이메일이 없다면
    const hashed = await bcrypt.hash(password, parseInt(SALT)); // 비밀번호 암호화(SALT이용)
    await new User({ email, nickname, password: hashed }).save(); // user에 저장

    return res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "서버 에러" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(409).json({ message: "등록된 이메일이 없습니다." });
    const match = await bcrypt.compare(password, user.password); // 입력한 비번과 해시된 비번 비교
    if (!match)
      return res
        .status(409)
        .json({ message: "등록된 이메일에 패스워드가 다릅니다." });
    else {
      const { email, nickname } = user; // mongoDb에서 가져옴
      const payload = { email, nickname }; // JWT 페이로드 생성//
      const token = jwt.sign(payload, SECRET, {
        expiresIn: EXPIRES_IN,
      });
      res.cookie("token", token, cookieOptions).json({
        nickname,
      });
    }
  } catch (error) {
    console.log(err);
    return res.status(500).json({ message: "서버 에러" });
  }
});

app.get("/profile", async (req, res) => {
  const token = req.cookies.token;
  console.log(token);
  if (!token) {
    return res.json({ message: "인증 토큰이 없습니다" });
  }

  try {
    const decoded = jwt.verify(token, SECRET); //토큰 유효한지 검증 후 복호화 해서 꺼내옴  iat : 토큰 발급시간 exp : 토큰 만료시간
    const { email } = decoded;
    const user = await User.findOne({ email }).select("-password"); // 비밀번호 제외하고 가져옴 (비밀번호는 프론트에 전달 시 보안 문제)
    if (!user) {
      return res
        .status(404)
        .json({ message: "사용자 정보를 찾을 수 없습니다" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "유효하지 않은 토큰입니다" });
  }
});

app.post("/logout", async (req, res) => {
  res
    .clearCookie("token", {
      ...cookieOptions,
      maxAge: 0,
    })
    .json({ message: "로그아웃 되었습니다" });
});

app.listen(port, () => {
  console.log(`연결성공 port = ${port}`);
});
