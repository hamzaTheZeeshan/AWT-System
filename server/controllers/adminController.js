import db from "../db.js";

// @desc    Get all donations (admin only)
// @route   GET /api/admin/donations
// @access  Private/Admin
export const getAllDonations = async (req, res) => {
  try {
    const promiseDb = db.promise();

    const [donations] = await promiseDb.query(`
            SELECT d.donation_id, u.name as donor_name, u.email, dt.type_name, 
                   d.amount, d.date, d.status, d.campaign_id
            FROM Donation d
            JOIN Users u ON d.user_id = u.user_id
            JOIN Donation_Type dt ON d.donation_type_id = dt.donation_type_id
            ORDER BY d.date DESC
        `);

    res.json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Approve a donation (admin only)
// @route   PUT /api/admin/donations/:id/approve
// @access  Private/Admin
export const approveDonation = async (req, res) => {
  try {
    const donation_id = req.params.id;
    const promiseDb = db.promise();

    const [donation] = await promiseDb.query(
      "SELECT * FROM Donation WHERE donation_id = ?",
      [donation_id],
    );

    if (donation.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    await promiseDb.query(
      'UPDATE Donation SET status = "approved" WHERE donation_id = ?',
      [donation_id],
    );

    res.json({
      success: true,
      message: "Donation approved successfully",
      donation_id: donation_id,
      status: "approved",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Reject a donation (admin only)
// @route   PUT /api/admin/donations/:id/reject
// @access  Private/Admin
export const rejectDonation = async (req, res) => {
  try {
    const donation_id = req.params.id;
    const promiseDb = db.promise();

    const [donation] = await promiseDb.query(
      "SELECT * FROM Donation WHERE donation_id = ?",
      [donation_id],
    );

    if (donation.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    await promiseDb.query(
      'UPDATE Donation SET status = "rejected" WHERE donation_id = ?',
      [donation_id],
    );

    res.json({
      success: true,
      message: "Donation rejected successfully",
      donation_id: donation_id,
      status: "rejected",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const promiseDb = db.promise();

    const [users] = await promiseDb.query(`
            SELECT user_id, name, email, phone, role, created_at
            FROM Users
            ORDER BY user_id
        `);

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Delete a user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user_id = req.params.id;
    const promiseDb = db.promise();

    // Check if user exists
    const [user] = await promiseDb.query(
      "SELECT * FROM Users WHERE user_id = ?",
      [user_id],
    );

    if (user.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Don't allow admin to delete themselves
    if (user_id == req.user.user_id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot delete your own admin account",
        });
    }

    await promiseDb.query("DELETE FROM Users WHERE user_id = ?", [user_id]);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get donation statistics/reports (admin only)
// @route   GET /api/admin/reports/stats
// @access  Private/Admin
export const getStats = async (req, res) => {
  try {
    const promiseDb = db.promise();

    // Total donations amount (approved only)
    const [totalMoney] = await promiseDb.query(`
            SELECT SUM(amount) as total 
            FROM Donation 
            WHERE donation_type_id IN (1,2,3) AND status = 'approved'
        `);

    // Total number of donations
    const [totalDonations] = await promiseDb.query(`
            SELECT COUNT(*) as count 
            FROM Donation 
            WHERE status = 'approved'
        `);

    // Pending donations count
    const [pendingDonations] = await promiseDb.query(`
            SELECT COUNT(*) as count 
            FROM Donation 
            WHERE status = 'pending'
        `);

    // Total users count
    const [totalUsers] = await promiseDb.query(`
            SELECT COUNT(*) as count 
            FROM Users
        `);

    // Donation by type
    const [byType] = await promiseDb.query(`
            SELECT dt.type_name, COUNT(*) as count, SUM(d.amount) as total_amount
            FROM Donation d
            JOIN Donation_Type dt ON d.donation_type_id = dt.donation_type_id
            WHERE d.status = 'approved'
            GROUP BY dt.type_name
        `);

    res.json({
      success: true,
      stats: {
        total_money_collected: totalMoney[0].total || 0,
        total_donations_count: totalDonations[0].count || 0,
        pending_donations: pendingDonations[0].count || 0,
        total_users: totalUsers[0].count || 0,
        donations_by_type: byType,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Manage distribution (admin only)
// @route   POST /api/admin/distribution
// @access  Private/Admin
export const createDistribution = async (req, res) => {
  try {
    const { donation_id, receiver_id, quantity } = req.body;
    const promiseDb = db.promise();

    // Check if donation exists and is approved
    const [donation] = await promiseDb.query(
      'SELECT * FROM Donation WHERE donation_id = ? AND status = "approved"',
      [donation_id],
    );

    if (donation.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Approved donation not found",
      });
    }
    // Check available quantity for clothes/books
    let availableQty = null;
    const donationTypeId = donation[0].donation_type_id;

    if (donationTypeId === 4) {
      // Clothes
      const [clothes] = await promiseDb.query(
        "SELECT SUM(quantity) as total FROM Clothes WHERE donation_id = ?",
        [donation_id],
      );
      availableQty = clothes[0].total || 0;
    } else if (donationTypeId === 5) {
      // Books
      const [books] = await promiseDb.query(
        "SELECT SUM(quantity) as total FROM Books WHERE donation_id = ?",
        [donation_id],
      );
      availableQty = books[0].total || 0;
    } else {
      availableQty = donation[0].amount || 0;
    }

    if (quantity > availableQty) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${quantity}) exceeds available (${availableQty})`,
      });
    }

    // Get next distribution_id
    const [maxId] = await promiseDb.query(
      "SELECT MAX(distribution_id) as maxId FROM Distribution",
    );
    const distribution_id = (maxId[0].maxId || 0) + 1;

    // Create distribution record
    await promiseDb.query(
      `INSERT INTO Distribution (distribution_id, donation_id, receiver_id, date, quantity) 
             VALUES (?, ?, ?, CURDATE(), ?)`,
      [distribution_id, donation_id, receiver_id, quantity],
    );

    // Update donation status to distributed
    await promiseDb.query(
      'UPDATE Donation SET status = "distributed" WHERE donation_id = ?',
      [donation_id],
    );

    res.status(201).json({
      success: true,
      message: "Distribution created successfully",
      distribution_id: distribution_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all distributions (admin only)
// @route   GET /api/admin/distributions
// @access  Private/Admin
export const getAllDistributions = async (req, res) => {
  try {
    const promiseDb = db.promise();

    const [distributions] = await promiseDb.query(`
            SELECT dist.*, d.donation_id, dt.type_name, r.name as receiver_name
            FROM Distribution dist
            JOIN Donation d ON dist.donation_id = d.donation_id
            JOIN Donation_Type dt ON d.donation_type_id = dt.donation_type_id
            JOIN Reciever r ON dist.receiver_id = r.receiver_id
            ORDER BY dist.date DESC
        `);

    res.json({
      success: true,
      count: distributions.length,
      distributions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


//MANAGE DISTRIBUTION FUNCTION REMAINING!!!!!!