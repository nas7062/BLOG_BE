import { Post } from "../models/post.js";
import { User } from "../models/user.js";
import { Comment } from "../models/comment.js";
import jwt from "jsonwebtoken";
import { SECRET } from "../config/jwt.js";
export const createpost = async (req, res) => {
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
};

export const postlist = async (req, res) => {
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
};

export const getPostById = async (req, res) => {
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
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.deleteOne({ _id: postId });
    await Comment.deleteMany({ postId });
    if (!post) res.status(404).json({ message: "삭제할 post 없음" });
    res.json({ message: "게시물 삭제 완료" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "서버 에러" });
  }
};

export const updatePost = async (req, res) => {
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
};

export const toggleLike = async (req, res) => {
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
};

export const serachPost = async (req, res) => {
  const { search } = req.params;
  try {
    const post = await Post.find({ title: { $regex: search, $options: "i" } });
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    } else res.json(post);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "서버 에러" });
  }
};
