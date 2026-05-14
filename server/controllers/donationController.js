import db from "../db.js";

// Helper to get next ID
const getNextId = async (table, idColumn) => {
  const result = await db.query(
    `SELECT MAX(${idColumn}) as maxId FROM ${table}`
  );
  return (result.rows[0].maxid || 0) + 1;
};

// @desc    Create a donation
// @route   POST /api/donations/create
// @access  Private
export const createDonation = async (req, res) => {
  try {
    const donation_type_id = Number(req.body.donation_type_id);
    const amount = req.body.amount !== undefined && req.body.amount !== ""
      ? Number(req.body.amount)
      : null;
    const campaign_id = req.body.campaign_id ? Number(req.body.campaign_id) : null;
    const orphanage_id = req.body.orphanage_id ? Number(req.body.orphanage_id) : null;
    const { items } = req.body;
    const user_id = req.user.user_id;

    // --- 1. Validate donation type exists ---
    const typeCheck = await db.query(
      "SELECT * FROM Donation_Type WHERE donation_type_id = $1",
      [donation_type_id]
    );
    if (typeCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid donation type" });
    }

    // --- 2. Type-data mismatch validation + destination validation ---
    const isMoneyType = [1, 2, 3].includes(donation_type_id);
    const isClothes = donation_type_id === 4;
    const isBooks = donation_type_id === 5;

    if (isMoneyType) {
      if (items && items.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Money/Zakat/Sadaqah donations cannot have items. Use "amount".',
        });
      }
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount is required and must be > 0 for Money/Zakat/Sadaqah.",
        });
      }

      if (campaign_id) {
        const campaign = await db.query(
          `SELECT * FROM Campaign WHERE campaign_id = $1 AND end_date >= CURRENT_DATE`,
          [campaign_id]
        );
        if (campaign.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid or inactive campaign.",
          });
        }

        const amountRaised = Number(campaign.rows[0].amount_raised) || 0;
        const targetAmount = Number(campaign.rows[0].target_amount) || 0;
        const remaining = targetAmount - amountRaised;

        if (remaining <= 0) {
          return res.status(400).json({
            success: false,
            message: "This campaign has already reached its target amount.",
          });
        }
        if (amount > remaining) {
          return res.status(400).json({
            success: false,
            message: `Donation amount exceeds remaining campaign need (${remaining}). Please reduce amount.`,
          });
        }
      }
    }

    if (isClothes || isBooks) {
      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Items array is required for Clothes/Books donations.",
        });
      }
      if (amount && amount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount should not be provided for Clothes/Books. Use "items".',
        });
      }
      if (orphanage_id) {
        const orphanage = await db.query(
          "SELECT * FROM Orphanage WHERE orphanage_id = $1",
          [orphanage_id]
        );
        if (orphanage.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid orphanage selected.",
          });
        }
      }
      for (const item of items) {
        if (isClothes && (!item.type || !item.quantity || Number(item.quantity) <= 0)) {
          return res.status(400).json({
            success: false,
            message: "Each clothing item must have type and positive quantity.",
          });
        }
        if (isBooks && (!item.title || !item.quantity || Number(item.quantity) <= 0)) {
          return res.status(400).json({
            success: false,
            message: "Each book item must have title and positive quantity.",
          });
        }
      }
    }

    // --- 3. Get next donation_id ---
    const donation_id = await getNextId("Donation", "donation_id");

    console.log("[createDonation] About to insert:", {
      donation_id,
      user_id,
      campaign_id,
      donation_type_id,
      orphanage_id,
      amount,
      isMoneyType,
      remaining_amount: isMoneyType ? amount : null,
    });

    // --- 4. Insert into Donation table ---
    await db.query(
      `INSERT INTO Donation (donation_id, user_id, campaign_id, donation_type_id, orphanage_id, date, amount, remaining_amount, status) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, 'pending')`,
      [
        donation_id,
        user_id,
        campaign_id || null,
        donation_type_id,
        orphanage_id || null,
        isMoneyType ? amount : null,
        isMoneyType ? amount : null,
      ]
    );

    // --- 5. Insert items into Clothes or Books ---
    if (items && items.length > 0) {
      for (const item of items) {
        if (isClothes) {
          const cloth_id = await getNextId("Clothes", "cloth_id");
          await db.query(
            `INSERT INTO Clothes (cloth_id, donation_id, type, size, conditionOfCloth, description, quantity)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              cloth_id,
              donation_id,
              item.type,
              item.size || null,
              item.conditionOfCloth || null,
              item.description || null,
              Number(item.quantity),
            ]
          );
        } else if (isBooks) {
          const book_id = await getNextId("Books", "book_id");
          await db.query(
            `INSERT INTO Books (book_id, donation_id, title, author, conditionOfBook, description, quantity)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              book_id,
              donation_id,
              item.title,
              item.author || null,
              item.conditionOfBook || null,
              item.description || null,
              Number(item.quantity),
            ]
          );
        }
      }
    }

    // --- 6. Fetch user profile + upgrade role if first donation ---
    const userRows = await db.query(
      "SELECT role, name, email, phone FROM Users WHERE user_id = $1",
      [user_id]
    );
    const currentUser = userRows.rows[0];

    if (currentUser?.role === "general") {
      const countResult = await db.query(
        "SELECT COUNT(*) as count FROM Donation WHERE user_id = $1",
        [user_id]
      );
      if (Number(countResult.rows[0].count) === 1) {
        await db.query(
          "UPDATE Users SET role = 'donor' WHERE user_id = $1",
          [user_id]
        );
        console.log(`[createDonation] User ${user_id} upgraded from 'general' to 'donor'.`);
      }
    }

    // --- 7. Send success response ---
    res.status(201).json({
      success: true,
      message: "Donation recorded successfully",
      receipt_id: `RCP-${donation_id}`,
      donor: {
        name: currentUser?.name || null,
        email: currentUser?.email || null,
        phone: currentUser?.phone || null,
      },
      donation: {
        id: donation_id,
        donation_type_id,
        amount: isMoneyType ? amount : null,
        remaining_amount: isMoneyType ? amount : null,
        items: items || [],
        created_at: new Date().toISOString(),
      },
      donation_id,
      status: "pending",
    });
  } catch (error) {
    console.error("[createDonation] Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get donor's own donation history
// @route   GET /api/donations/my-donations
// @access  Private
export const getMyDonations = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const donations = await db.query(
      `SELECT d.donation_id, dt.type_name, d.amount, d.date, d.status, d.campaign_id
       FROM Donation d
       JOIN Donation_Type dt ON d.donation_type_id = dt.donation_type_id
       WHERE d.user_id = $1
       ORDER BY d.date DESC`,
      [user_id]
    );

    res.json({
      success: true,
      count: donations.rows.length,
      donations: donations.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get total donations (public)
// @route   GET /api/donations/total
// @access  Public
export const getTotalDonations = async (req, res) => {
  try {
    // Per-type monetary totals
    const perTypeRows = await db.query(`
      SELECT
        dt.type_name,
        COALESCE(SUM(d.amount), 0) AS total_amount
      FROM Donation_Type dt
      LEFT JOIN Donation d
        ON d.donation_type_id = dt.donation_type_id
        AND d.status = 'Approved'
        AND d.amount IS NOT NULL
      GROUP BY dt.donation_type_id, dt.type_name
      HAVING COALESCE(SUM(d.amount), 0) > 0
      ORDER BY total_amount DESC
    `);

    // Clothes & Books item counts
    const itemTotals = await db.query(`
      SELECT
        COALESCE((
          SELECT SUM(c.quantity)
          FROM Clothes c
          JOIN Donation d ON c.donation_id = d.donation_id
          WHERE d.status = 'Approved'
        ), 0) AS total_clothes_items,
        COALESCE((
          SELECT SUM(b.quantity)
          FROM Books b
          JOIN Donation d ON b.donation_id = d.donation_id
          WHERE d.status = 'Approved'
        ), 0) AS total_books_items
    `);

    // Campaign donations total
    const campaignTotals = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_campaign_amount
      FROM Donation
      WHERE status = 'Approved'
        AND campaign_id IS NOT NULL
        AND amount IS NOT NULL
    `);

    // Orphanage donations total
    const orphanageTotals = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_orphanage_amount
      FROM Donation
      WHERE status = 'Approved'
        AND orphanage_id IS NOT NULL
        AND amount IS NOT NULL
    `);

    return res.json({
      totals: {
        total_clothes_items: Number(itemTotals.rows[0].total_clothes_items),
        total_books_items: Number(itemTotals.rows[0].total_books_items),
        total_campaign_amount: Number(campaignTotals.rows[0].total_campaign_amount),
        total_orphanage_amount: Number(orphanageTotals.rows[0].total_orphanage_amount),
      },
      perType: perTypeRows.rows.map((r) => ({
        type_name: r.type_name,
        total_amount: Number(r.total_amount),
      })),
    });
  } catch (err) {
    console.error("donations/total error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// @desc    Track individual donation record
// @route   GET /api/donations/:id
// @access  Private (owner or admin)
export const getDonationById = async (req, res) => {
  try {
    const donation_id = req.params.id;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    let query = `
      SELECT d.*, dt.type_name, u.name as donor_name, u.email as donor_email
      FROM Donation d
      JOIN Donation_Type dt ON d.donation_type_id = dt.donation_type_id
      JOIN Users u ON d.user_id = u.user_id
      WHERE d.donation_id = $1
    `;

    if (user_role !== "admin") {
      query += ` AND d.user_id = $2`;
      const donations = await db.query(query, [donation_id, user_id]);
      if (donations.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Donation not found" });
      }
      let items = [];
      if (donations.rows[0].donation_type_id === 4) {
        const clothes = await db.query(
          "SELECT * FROM Clothes WHERE donation_id = $1",
          [donation_id]
        );
        items = clothes.rows;
      } else if (donations.rows[0].donation_type_id === 5) {
        const books = await db.query(
          "SELECT * FROM Books WHERE donation_id = $1",
          [donation_id]
        );
        items = books.rows;
      }
      return res.json({ success: true, donation: donations.rows[0], items });
    }

    const donations = await db.query(query, [donation_id]);
    if (donations.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Donation not found" });
    }
    res.json({ success: true, donation: donations.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};