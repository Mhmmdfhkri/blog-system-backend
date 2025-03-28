const express = require("express");
const router = express.Router();
const Blog = require("../model/blog.model.js");
const Comment = require("../model/comment.model.js");
const verifyToken = require("../middleware/verifyToken.js");
const isAdmin = require("../middleware/isAdmin.js");

// create a blog post
router.post("/create-post", verifyToken, isAdmin, async (req, res) => {
  try {
    // console.log("UserId: ", req.userId)
    const newPost = new Blog({
      ...req.body,
      author: req.userId,
    });
    await newPost.save();
    res
      .status(201)
      .send({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send({ message: "Failed to create post" });
  }
});

// get All Blogs
router.get("/", async (req, res) => {
  try {
    const { search, category, location } = req.query;
    console.log(search);

    let query = {};

    if (search) {
      query = {
        ...query,
        $or: [
          { title: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          // { content: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (category) {
      query = {
        ...query,
        category,
      };
    }

    if (location) {
      query = {
        ...query,
        location,
      };
    }

    const posts = await Blog.find(query)
      .populate("author", "email")
      .sort({ createdAt: -1 });
    res.status(200).send(posts);
  } catch (error) {
    console.error("Error creating post", error);
    res.status(500).send({ message: "Error Creating a Post" });
  }
});

// get Single Blog By ID
router.get("/:id", async (req, res) => {
  try {
    console.log(req.params.id);
    const postId = req.params.id;
    //const post = await Blog.findById(postId);
    const post = await Blog.findById(postId).populate(
      "author",
      "user username"
    );

    if (!post) {
      return res.status(404).send({ message: "Post Not Found" });
    }
    const comments = await Comment.find({ postId: postId }).populate(
      "user",
      "username email"
    );
    res.status(200).send({
      post,
      comments,
    });
  } catch (error) {
    console.error("Error Fatching Single post", error);
    res.status(500).send({ message: "Error Fatching Single post" });
  }
});

// update a Blog Post
router.patch("/update-post/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const postId = req.params.id;
    const updatedPost = await Blog.findByIdAndUpdate(
      postId,
      {
        ...req.body,
      },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).send({ message: "Post not found" });
    }
    res.status(201).send({
      message: "Post Updated Successfully!",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error Updating post", error);
    res.status(500).send({ message: "Error Updating post" });
  }
});

// delete a Blog
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Blog.findByIdAndDelete(postId);

    if (!post) {
      return res.status(404).send({ message: "Post Not Found" });
    }

    // deleted related comment
    await Comment.deleteMany({ postId: postId });

    res.status(201).send({
      message: "Post Berhasil dihapus!",
      post: post,
    });
  } catch (error) {
    console.error("Error Deleting post", error);
    res.status(500).send({ message: "Error Deleting post" });
  }
});

//releated Blog
router.get("/related/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send({ message: "Post Id is required" });
    }
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).send({ message: "Post Not Found" });
    }
    const titleRegex = new RegExp(blog.title.split(" ").join("|"), "i");
    const categoryRegex = new RegExp(blog.category.split(" ").join("|"), "i");

    const releatedQuery = {
      _id: { $ne: id }, // exclude the current blog by id
      $or: [
        { title: { $regex: titleRegex } },
        { category: { $regex: categoryRegex } },
      ],
    };

    const releatedPost = await Blog.find(releatedQuery);
    res.status(200).send(releatedPost);
  } catch (error) {
    console.error("Error fetching related  post", error);
    res.status(500).send({ message: "Error fetching related  post" });
  }
});

router.post("/:id/rate", async (req, res) => {
  try {
    console.log("Request masuk ke /rate:", req.body); // Debugging

    const { rating } = req.body;
    if (!rating || typeof rating !== "number") {
      return res.status(400).json({ message: "Rating harus berupa angka!" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog tidak ditemukan" });
    }

    blog.ratings.push(rating);
    await blog.save();

    res.status(200).json({ message: "Rating berhasil diberikan", blog });
  } catch (error) {
    console.error("Error di /rate:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

module.exports = router;
