import db from "../db.js";

// @desc    User applies for internship
// @route   POST /api/interns/apply
// @access  Private
export const applyForInternship = async (req, res) => {
  try {
    const { role, assigned_task, end_date } = req.body;
    const user_id = req.user.user_id;
    const userName = req.user.name; // from JWT (set during login/register)
    const promiseDb = db.promise();

    if (!role || !assigned_task || !end_date) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Role, assigned task, and end date are required",
        });
    }

    // Insert application (status defaults to 'pending')
    await promiseDb.query(
      `INSERT INTO Intern (user_id, name, role, assigned_task, end_date, status, applied_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [user_id, userName, role, assigned_task, end_date],
    );

    res
      .status(201)
      .json({ success: true, message: "Application submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    User views their own applications
// @route   GET /api/interns/my-applications
// @access  Private
export const getMyApplications = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const promiseDb = db.promise();
    const [applications] = await promiseDb.query(
      `SELECT intern_id, role, assigned_task, end_date, status, applied_at, rejected_reason
       FROM Intern WHERE user_id = ? ORDER BY applied_at DESC`,
      [user_id],
    );
    res.json({ success: true, applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
