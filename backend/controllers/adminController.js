const UserModel = require("../models/userModel");
const CourseModel = require('../models/courseModel');
const mongoose = require("mongoose");

const getUser = async (req, res) => {
  try {
    const users = await UserModel.find();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await UserModel.findById(userId);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });

    if (user.role === "admin")
      return res
        .status(401)
        .json({ success: false, message: "Admin can't be deleted!" });
    
    await UserModel.findByIdAndDelete(userId);
    
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const {name, email, role} = req.body;
    const user = await UserModel.findById(req.params.id);

    if(!user){
      return res.status(404).json({success:false, message:"User not found!"})
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;

    await user.save();

    res.json({ success: true, message: "User updated successfully", user });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}


const getCourses = async (req, res) => {
    try {
        // Only allow admins to access this
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
        }

        const courses = await CourseModel.find()
            .populate('teacher', 'name email') // Populate teacher info (name and email only)
            .exec();

        res.status(200).json({ success: true, courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
  getUser,
  deleteUser,
  updateUser,
  getCourses,
};
