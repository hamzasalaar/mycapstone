const express = require("express");
const {
  getUser,
  deleteUser,
  updateUser,
  getCourses,
} = require("../controllers/adminController");
const { isAdmin } = require("../middleware/adminAuth");
const {
  approveCourse,
  rejectCourse,
  deleteCourse,
} = require("../controllers/courseController");

const AdminRoute = express.Router();

AdminRoute.get("/getuser", isAdmin, getUser);
AdminRoute.post("/deleteuser/:id", isAdmin, deleteUser);
AdminRoute.put("/update/:id", isAdmin, updateUser);

AdminRoute.get("/courses", isAdmin, getCourses); // Get all courses
AdminRoute.put("/course/approve/:courseId", isAdmin, approveCourse); // Approve a course
AdminRoute.put("/course/reject/:courseId", isAdmin, rejectCourse); // Reject a course
AdminRoute.delete("/course/delete/:courseId", isAdmin, deleteCourse); // Delete a course


module.exports = AdminRoute;
