import { Comment } from "../models/Comment.js";

export const createPost = async (req, res) => {
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
};

export const getPost = async (req, res) => {
  const { postId } = req.params;
  try {
    const comment = await Comment.find({ postId });
    if (!comment) res.status(404).json({ message: "불러올 comment 없음" });
    res.status(201).json(comment);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "댓글 불러오기 실패" });
  }
};

export const deletePost = async (req, res) => {
  const { commentId } = req.params;
  try {
    const comment = await Comment.findByIdAndDelete(commentId);
    if (!comment) res.status(404).json({ message: "삭제할 comment 없음" });
    res.json({ message: "댓글 삭제 완료" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "댓글 삭제 실패" });
  }
};

export const updatePost = async (req, res) => {
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
};
