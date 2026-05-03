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

    // 1. Fetch donation details (including orphanage_id)
    const [donation] = await promiseDb.query(
      `SELECT d.*, c.target_amount, c.amount_raised 
       FROM Donation d
       LEFT JOIN Campaign c ON d.campaign_id = c.campaign_id
       WHERE d.donation_id = ?`,
      [donation_id],
    );
    if (donation.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }

    const donationData = donation[0];

    // 2. If already approved or distributed, reject
    if (donationData.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Donation already ${donationData.status}. Cannot approve.`,
      });
    }

    // 3. For campaign donations: check if amount would exceed target
    if (donationData.campaign_id) {
      const remaining =
        donationData.target_amount - (donationData.amount_raised || 0);
      if (donationData.amount > remaining) {
        return res.status(400).json({
          success: false,
          message: `Approving this donation would exceed campaign target. Remaining need: ${remaining}`,
        });
      }
    }

    // 4. Update donation status to 'approved'
    await promiseDb.query(
      "UPDATE Donation SET status = 'approved' WHERE donation_id = ?",
      [donation_id],
    );

    // 5. If campaign donation: increment campaign amount_raised
    if (donationData.campaign_id) {
      await promiseDb.query(
        "UPDATE Campaign SET amount_raised = amount_raised + ? WHERE campaign_id = ?",
        [donationData.amount, donationData.campaign_id],
      );
    }

    // 6. If orphanage donation (orphanage_id exists): auto-create Distribution record
    if (donationData.orphanage_id) {
      // Get next distribution_id
      const [maxId] = await promiseDb.query(
        "SELECT MAX(distribution_id) as maxId FROM Distribution",
      );
      const distribution_id = (maxId[0].maxId || 0) + 1;

      // quantity: if clothes/books, sum from Clothes/Books; else use amount or 1
      let quantity = 1;
      const donationTypeId = donationData.donation_type_id;
      if (donationTypeId === 4) {
        // Clothes
        const [clothesSum] = await promiseDb.query(
          "SELECT SUM(quantity) as total FROM Clothes WHERE donation_id = ?",
          [donation_id],
        );
        quantity = clothesSum[0].total || 1;
      } else if (donationTypeId === 5) {
        // Books
        const [booksSum] = await promiseDb.query(
          "SELECT SUM(quantity) as total FROM Books WHERE donation_id = ?",
          [donation_id],
        );
        quantity = booksSum[0].total || 1;
      } else {
        quantity = donationData.amount || 1;
      }

      // Insert into Distribution using orphanage_id (no receiver_id)
      await promiseDb.query(
        `INSERT INTO Distribution (distribution_id, donation_id, orphanage_id, date, quantity)
         VALUES (?, ?, ?, CURDATE(), ?)`,
        [distribution_id, donation_id, donationData.orphanage_id, quantity],
      );
    }

    // 7. Return success
    res.json({
      success: true,
      message: "Donation approved successfully",
      donation_id: donation_id,
      status: "approved",
      ...(donationData.campaign_id && { campaign_updated: true }),
      ...(donationData.orphanage_id && { distribution_created: true }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


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
      donation_id,
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
            SELECT user_id, name, email, phone, role
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
      return res.status(400).json({
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
    const { donation_id, receiver_id, orphanage_id, quantity } = req.body;
    const promiseDb = db.promise();

    // 1. Check if donation exists and is approved
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

    // 2. Validate that exactly one destination is provided
    if ((receiver_id && orphanage_id) || (!receiver_id && !orphanage_id)) {
      return res.status(400).json({
        success: false,
        message:
          "Provide either receiver_id (for general receiver) or orphanage_id (for orphanage), not both, not none.",
      });
    }

    // 3. Validate the destination exists
    if (receiver_id) {
      const [receiver] = await promiseDb.query(
        "SELECT * FROM Reciever WHERE receiver_id = ?",
        [receiver_id],
      );
      if (receiver.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Receiver not found" });
      }
    }
    if (orphanage_id) {
      const [orphanage] = await promiseDb.query(
        "SELECT * FROM Orphanage WHERE orphanage_id = ?",
        [orphanage_id],
      );
      if (orphanage.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Orphanage not found" });
      }
    }

    // 4. Check available quantity (same as before)
    let availableQty = null;
    const donationTypeId = donation[0].donation_type_id;
    if (donationTypeId === 4) {
      const [clothes] = await promiseDb.query(
        "SELECT SUM(quantity) as total FROM Clothes WHERE donation_id = ?",
        [donation_id],
      );
      availableQty = clothes[0].total || 0;
    } else if (donationTypeId === 5) {
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

    // 5. Get next distribution_id
    const [maxId] = await promiseDb.query(
      "SELECT MAX(distribution_id) as maxId FROM Distribution",
    );
    const distribution_id = (maxId[0].maxId || 0) + 1;

    // 6. Insert distribution (set only the appropriate column)
    await promiseDb.query(
      `INSERT INTO Distribution (distribution_id, donation_id, receiver_id, orphanage_id, date, quantity)
       VALUES (?, ?, ?, ?, CURDATE(), ?)`,
      [
        distribution_id,
        donation_id,
        receiver_id || null,
        orphanage_id || null,
        quantity,
      ],
    );

    // 7. Update donation status to distributed
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
      SELECT dist.*, 
             COALESCE(r.name, o.name) as receiver_name,
             CASE 
               WHEN dist.receiver_id IS NOT NULL THEN 'general'
               WHEN dist.orphanage_id IS NOT NULL THEN 'orphanage'
             END as receiver_type
      FROM Distribution dist
      LEFT JOIN Reciever r ON dist.receiver_id = r.receiver_id
      LEFT JOIN Orphanage o ON dist.orphanage_id = o.orphanage_id
      ORDER BY dist.date DESC
    `);
    res.json({ success: true, count: distributions.length, distributions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create a campaign
// @route   POST /api/admin/campaigns
export const createCampaign = async (req, res) => {
  try {
    const { title, description, target_amount, end_date } = req.body;
    const promiseDb = db.promise();
    const [maxId] = await promiseDb.query(
      "SELECT MAX(campaign_id) as maxId FROM Campaign",
    );
    const campaign_id = (maxId[0].maxId || 0) + 1;
    await promiseDb.query(
      "INSERT INTO Campaign (campaign_id, title, description, target_amount, end_date) VALUES (?, ?, ?, ?, ?)",
      [campaign_id, title, description, target_amount, end_date],
    );
    res
      .status(201)
      .json({ success: true, message: "Campaign created", campaign_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Update a campaign
// @route   PUT /api/admin/campaigns/:id
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, target_amount, end_date } = req.body;
    const promiseDb = db.promise();
    await promiseDb.query(
      "UPDATE Campaign SET title = ?, description = ?, target_amount = ?, end_date = ? WHERE campaign_id = ?",
      [title, description, target_amount, end_date, id],
    );
    res.json({ success: true, message: "Campaign updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Delete a campaign
// @route   DELETE /api/admin/campaigns/:id
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const promiseDb = db.promise();
    await promiseDb.query("DELETE FROM Campaign WHERE campaign_id = ?", [id]);
    res.json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all campaigns (admin)
// @route   GET /api/admin/campaigns
export const getAllCampaigns = async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [campaigns] = await promiseDb.query(`
      SELECT 
        c.campaign_id,
        c.title,
        c.description,
        c.target_amount,
        c.end_date,
        COALESCE(c.amount_raised, 0) as amount_raised,
        CASE 
          WHEN c.end_date < CURDATE() THEN 'expired'
          WHEN COALESCE(c.amount_raised, 0) >= c.target_amount THEN 'completed'
          ELSE 'active'
        END as status
      FROM Campaign c
      ORDER BY c.campaign_id
    `);
    res.json({ success: true, campaigns });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all receivers (with orphanage flag)
// @desc    Get all receivers (with orphanage flag and sufficiency)
// @desc    Get all receivers (with orphanage flag and sufficiency)
// @desc    Get all receivers (general receivers only – not orphanages)
// @route   GET /api/admin/receivers
export const getAllReceivers = async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [receivers] = await promiseDb.query(`
      SELECT receiver_id, name, location, contact_info, 
             sufficiency, needs_description, priority
      FROM Reciever
      ORDER BY receiver_id
    `);
    res.json({ success: true, receivers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create a general receiver (not orphanage)
// @desc    Create a general receiver (not orphanage)
export const createReceiver = async (req, res) => {
  try {
    const {
      name,
      location,
      contact_info,
      sufficiency,
      needs_description,
      priority,
    } = req.body;
    const promiseDb = db.promise();
    const [maxId] = await promiseDb.query(
      "SELECT MAX(receiver_id) as maxId FROM Reciever",
    );
    const receiver_id = (maxId[0].maxId || 0) + 1;
    await promiseDb.query(
      `INSERT INTO Reciever (receiver_id, name, location, contact_info, sufficiency, needs_description, priority) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        receiver_id,
        name,
        location,
        contact_info,
        sufficiency || "not_self_sufficient",
        needs_description || null,
        priority || "medium",
      ],
    );
    res
      .status(201)
      .json({ success: true, message: "Receiver created", receiver_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Delete a receiver (only if no distributions? We'll allow cascade but warn)
export const deleteReceiver = async (req, res) => {
  try {
    const { id } = req.params;
    const promiseDb = db.promise();

    // Check if receiver has any distributions
    const [dist] = await promiseDb.query(
      "SELECT * FROM Distribution WHERE receiver_id = ?",
      [id],
    );
    if (dist.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: receiver has distributions",
      });
    }

    // Delete only from Reciever (orphanages are separate)
    await promiseDb.query("DELETE FROM Reciever WHERE receiver_id = ?", [id]);

    res.json({ success: true, message: "Receiver deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create orphanage (adds to Reciever and Orphanage)
// @desc    Create orphanage (adds to Reciever and Orphanage)
export const createOrphanage = async (req, res) => {
  try {
    const { name, location, contact_info } = req.body;
    const promiseDb = db.promise();

    // Insert directly into Orphanage table (orphanage_id auto-increments)
    const [result] = await promiseDb.query(
      "INSERT INTO Orphanage (name, location, contact_info) VALUES (?, ?, ?)",
      [name, location, contact_info],
    );

    res.status(201).json({
      success: true,
      message: "Orphanage created",
      orphanage_id: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error",
        details: error.message,
      });
  }
};

// @desc    Get all interns (admin)
// @route   GET /api/admin/interns
export const getAllInterns = async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [interns] = await promiseDb.query(
      "SELECT * FROM Intern ORDER BY end_date ASC"
    );
    res.json({ success: true, count: interns.length, interns });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create a new intern (admin)
// @route   POST /api/admin/interns
export const createIntern = async (req, res) => {
  try {
    const { name, role, assigned_task, end_date } = req.body;
    const promiseDb = db.promise();
    const [maxId] = await promiseDb.query("SELECT MAX(intern_id) as maxId FROM Intern");
    const intern_id = (maxId[0].maxId || 0) + 1;
    await promiseDb.query(
      "INSERT INTO Intern (intern_id, name, role, assigned_task, end_date) VALUES (?, ?, ?, ?, ?)",
      [intern_id, name, role, assigned_task, end_date]
    );
    res.status(201).json({ success: true, message: "Intern created", intern_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Update an intern (admin)
// @route   PUT /api/admin/interns/:id
export const updateIntern = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, assigned_task, end_date } = req.body;
    const promiseDb = db.promise();
    await promiseDb.query(
      "UPDATE Intern SET name = ?, role = ?, assigned_task = ?, end_date = ? WHERE intern_id = ?",
      [name, role, assigned_task, end_date, id]
    );
    res.json({ success: true, message: "Intern updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Delete an intern (admin)
// @route   DELETE /api/admin/interns/:id
export const deleteIntern = async (req, res) => {
  try {
    const { id } = req.params;
    const promiseDb = db.promise();
    await promiseDb.query("DELETE FROM Intern WHERE intern_id = ?", [id]);
    res.json({ success: true, message: "Intern deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all orphanages (admin only)
// @route   GET /api/admin/orphanages
export const getAllOrphanages = async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [orphanages] = await promiseDb.query(
      "SELECT orphanage_id, name, location, contact_info FROM Orphanage ORDER BY name"
    );
    res.json({ success: true, orphanages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Update orphanage (admin only)
// @route   PUT /api/admin/orphanages/:id
export const updateOrphanage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, contact_info } = req.body;
    const promiseDb = db.promise();
    await promiseDb.query(
      "UPDATE Orphanage SET name = ?, location = ?, contact_info = ? WHERE orphanage_id = ?",
      [name, location, contact_info, id]
    );
    res.json({ success: true, message: "Orphanage updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Delete orphanage (admin only)
// @route   DELETE /api/admin/orphanages/:id
export const deleteOrphanage = async (req, res) => {
  try {
    const { id } = req.params;
    const promiseDb = db.promise();
    // Check if orphanage has distributions
    const [dist] = await promiseDb.query(
      "SELECT * FROM Distribution WHERE orphanage_id = ?",
      [id]
    );
    if (dist.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete orphanage with existing distributions. Transfer or remove distributions first."
      });
    }
    await promiseDb.query("DELETE FROM Orphanage WHERE orphanage_id = ?", [id]);
    res.json({ success: true, message: "Orphanage deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};