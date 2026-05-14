import db from "../db.js";

// @desc    Get all donations (admin only)
// @route   GET /api/admin/donations
// @access  Private/Admin
export const getAllDonations = async (req, res) => {
  try {
    const distributableOnly = req.query.distributable === "1";

    const whereClause = distributableOnly
      ? `WHERE d.status IN ('approved', 'partially_distributed')`
      : "";

    const result = await db.query(`
      SELECT
        d.donation_id,
        u.name         AS donor_name,
        u.email,
        dt.type_name,
        d.amount,
        d.remaining_amount,
        d.date,
        d.status,
        d.campaign_id
      FROM Donation d
      JOIN Users         u  ON d.user_id         = u.user_id
      JOIN Donation_Type dt ON d.donation_type_id = dt.donation_type_id
      ${whereClause}
      ORDER BY d.date DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      donations: result.rows,
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

    const donation = await db.query(
      `SELECT d.*, c.target_amount, c.amount_raised 
       FROM Donation d
       LEFT JOIN Campaign c ON d.campaign_id = c.campaign_id
       WHERE d.donation_id = $1`,
      [donation_id]
    );
    if (donation.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    const donationData = donation.rows[0];

    if (donationData.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Donation already ${donationData.status}. Cannot approve.`,
      });
    }

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

    await db.query(
      "UPDATE Donation SET status = 'approved' WHERE donation_id = $1",
      [donation_id]
    );

    if (donationData.campaign_id) {
      await db.query(
        "UPDATE Campaign SET amount_raised = amount_raised + $1 WHERE campaign_id = $2",
        [donationData.amount, donationData.campaign_id]
      );
    }

    if (donationData.orphanage_id) {
      let quantity = 1;
      const donationTypeId = donationData.donation_type_id;

      if (donationTypeId === 4) {
        const clothesSum = await db.query(
          "SELECT SUM(quantity) as total FROM Clothes WHERE donation_id = $1",
          [donation_id]
        );
        quantity = clothesSum.rows[0].total || 1;
      } else if (donationTypeId === 5) {
        const booksSum = await db.query(
          "SELECT SUM(quantity) as total FROM Books WHERE donation_id = $1",
          [donation_id]
        );
        quantity = booksSum.rows[0].total || 1;
      } else {
        quantity = donationData.amount || 1;
      }

      await db.query(
        `INSERT INTO Distribution (donation_id, orphanage_id, date, quantity)
         VALUES ($1, $2, CURRENT_DATE, $3)`,
        [donation_id, donationData.orphanage_id, quantity]
      );
    }

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

// @desc    Reject a donation (admin only)
// @route   PUT /api/admin/donations/:id/reject
// @access  Private/Admin
export const rejectDonation = async (req, res) => {
  try {
    const donation_id = req.params.id;

    const donation = await db.query(
      "SELECT * FROM Donation WHERE donation_id = $1",
      [donation_id]
    );
    if (donation.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }

    await db.query(
      "UPDATE Donation SET status = 'rejected' WHERE donation_id = $1",
      [donation_id]
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
    const result = await db.query(`
      SELECT user_id, name, email, phone, role
      FROM Users
      ORDER BY user_id
    `);

    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
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

    const user = await db.query(
      "SELECT * FROM Users WHERE user_id = $1",
      [user_id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user_id == req.user.user_id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own admin account",
      });
    }

    await db.query("DELETE FROM Users WHERE user_id = $1", [user_id]);

    res.json({ success: true, message: "User deleted successfully" });
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
    const totalMoney = await db.query(`
      SELECT SUM(amount) as total 
      FROM Donation 
      WHERE donation_type_id IN (1,2,3) AND status = 'approved'
    `);

    const totalDonations = await db.query(`
      SELECT COUNT(*) as count 
      FROM Donation 
      WHERE status = 'approved'
    `);

    const pendingDonations = await db.query(`
      SELECT COUNT(*) as count 
      FROM Donation 
      WHERE status = 'pending'
    `);

    const totalUsers = await db.query(`
      SELECT COUNT(*) as count 
      FROM Users
    `);

    const byType = await db.query(`
      SELECT dt.type_name, COUNT(*) as count, SUM(d.amount) as total_amount
      FROM Donation d
      JOIN Donation_Type dt ON d.donation_type_id = dt.donation_type_id
      WHERE d.status = 'approved'
      GROUP BY dt.type_name
    `);

    res.json({
      success: true,
      stats: {
        total_money_collected: totalMoney.rows[0].total || 0,
        total_donations_count: totalDonations.rows[0].count || 0,
        pending_donations: pendingDonations.rows[0].count || 0,
        total_users: totalUsers.rows[0].count || 0,
        donations_by_type: byType.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create a distribution (admin only)
// @route   POST /api/admin/distribution
// @access  Private/Admin
export const createDistribution = async (req, res) => {
  try {
    const { donation_id, receiver_id, orphanage_id, quantity } = req.body;

    const donation = await db.query(
      "SELECT * FROM Donation WHERE donation_id = $1 AND status IN ('approved', 'partially_distributed')",
      [donation_id]
    );
    if (donation.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Donation not found or not in a distributable state (must be approved or partially_distributed)",
      });
    }

    const donationData = donation.rows[0];
    let availableQty = null;
    const isMoneyDonation = [1, 2, 3].includes(donationData.donation_type_id);

    if (isMoneyDonation) {
      availableQty = donationData.remaining_amount || 0;
    } else if (donationData.donation_type_id === 4) {
      const clothes = await db.query(
        "SELECT SUM(quantity) as total FROM Clothes WHERE donation_id = $1",
        [donation_id]
      );
      availableQty = clothes.rows[0].total || 0;
    } else if (donationData.donation_type_id === 5) {
      const books = await db.query(
        "SELECT SUM(quantity) as total FROM Books WHERE donation_id = $1",
        [donation_id]
      );
      availableQty = books.rows[0].total || 0;
    }

    if (!availableQty || availableQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "No remaining quantity to distribute",
      });
    }
    if (quantity > availableQty) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${quantity}) exceeds available (${availableQty})`,
      });
    }

    if ((receiver_id && orphanage_id) || (!receiver_id && !orphanage_id)) {
      return res.status(400).json({
        success: false,
        message: "Provide either receiver_id or orphanage_id, not both, not none.",
      });
    }

    if (receiver_id) {
      const receiver = await db.query(
        "SELECT * FROM receiver WHERE receiver_id = $1",
        [receiver_id]
      );
      if (receiver.rows.length === 0)
        return res.status(404).json({ success: false, message: "Receiver not found" });
    }
    if (orphanage_id) {
      const orphanage = await db.query(
        "SELECT * FROM Orphanage WHERE orphanage_id = $1",
        [orphanage_id]
      );
      if (orphanage.rows.length === 0)
        return res.status(404).json({ success: false, message: "Orphanage not found" });
    }

    const result = await db.query(
      `INSERT INTO Distribution (donation_id, receiver_id, orphanage_id, date, quantity)
       VALUES ($1, $2, $3, CURRENT_DATE, $4)
       RETURNING distribution_id`,
      [donation_id, receiver_id || null, orphanage_id || null, quantity]
    );

    if (isMoneyDonation) {
      const newRemaining = donationData.remaining_amount - quantity;
      if (newRemaining <= 0) {
        await db.query(
          "UPDATE Donation SET remaining_amount = 0, status = 'distributed' WHERE donation_id = $1",
          [donation_id]
        );
      } else {
        await db.query(
          "UPDATE Donation SET remaining_amount = $1, status = 'partially_distributed' WHERE donation_id = $2",
          [newRemaining, donation_id]
        );
      }
    } else {
      await db.query(
        "UPDATE Donation SET status = 'distributed' WHERE donation_id = $1",
        [donation_id]
      );
    }

    res.status(201).json({
      success: true,
      message: "Distribution created successfully",
      distribution_id: result.rows[0].distribution_id,
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
    const result = await db.query(`
      SELECT dist.*,
             COALESCE(r.name, o.name) as receiver_name,
             CASE
               WHEN dist.receiver_id IS NOT NULL THEN 'general'
               WHEN dist.orphanage_id IS NOT NULL THEN 'orphanage'
             END as receiver_type
      FROM Distribution dist
      LEFT JOIN receiver r ON dist.receiver_id = r.receiver_id
      LEFT JOIN Orphanage o ON dist.orphanage_id = o.orphanage_id
      ORDER BY dist.date DESC
    `);
    res.json({ success: true, count: result.rows.length, distributions: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create a campaign
// @route   POST /api/admin/campaigns
// @access  Private/Admin
export const createCampaign = async (req, res) => {
  try {
    const { title, description, target_amount, end_date } = req.body;

    const maxId = await db.query("SELECT MAX(campaign_id) as maxId FROM Campaign");
    const campaign_id = (maxId.rows[0].maxid || 0) + 1;

    await db.query(
      "INSERT INTO Campaign (campaign_id, title, description, target_amount, end_date) VALUES ($1, $2, $3, $4, $5)",
      [campaign_id, title, description, target_amount, end_date]
    );

    res.status(201).json({ success: true, message: "Campaign created", campaign_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Update a campaign
// @route   PUT /api/admin/campaigns/:id
// @access  Private/Admin
export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, target_amount, end_date } = req.body;

    await db.query(
      "UPDATE Campaign SET title = $1, description = $2, target_amount = $3, end_date = $4 WHERE campaign_id = $5",
      [title, description, target_amount, end_date, id]
    );

    res.json({ success: true, message: "Campaign updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Delete a campaign
// @route   DELETE /api/admin/campaigns/:id
// @access  Private/Admin
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM Campaign WHERE campaign_id = $1", [id]);

    res.json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all campaigns (admin)
// @route   GET /api/admin/campaigns
// @access  Private/Admin
export const getAllCampaigns = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.campaign_id,
        c.title,
        c.description,
        c.target_amount,
        c.end_date,
        COALESCE(c.amount_raised, 0) as amount_raised,
        CASE 
          WHEN c.end_date < CURRENT_DATE THEN 'expired'
          WHEN COALESCE(c.amount_raised, 0) >= c.target_amount THEN 'completed'
          ELSE 'active'
        END as status
      FROM Campaign c
      ORDER BY c.campaign_id
    `);

    res.json({ success: true, campaigns: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all receivers (general receivers only – not orphanages)
// @route   GET /api/admin/receivers
export const getAllReceivers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT receiver_id, name, location, contact_info, sufficiency, needs_description, priority
      FROM receiver
      ORDER BY receiver_id
    `);
    res.json({ success: true, count: result.rows.length, receivers: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create a general receiver (not orphanage)
// @route   POST /api/admin/receivers
// @access  Private/Admin
export const createReceiver = async (req, res) => {
  try {
    const { name, location, contact_info, sufficiency, needs_description, priority } = req.body;

    const result = await db.query(
      `INSERT INTO receiver (name, location, contact_info, sufficiency, needs_description, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING receiver_id`,
      [
        name,
        location,
        contact_info,
        sufficiency || "not_self_sufficient",
        needs_description || null,
        priority || "medium",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Receiver created",
      receiver_id: result.rows[0].receiver_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Delete a receiver
// @route   DELETE /api/admin/receivers/:id
// @access  Private/Admin
export const deleteReceiver = async (req, res) => {
  try {
    const { id } = req.params;

    const dist = await db.query(
      "SELECT * FROM Distribution WHERE receiver_id = $1",
      [id]
    );
    if (dist.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: receiver has distributions",
      });
    }

    await db.query("DELETE FROM receiver WHERE receiver_id = $1", [id]);
    res.json({ success: true, message: "Receiver deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all orphanages (admin)
// @route   GET /api/admin/orphanages
// @access  Private/Admin
export const getAllOrphanages = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT orphanage_id, name, location, contact_info
      FROM Orphanage
      ORDER BY orphanage_id
    `);

    res.json({ success: true, count: result.rows.length, orphanages: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create orphanage
// @route   POST /api/admin/orphanages
// @access  Private/Admin
export const createOrphanage = async (req, res) => {
  try {
    const { name, location, contact_info } = req.body;

    const result = await db.query(
      "INSERT INTO Orphanage (name, location, contact_info) VALUES ($1, $2, $3) RETURNING orphanage_id",
      [name, location, contact_info]
    );

    res.status(201).json({
      success: true,
      message: "Orphanage created",
      orphanage_id: result.rows[0].orphanage_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};

// @desc    Create a new intern (admin)
// @route   POST /api/admin/interns
// @access  Private/Admin
export const createIntern = async (req, res) => {
  try {
    const { name, role, assigned_task, end_date, user_id } = req.body;

    const result = await db.query(
      `INSERT INTO Intern (user_id, name, role, assigned_task, end_date, status)
       VALUES ($1, $2, $3, $4, $5, 'approved')
       RETURNING intern_id`,
      [user_id || null, name, role, assigned_task, end_date]
    );

    res.status(201).json({
      success: true,
      message: "Intern created",
      intern_id: result.rows[0].intern_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Update an intern (admin)
// @route   PUT /api/admin/interns/:id
// @access  Private/Admin
export const updateIntern = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, assigned_task, end_date } = req.body;

    await db.query(
      "UPDATE Intern SET name = $1, role = $2, assigned_task = $3, end_date = $4 WHERE intern_id = $5",
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
// @access  Private/Admin
export const deleteIntern = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM Intern WHERE intern_id = $1", [id]);

    res.json({ success: true, message: "Intern deleted" });
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

    await db.query(
      "UPDATE Orphanage SET name = $1, location = $2, contact_info = $3 WHERE orphanage_id = $4",
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

    const dist = await db.query(
      "SELECT * FROM Distribution WHERE orphanage_id = $1",
      [id]
    );
    if (dist.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete orphanage with existing distributions. Transfer or remove distributions first.",
      });
    }

    await db.query("DELETE FROM Orphanage WHERE orphanage_id = $1", [id]);
    res.json({ success: true, message: "Orphanage deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get all intern applications (pending first, then others)
// @route   GET /api/admin/intern-applications
// @access  Private/Admin
export const getAllInternApplications = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, u.email
      FROM Intern i
      JOIN Users u ON i.user_id = u.user_id
      ORDER BY
        CASE i.status
          WHEN 'pending'  THEN 1
          WHEN 'approved' THEN 2
          WHEN 'rejected' THEN 3
          ELSE 4
        END,
        i.applied_at ASC
    `);
    res.json({ success: true, applications: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Approve intern application
// @route   PUT /api/admin/intern-applications/:id/approve
// @access  Private/Admin
export const approveInternApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const app = await db.query(
      "SELECT * FROM Intern WHERE intern_id = $1",
      [id]
    );
    if (app.rows.length === 0)
      return res.status(404).json({ success: false, message: "Application not found" });
    if (app.rows[0].status !== "pending")
      return res.status(400).json({ success: false, message: "Application already processed" });

    await db.query(
      "UPDATE Intern SET status = 'approved' WHERE intern_id = $1",
      [id]
    );
    res.json({ success: true, message: "Application approved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Reject intern application
// @route   PUT /api/admin/intern-applications/:id/reject
// @access  Private/Admin
export const rejectInternApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejected_reason } = req.body;

    const app = await db.query(
      "SELECT * FROM Intern WHERE intern_id = $1",
      [id]
    );
    if (app.rows.length === 0)
      return res.status(404).json({ success: false, message: "Application not found" });
    if (app.rows[0].status !== "pending")
      return res.status(400).json({ success: false, message: "Application already processed" });

    await db.query(
      "UPDATE Intern SET status = 'rejected', rejected_reason = $1 WHERE intern_id = $2",
      [rejected_reason || null, id]
    );
    res.json({ success: true, message: "Application rejected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllInterns = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM Intern ORDER BY end_date ASC"
    );
    res.json({ success: true, count: result.rows.length, interns: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};