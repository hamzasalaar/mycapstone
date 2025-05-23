const Course = require("../models/courseModel");
const fs = require("fs");

const createCourse = async (req, res) => {
  try {
    console.log("body", req.body);
    console.log("file", req.file); // Check if file is being received

    const { title, description, videoUrl, price } = req.body;
    const lectureNotes = req.file ? req.file.path : null; // Assuming lecture notes are uploaded as a file

    if (req.user.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only teachers can create courses.",
      });
    }

    if (!title || !description || !price) {
      return res.status(400).json({
        success: false,
        message: "Title, Description and Price are required!",
      });
    }

    const newCourse = new Course({
      title,
      description,
      teacher: req.user.id, // Set teacher ID from logged-in user
      videoUrl,
      lectureNotes,
      studentsEnrolled: [], // Initialize with an empty array
      status: "pending", // Default status
      price,
      rating: 0, // Default rating
      reviews: [], // Initialize with an empty array
    });

    await newCourse.save();
    res.status(201).json({
      success: true,
      message: "Course created successfully!",
      course: newCourse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found!" });
    }

    if (course.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Course is not pending for approval!",
      });
    }

    course.status = "approved";
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course approved successfully!",
      course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rejectionReason } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found!" });
    }

    if (course.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Course is not pending for approval!",
      });
    }

    course.status = "rejected";
    course.rejectionReason = rejectionReason; // Store the rejection reason in the course document
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course rejected successfully!",
      course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, videoUrl, lectureNotes, price } = req.body;

    const course = await Course.findById(courseId);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found!" });
    }

    if (
      course.teacher.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this course!",
      });
    }

    // Prevent updates to already approved/rejected courses
    if (course.status === "approved" || course.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot update an approved/rejected course!",
      });
    }

    if (req.file) {
      if (course.lectureNotes && fs.existsSync(course.lectureNotes)) {
        fs.unlinkSync(course.lectureNotes); // Delete old lecture notes file
      }
      course.lectureNotes = req.file.path; // Update with new file path
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.videoUrl = videoUrl || course.videoUrl;
    course.price = price || course.price;

    await course.save();

    res
      .status(200)
      .json({ success: true, message: "Course updated successfully!", course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found!" });
    }

    if (
      course.teacher.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this course!",
      });
    }

    course.status = "deleted"; // Mark as deleted instead of removing from DB
    await course.save();

    res
      .status(200)
      .json({ success: true, message: "Course deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCourseStats = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate("reviews")
      .populate("studentsEnrolled");

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found!" });
    }

    // Calculate stats like average rating, number of enrolled students, etc.
    const totalStudents = course.studentsEnrolled.length;
    const averageRating =
      course.reviews.reduce((acc, review) => acc + review.rating, 0) /
      course.reviews.length;

    res.status(200).json({
      success: true,
      courseId: course._id,
      totalStudents,
      averageRating,
      numberOfReviews: course.reviews.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCourse,
  updateCourse,
  approveCourse,
  rejectCourse,
  deleteCourse,
  getCourseStats,
};
