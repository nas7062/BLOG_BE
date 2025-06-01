import { User } from "../models/user.js";
import { Post } from "../models/post.js";
import { Comment } from "../models/comment.js";
import bcrypt from "bcryptjs";
import { SALT } from "../index.js";
// 내 정보 가져오기 (user,post,comment,like)
export const getUser = async (req, res) => {
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
};

export const userUpdate = async (req, res) => {
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
};
