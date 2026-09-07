const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// =========================================
// MODELS
// =========================================

const User = require("./models/User");
const Group = require("./models/Group");
const Activity = require("./models/Activity");
const Message = require("./models/Message");

// =========================================
// MIDDLEWARE
// =========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

// =========================================
// GOOGLE SEARCH CONSOLE VERIFICATION
// =========================================

app.get("/googlecfb9f0231aa5cfbf.html", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "googlecfb9f0231aa5cfbf.html"
    )
  );
});

// =========================================
// HOME PAGE
// =========================================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

// =========================================
// REGISTER
// =========================================

app.post("/api/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      course,
      year,
      skills,
      interests,
      hobbies,
      careerGoal
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: cleanEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered."
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      course: course || "",
      year: year || "",
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      hobbies: Array.isArray(hobbies) ? hobbies : [],
      careerGoal: careerGoal || ""
    });

    return res.status(201).json({
      message: "Registration successful",
      user: sanitizeUser(user)
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed",
      error: error.message
    });
  }
});

// =========================================
// LOGIN
// =========================================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    return res.json({
      message: "Login successful",
      user: sanitizeUser(user)
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

// =========================================
// GET USER PROFILE
// =========================================

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    return res.json(user);

  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      message: "Could not get user.",
      error: error.message
    });
  }
});

// =========================================
// UPDATE USER PROFILE
// =========================================

app.put("/api/users/:id", async (req, res) => {
  try {
    const {
      name,
      course,
      year,
      skills,
      interests,
      hobbies,
      careerGoal
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: name || "",
        course: course || "",
        year: year || "",
        skills: Array.isArray(skills) ? skills : [],
        interests: Array.isArray(interests) ? interests : [],
        hobbies: Array.isArray(hobbies) ? hobbies : [],
        careerGoal: careerGoal || ""
      },
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    return res.json({
      message: "Profile updated successfully",
      user
    });

  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      message: "Profile update failed.",
      error: error.message
    });
  }
});

// =========================================
// SMART MATCHING
// =========================================

app.get("/api/matches/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const otherUsers = await User.find({
      _id: {
        $ne: user._id
      }
    }).select("-password");

    const matches = otherUsers.map((other) => {
      const userSkills = normalizeArray(user.skills);
      const otherSkills = normalizeArray(other.skills);

      const userInterests = normalizeArray(user.interests);
      const otherInterests = normalizeArray(other.interests);

      const userHobbies = normalizeArray(user.hobbies);
      const otherHobbies = normalizeArray(other.hobbies);

      const commonSkills = userSkills.filter((skill) =>
        otherSkills.includes(skill)
      );

      const commonInterests = userInterests.filter((interest) =>
        otherInterests.includes(interest)
      );

      const commonHobbies = userHobbies.filter((hobby) =>
        otherHobbies.includes(hobby)
      );

      let score = 0;

      score += commonSkills.length * 30;
      score += commonInterests.length * 25;
      score += commonHobbies.length * 15;

      if (
        user.careerGoal &&
        other.careerGoal &&
        user.careerGoal.trim().toLowerCase() ===
          other.careerGoal.trim().toLowerCase()
      ) {
        score += 20;
      }

      score = Math.min(score, 100);

      return {
        ...other.toObject(),
        matchScore: score,
        commonSkills,
        commonInterests,
        commonHobbies
      };
    });

    matches.sort(
      (a, b) => b.matchScore - a.matchScore
    );

    return res.json(matches);

  } catch (error) {
    console.error("Matching error:", error);

    return res.status(500).json({
      message: "Matching failed.",
      error: error.message
    });
  }
});

// =========================================
// GET GROUPS
// =========================================

app.get("/api/groups", async (req, res) => {
  try {
    const groups = await Group.find().populate(
      "members",
      "name email"
    );

    return res.json(groups);

  } catch (error) {
    console.error("Get groups error:", error);

    return res.status(500).json({
      message: "Could not load groups.",
      error: error.message
    });
  }
});

// =========================================
// CREATE GROUP
// =========================================

app.post("/api/groups", async (req, res) => {
  try {
    const {
      name,
      description,
      interest
    } = req.body;

    if (!name || !interest) {
      return res.status(400).json({
        message: "Group name and interest are required."
      });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description || "",
      interest: interest.trim(),
      members: []
    });

    return res.status(201).json(group);

  } catch (error) {
    console.error("Create group error:", error);

    return res.status(500).json({
      message: "Could not create group.",
      error: error.message
    });
  }
});

// =========================================
// JOIN GROUP
// =========================================

app.post("/api/groups/:groupId/join", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required."
      });
    }

    const group = await Group.findById(
      req.params.groupId
    );

    const user = await User.findById(userId);

    if (!group || !user) {
      return res.status(404).json({
        message: "Group or user not found."
      });
    }

    if (
      !group.members.some(
        (id) => id.toString() === userId
      )
    ) {
      group.members.push(user._id);
    }

    if (
      !user.joinedGroups.some(
        (id) =>
          id.toString() === group._id.toString()
      )
    ) {
      user.joinedGroups.push(group._id);
    }

    await group.save();
    await user.save();

    return res.json({
      message: "Joined group successfully",
      group
    });

  } catch (error) {
    console.error("Join group error:", error);

    return res.status(500).json({
      message: "Could not join group.",
      error: error.message
    });
  }
});

// =========================================
// GET ACTIVITIES
// =========================================

app.get("/api/activities", async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({
        date: 1
      });

    return res.json(activities);

  } catch (error) {
    console.error("Get activities error:", error);

    return res.status(500).json({
      message: "Could not load activities.",
      error: error.message
    });
  }
});

// =========================================
// CREATE ACTIVITY
// =========================================

app.post("/api/activities", async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      date,
      category
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        message: "Title and date are required."
      });
    }

    const activity = await Activity.create({
      title: title.trim(),
      description: description || "",
      location: location || "",
      date,
      category: category || "General"
    });

    return res.status(201).json(activity);

  } catch (error) {
    console.error("Create activity error:", error);

    return res.status(500).json({
      message: "Could not create activity.",
      error: error.message
    });
  }
});

// =========================================
// GET MESSAGES
// =========================================

app.get(
  "/api/messages/:userId/:otherUserId",
  async (req, res) => {
    try {
      const messages = await Message.find({
        $or: [
          {
            senderId: req.params.userId,
            receiverId: req.params.otherUserId
          },
          {
            senderId: req.params.otherUserId,
            receiverId: req.params.userId
          }
        ]
      }).sort({
        createdAt: 1
      });

      return res.json(messages);

    } catch (error) {
      console.error("Get messages error:", error);

      return res.status(500).json({
        message: "Could not load messages.",
        error: error.message
      });
    }
  }
);

// =========================================
// SEND MESSAGE
// =========================================

app.post("/api/messages", async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      text
    } = req.body;

    if (!senderId || !receiverId || !text) {
      return res.status(400).json({
        message: "Message information incomplete."
      });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text: text.trim()
    });

    return res.status(201).json(message);

  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      message: "Could not send message.",
      error: error.message
    });
  }
});

// =========================================
// HEALTH CHECK
// =========================================

app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    message: "CampusConnect API is running",
    mongodb:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected"
  });
});

// =========================================
// HELPER FUNCTIONS
// =========================================

function normalizeArray(array) {
  if (!Array.isArray(array)) {
    return [];
  }

  return array
    .map((item) =>
      item.toString().trim().toLowerCase()
    )
    .filter((item) => item.length > 0);
}

function sanitizeUser(user) {
  const object = user.toObject();

  delete object.password;

  return object;
}

// =========================================
// START SERVER
// =========================================

async function startServer() {
  try {
    if (!MONGO_URI) {
      console.error(
        "ERROR: MONGO_URI is missing in .env file"
      );

      process.exit(1);
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log(
      "MongoDB connected successfully"
    );

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `CampusConnect server running on port ${PORT}`
      );
    });

  } catch (error) {
    console.error(
      "MongoDB connection error:"
    );

    console.error(error.message);

    process.exit(1);
  }
}

startServer();