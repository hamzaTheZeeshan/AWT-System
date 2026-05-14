import db from "../db.js";

// @desc    User applies for internship
// @route   POST /api/interns/apply
// @access  Private
export const applyForInternship = async (req, res) => {
  try {
    const { role, assigned_task, end_date } = req.body;
    const user_id = req.user.user_id;

    if (!role || !assigned_task || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Role, assigned task, and end date are required",
      });
    }

    const userRows = await db.query(
      "SELECT name FROM Users WHERE user_id = $1",
      [user_id]
    );

    if (!userRows.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userName = userRows.rows[0].name;

    await db.query(
      `INSERT INTO Intern 
       (user_id, name, role, assigned_task, end_date, status, applied_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
      [user_id, userName, role, assigned_task, end_date]
    );

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("applyForInternship error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    User views their own applications
// @route   GET /api/interns/my-applications
// @access  Private
export const getMyApplications = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const applications = await db.query(
      `SELECT intern_id, role, assigned_task, end_date, status, applied_at, rejected_reason
       FROM Intern 
       WHERE user_id = $1 
       ORDER BY applied_at DESC`,
      [user_id]
    );

    return res.json({
      success: true,
      applications: applications.rows,
    });
  } catch (error) {
    console.error("getMyApplications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};