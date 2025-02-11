const express = require("express");
const Comment = require("../model/comment.model.js");

const router = express.Router();

// create a comments
router.post("/post-comment", async (req, res) => {
  try {
    console.log(req.body);
    const newComment = new Comment(req.body);
    await newComment.save();
    res.status(200).send({ message: "Comment Created Successfully!", comment: newComment });
  } catch (error) {
    console.error("An Error occurred while posting new comment", error);
    res
      .status(500)
      .send({ message: "An Error occurred while posting new comment" });
  }
});

// get All Comments Count
router.get("/total-comments", async (req, res) => {
  try {
    const totalComment = await Comment.countDocuments({});
    res.status(200).send({message: "Total Count Comments", totalComment});
  } catch (error) {
    console.error("An Error occurred while geting count comment", error);
    res
      .status(500)
      .send({ message: "An Error occurred while geting count comment" });
  }
});

module.exports = router;
