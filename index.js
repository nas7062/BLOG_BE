import express, { json } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { User } from "./models/user.js";
import bcrypt, { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT;
const SALT = process.env.SALT;
const SECRET = process.env.SECRET;
const EXPIRES_IN = process.env.EXPIRES_IN;
const MONGO_URL = process.env.MONGO_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

app.use(express.json()); // 요청의 body에 있는 JSON 데이터를 파있게싱
app.use(cookieParser()); // 토큰을 쿠키로 받을 수

//CORS 설정
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true, // 쿠키 포함한 요청을 허용하는 것
  })
);

mongoose // mongoDB와 연결
  .connect(MONGO_URL)
  .then(() => console.log("mongoDB 연결"))
  .catch(() => console.log("mongoDB 연결 실패"));

/*user 부분 */

// 쿠키 설정
const cookieOptions = {
  httpOnly: true, // XSS 공격으로부터 쿠키 보호됨 (자바스크립트 접근 불가)
  maxAge: 1000 * 60 * 60, // 1시간
  secure: process.env.NODE_ENV === "production", //HTTPS 환경에서만 쿠키 전송, 민감 데이터 보호에 필수
  sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict", //크로스 사이트 요청 시 쿠키가 포함될 수 있는지
  /* 개발 중에는 엄격한 쿠키 정책으로 동작을 점검 (strict), 배포 후에는 실제 사용자 환경에 맞춰 유연하게 동작 (lax) */
  path: "/",
  // domain: ".yourdomain.com", // 필요 시 도메인 추가
};

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
      const { _id, email, nickname } = user; // mongoDb에서 가져옴
      const payload = { email, nickname }; // JWT 페이로드 생성//
      const token = jwt.sign(payload, SECRET, {
        expiresIn: EXPIRES_IN,
      });
      res.cookie("token", token, cookieOptions).json({ email, nickname, _id });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "서버 에러" });
  }
});

app.get("/profile", async (req, res) => {
  const token = req.cookies.token;
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

/*post 부분 */
import multer from "multer"; // 프론트엔드에서 전달된 첨부파일 업로드 처리하기 위해 사용
import path from "path";
import fs from "fs";
import { Post } from "./models/post.js";

import { fileURLToPath } from "url";
import { Comment } from "./models/comment.js";

// __dirname 설정 (ES 모듈에서는 __dirname이 기본적으로 제공되지 않음)
const __filename = fileURLToPath(import.meta.url); // 현재 모듈 파일의 경로 ex)'file:///Users/minseok/project/server/index.js'
const __dirname = path.dirname(__filename); //일반 경로로 바꿔줍니다. ex ) '/Users/minseok/project/server/index.js'

// 요청할 때 uploads로 시작한다면 uploads 에 있는 파일을 준다
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 정적 파일 접근 시 CORS 오류를 방지하기 위한 설정
app.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;
  res.sendFile(path.join(__dirname, "uploads", filename));
}); // 사용자가 요청하면 filename을 꺼내 uploads 폴더에 있는 filename이름의 파일을 보내준다.

const uploadDir = "uploads"; // uplaod 폴더가 없을 시 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

//파일이 저장 돌 위치 정하기
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); //첫번째 인자는 오류객체 넣는 곳 두번째는 파일이 저장될 폴더 경로 지정
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }, //파일 이름 설정 무작위 수를 반환 + 업로드된 원본 파일의 확장자 불러와 생성
});

const upload = multer({ storage });

app.post("/createpost", upload.single("files"), async (req, res) => {
  try {
    console.log(req.body);
    const { title, summary, content } = req.body;
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ error: "로그인 필요" });
    }

    const user = jwt.verify(token, SECRET);
    const postData = {
      title,
      summary,
      content,
      cover: req.file ? req.file.path : null, // 파일이 있다면 경로 저장
      author: user.nickname,
    };

    await Post.create(postData);
    console.log("포스트 등록 성공", postData);
    res.json({ message: "포스트 글쓰기 성공" });
  } catch (err) {
    console.log("에러", err);
    return res.status(500).json({ error: "서버 에러" });
  }
});

app.get("/postlist", async (req, res) => {
  try {
    const page = parseInt(req.query.page); //받아온 페이지
    const limit = parseInt(req.query.limit); // 한 페이지당 숫자

    const total = await Post.countDocuments(); //mongoDB에 저장된 포스트 수
    const skip = page * limit; // 페이지당 불러올 번호(?)를 체크하기 위해 1=>1,2,3 2=>4,5,6

    const posts = await Post.find()
      .sort({ createdAt: -1 }) // 최신순
      .skip(skip)
      .limit(limit);
    const postAndCommentCount = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        const postObject = post.toObject();
        postObject.commentCount = commentCount;
        return postObject;
      })
    );

    // 총 개수가 현재 개수 + 다음 불러올 개수보다 커야 다음으로 넘어갈 수 있음
    const hasNext = total > skip + posts.length;
    if (!posts) res.status(404).json({ message: "불러올 post 없음" });

    res.json({ posts: postAndCommentCount, total, hasNext });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "서버 에러" });
  }
});

app.get("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ _id: postId });
    if (!post) res.status(404).json({ message: "불러올 post 없음" });
    const commentCount = await Comment.countDocuments({ postId });
    const postObject = post.toObject();
    postObject.commentCount = commentCount;

    res.json(postObject);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "서버 에러" });
  }
});

app.delete("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.deleteOne({ _id: postId });
    if (!post) res.status(404).json({ message: "삭제할 post 없음" });
    res.json({ message: "게시물 삭제 완료" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "서버 에러" });
  }
});

app.put("/post/:postId", upload.single("files"), async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, summary, content } = req.body;
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ error: "로그인 필요" });
    }
    const user = jwt.verify(token, SECRET);

    const post = await Post.findById(postId); // id로  해당 post 찾음
    // 작성자 확인 (자신의 글만 수정 가능)
    if (post.author !== user.nickname) {
      return res.status(403).json({ error: "자신의 글만 수정할 수 있습니다." });
    }
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }

    // 수정할 데이터 객체 생성
    const updateData = {
      title,
      summary,
      content,
    };
    // 새 파일이 업로드된 경우 파일 경로 업데이트
    if (req.file) {
      updateData.cover = req.file.path;
    }

    // 게시물 업데이트
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      updateData,
      { new: true } // 업데이트된 문서 반환
    );
    res.json({
      message: "게시물이 수정되었습니다.",
      post: updatedPost,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "서버 에러" });
  }
});

app.post("/like/:postId", async (req, res) => {
  const { postId } = req.params;
  const { token } = req.cookies;
  try {
    if (!token) {
      return res.status(401).json({ error: "로그인 필요" });
    }
    const decoded = jwt.verify(token, SECRET);

    const user = await User.findOne({ nickname: decoded.nickname });
    if (!user) {
      return res.status(401).json({ error: "해당 유저가 없음 " });
    }
    const post = await Post.findById(postId).populate("likes", "nickname");
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }
    //  좋아요 중복 방지
    const alreadyLiked = post.likes.some(
      (userObj) => userObj._id.toString() === user._id.toString()
    );
    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (userObj) => userObj._id.toString() !== user._id.toString()
      );
    } else {
      post.likes.push(user._id); // 좋아요 추가
    }
    await post.save();
    return res.json({
      liked: !alreadyLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "서버 에러" });
  }
});

app.post("/comments", async (req, res) => {
  const { content, author, postId } = req.body;
  try {
    const newComment = await Comment.create({
      content,
      author,
      postId,
    });
    res.status(201).json(newComment);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "댓글 작성 실패" });
  }
});

app.get("/comments/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const comment = await Comment.find({ postId });
    if (!comment) res.status(404).json({ message: "불러올 comment 없음" });
    res.status(201).json(comment);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "댓글 불러오기 실패" });
  }
});

app.delete("/comments/:commentId", async (req, res) => {
  const { commentId } = req.params;
  try {
    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) res.status(404).json({ message: "삭제할 comment 없음" });
    res.json({ message: "댓글 삭제 완료" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "댓글 삭제 실패" });
  }
});

app.put("/comments/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const { editContent } = req.body;
  try {
    const comment = await Comment.findOne({ commentId });
    const newComment = {
      ...comment,
      content: editContent,
    };
    const updatecomment = await Comment.findByIdAndUpdate(
      commentId,
      newComment,
      {
        new: true,
      }
    );
    res.json({
      message: "게시물이 수정되었습니다.",
      comment: updatecomment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "댓글 수정 실패" });
  }
});

// 내 정보 가져오기 (user,post,comment,like)
app.get("/user/:nickname/full", async (req, res) => {
  const { nickname } = req.params;

  try {
    const user = await User.findOne({ nickname }).select("-password");
    if (!user)
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });

    const [posts, comments, likes] = await Promise.all([
      Post.find({ author: nickname }).sort({ createdAt: -1 }),
      Comment.find({ author: nickname }).sort({ createdAt: -1 }),
      Post.find({ likes: user._id }), // 예시: like 누른 post
    ]);
    const postAndCommentCount = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        const postObject = post.toObject();
        postObject.commentCount = commentCount;
        return postObject;
      })
    );
    if (!posts || !comments || !likes)
      return res.status(404).json({ message: "내 정보 불러오는 중 오류발생" });

    res.json({ user, posts: postAndCommentCount, comments, likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 에러" });
  }
});

app.put("/user/update", async (req, res) => {
  const { email, nickname, password } = req.body;
  try {
    const user = await User.findOne({ email });
    const isMatch = await User.findOne({
      nickname,
    });
    if (isMatch) {
      return res
        .status(409)
        .json({ message: "중복된 이메일 혹은 닉네임이 존재합니다" });
    }
    const hashed = await bcrypt.hash(password, parseInt(SALT)); // 비밀번호 암호화(SALT이용)
    const updateUser = await User.findOneAndUpdate(
      { email }, // 이 조건으로 유저 찾기
      { nickname, password: hashed }, // 변경할 데이터
      { new: true } // 업데이트 후의 데이터를 반환
    );
    res
      .status(200)
      .json({ message: "사용자 정보가 성공적으로 업데이트되었습니다" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "서버 에러" });
  }
});

app.listen(PORT, () => {
  console.log(`연결성공 port = ${PORT}`);
});
