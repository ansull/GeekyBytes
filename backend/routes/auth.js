const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json("User already exist");
    }
    //hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hashSync(password, salt);
    const newUser = new User({
      username,
      email,
      password: hashedpassword,
    });

    const savedUser = await newUser.save();
    res.status(200).json(savedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

//login
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // console.log(req.body.email);
    // console.log(user);

    if (!user) {
      return res.status(404).json("User not found");
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(401).json("Wrong credentials");
    }
    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email },
      process.env.SECRET,
      {
        expiresIn: "3d",
      }
    );
    const { password, ...info } = user._doc;
    res.cookie("jwtToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    res.status(200).json(info); // Send a response to the client
  } catch (err) {
    res.status(500).json(err);
  }
});

//logout
router.get("/logout", async (req, res) => {
  try {
    res
      .clearCookie("jwtToken", { sameSite: "none", secure: true })
      .status(200)
      .send("User logout successfully");
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/refetch", (req, res) => {
  const token = req.cookies.jwtToken;
  jwt.verify(token, process.env.SECRET, {}, async (err, data) => {
    if (err) {
      return res.status(404).json("weewe");
    }
    res.status(200).json(data);
  });
});
module.exports = router;
