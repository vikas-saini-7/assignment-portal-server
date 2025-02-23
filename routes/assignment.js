const express = require("express");
const router = express.Router();
const uploadOnCloudinary = require("../utils/uploadOnCloudinary");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Teacher = require("../models/Teacher");
const SubmittedAssignment = require("../models/SubmittedAssignment");
const Student = require("../models/Student");

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// To get all submitted assignment as a student
router.post("/submittedassignment", async (req, res) => {
  /*  if (req.query.role !== "student") {
    return res.status(403).json({ error: "Unauthorized access" });
  } */
  try {
    const { studentId } = req.body;

    console.log("studentId:", studentId);
    if (!studentId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const studentDoc = await Student.findOne({ studentId });

    if (!studentDoc) {
      return res.status(404).json({ error: "Student not found" });
    }

    const submissionsIdArr = studentDoc.submittedAssignment; // arrays of submissions id

    console.log(submissionsIdArr);
    const submissionsArr = [];

    submissionsIdArr?.forEach(async (submissionId) => {
      const submissionDoc = await SubmittedAssignment.findById(submissionId);
      submissionsArr.push(submissionDoc);
    });

    res.status(200).json(submissionsArr);
    
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "Failed to get all assignment as a student" });
  }
});

// POST - /api/assignment/?role=teacher --> for uploading assignment
/* router.post("/", (req, res) => {
  if (req.query.role !== "teacher") {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    // Call multer manually to handle file upload
    upload.single("file")(req, res, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ err });
      }

      const {title} = req.body;

      console.log("uploadedAssignment", req.file.path);
      const URL = await uploadOnCloudinary(req.file.path);

      const assignmentDoc = await Assignment.create({
        file: URL,
        title: title,
      });

      console.log("assign", assignmentDoc);
      const courseDoc = await Course.updateOne(
        {
          _id: "65a049c12de4d08cd7848bcb",
        },
        { $push: { assignments: assignmentDoc._id } }
      );

      console.log("course", courseDoc);
      res.json({ URL: assignmentDoc.file });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create assignment as a teacher" });
  }
}); */

router.post("/", upload.single("file"), async (req, res) => {
  if (req.query.role !== "teacher") {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    const { title, courseId, endDate, teacherId } = req.body;
    console.log( title, courseId, endDate, teacherId)
    const result = await cloudinary.uploader
      .upload_stream(
        {
          /* Cloudinary options */
        },
        async (error, result) => {
          if (error) {
            console.error(error);
            res.status(500).json({ error });
          } else {
            // You can now handle the Cloudinary result, e.g., store the URL or public ID in MongoDB.
            console.log(result);
            const URL = result.secure_url;
            console.log("URL", URL)
            const courseDocById = await Course.findById(courseId);
            const assignmentDoc = await Assignment.create({
              file: URL,
              title: title,
              startDate: new Date(),
              endDate: endDate,
              course: courseDocById._id,
              createdBy: teacherId,
            });

            console.log("assign", assignmentDoc);
            const courseDoc = await Course.updateOne(
              {
                _id: courseId,
              },
              { $push: { assignments: assignmentDoc._id } }
            );

            console.log("course", courseDoc);
            res.status(200).json({ URL: result.secure_url });
          }
        }
      )
      .end(req.file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* router.post("/",upload.single("file") ,async (req, res) => {
  if (req.query.role !== "teacher") {
    return res.status(403).json({ error: "Unauthorized access" });
  }
  
  console.log("here");

  try {

    const { title } = req.body;
    console.log(title);
    console.log(req.file.buffer);

    const URL = await uploadOnCloudinary(req.file.buffer);

    console.log(URL);
    const assignmentDoc = await Assignment.create({
      file: URL,
      title: title,
    });

    console.log("assign", assignmentDoc);
    const courseDoc = await Course.updateOne(
      {
        _id: "65a049c12de4d08cd7848bcb",
      },
      { $push: { assignments: assignmentDoc._id } }
    );

    console.log("course", courseDoc);

    res.status(200).json({ URL });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
}); */

// GET - /api/assignments/for getting all assignment as a teacher and student both
router.get("/", async (req, res) => {
  try {
    // Retrieve all assignments from the database as a teacher
    const assignments = await Assignment.find();
    res.json(assignments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to get assignment" });
  }
});

// GET - /api/assignments/:assignmentId/ --> for getting a assignment as a teacher and student both
router.get("/:assignmentId", async (req, res) => {
  if (req.query.role !== "teacher") {
    return res.status(403).json({ error: "Unauthorized access" });
  }
  const { assignmentId } = req.params;
  try {
    // Retrieve a assignment from the database as a teacher
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json(course);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to get assignment by provided ID" });
  }
});

// STUDENTS
router.post(
  "/submitassignment/:assignmentId",
  upload.single("file"),
  async (req, res) => {
    if (req.query.role !== "student") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    try {
      const { assignmentId } = req.params;
      const { studentId, title } = req.body;
      console.log("uploadedAssignment", assignmentId);
      console.log("stud Id", studentId);

      const result = await cloudinary.uploader
        .upload_stream({}, async (error, result) => {
          if (error) {
            console.error(error);
            res.status(500).json({ error });
          } else {
            console.log(result);
            const URL = result.secure_url;
            console.log("URL:", URL)

            const submittedAssignmentDoc = await SubmittedAssignment.create({
              submittedBy: studentId,
              file: URL,
              title: title,
              submissionDate: new Date(),
              assignment: assignmentId,
            });

            console.log("submittedAssignment", submittedAssignmentDoc);

            const assignmentDoc = await Assignment.updateOne(
              {
                _id: assignmentId,
              },
              { $push: { submissions: submittedAssignmentDoc._id } }
            );

            console.log("assignment", assignmentDoc);

            const studentDoc = await Student.updateOne(
              {
                studentId,
              },
              { $push: { submittedAssignment: submittedAssignmentDoc._id } }
            );
            console.log("studentDoc",studentDoc);

            res.status(200).json({ URL: submittedAssignmentDoc.file });
          }
        })
        .end(req.file.buffer);

      // Call multer manually to handle file upload
      // upload.single("file")(req, res, async (err) => {
      //   if (err) {
      //     console.error(err);
      //     return res.status(500).json({ error: "Failed to handle file upload" });
      //   }

      //   const URL = await uploadOnCloudinary(req.file.path);

      //   // shyd submittedAssignment mein isse assignment hata dena chahiye
      //   const submittedAssignmentDoc = await SubmittedAssignment.create({
      //     submittedBy: studentId,
      //     file: URL,
      //     title: "FIRST SUBMITTED ASSIGNMENT",
      //     submissionDate: new Date(),
      //     assignment: assignmentId,
      //   });

      //   console.log("submittedAssignment", submittedAssignmentDoc);

      //   const assignmentDoc = await Assignment.updateOne(
      //     {
      //       _id: assignmentId,
      //     },
      //     { $push: { submissions: submittedAssignmentDoc._id } }
      //   );

      //   console.log("assignment", assignmentDoc);

      //   const studentDoc = await Student.updateOne(
      //     {
      //       studentId,
      //     },
      //     { $push: { submittedAssignment: submittedAssignmentDoc._id } }
      //   );

      //   res.json({ URL: submittedAssignmentDoc.file });

      // });
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ error: err.message });
    }
  }
);

module.exports = router;
