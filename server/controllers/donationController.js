import db from "../db.js";

// Helper to get next ID
const getNextId = async (table, idColumn) => {
  const promiseDb = db.promise();
  const [rows] = await promiseDb.query(
    `SELECT MAX(${idColumn}) as maxId FROM ${table}`,
  );
  return (rows[0].maxId || 0) + 1;
};

// @desc    Create a donation
// @route   POST /api/donations/create
// @access  Private
export const createDonation = async (req, res) => {
  try {
    const { donation_type_id, amount, campaign_id, orphanage_id, items } =
      req.body;
    const user_id = req.user.user_id;
    const promiseDb = db.promise();

    // --- 1. Validate donation type exists ---
    const [typeCheck] = await promiseDb.query(
      "SELECT * FROM Donation_Type WHERE donation_type_id = ?",
      [donation_type_id],
    );
    if (typeCheck.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation type" });
    }

    // --- 2. Type‑data mismatch validation + destination validation ---
    const isMoneyType = [1, 2, 3].includes(donation_type_id);
    const isClothes = donation_type_id === 4;
    const isBooks = donation_type_id === 5;

    if (isMoneyType) {
      // Money/Zakat/Sadaqah must NOT have items
      if (items && items.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            'Money/Zakat/Sadaqah donations cannot have items. Use "amount".',
        });
      }
      // Must have a positive amount
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Amount is required and must be > 0 for Money/Zakat/Sadaqah.",
        });
      }
      // Campaign validation & over-donation check
      if (campaign_id) {
        const [campaign] = await promiseDb.query(
          `SELECT * FROM Campaign WHERE campaign_id = ? AND end_date >= CURDATE()`,
          [campaign_id],
        );
        if (campaign.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid or inactive campaign.",
          });
        }
        const remaining =
          campaign[0].target_amount - (campaign[0].amount_raised || 0);
        if (amount > remaining) {
          return res.status(400).json({
            success: false,
            message: `Donation amount exceeds remaining campaign need (${remaining}). Please reduce amount.`,
          });
        }
      }
    }

    if (isClothes || isBooks) {
      // Clothes/Books must have items array
      if (!items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Items array is required for Clothes/Books donations.",
        });
      }
      // Should NOT have amount
      if (amount && amount > 0) {
        return res.status(400).json({
          success: false,
          message:
            'Amount should not be provided for Clothes/Books. Use "items".',
        });
      }
      // --- NEW: Validate orphanage_id (directly against Orphanage table) ---
      if (orphanage_id) {
        const [orphanage] = await promiseDb.query(
          "SELECT * FROM Orphanage WHERE orphanage_id = ?",
          [orphanage_id],
        );
        if (orphanage.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid orphanage selected.",
          });
        }
      }
      // Validate each item
      for (const item of items) {
        if (isClothes && (!item.type || !item.quantity || item.quantity <= 0)) {
          return res.status(400).json({
            success: false,
            message: "Each clothing item must have type and positive quantity.",
          });
        }
        if (isBooks && (!item.title || !item.quantity || item.quantity <= 0)) {
          return res.status(400).json({
            success: false,
            message: "Each book item must have title and positive quantity.",
          });
        }
      }
    }

    // --- 3. Get next donation_id ---
    const donation_id = await getNextId("Donation", "donation_id");

    // --- 4. Insert into Donation table (using orphanage_id, not receiver_id) ---
    await promiseDb.query(
      `INSERT INTO Donation (donation_id, user_id, campaign_id, orphanage_id, donation_type_id, date, amount, status) 
       VALUES (?, ?, ?, ?, ?, CURDATE(), ?, 'pending')`,
      [
        donation_id,
        user_id,
        campaign_id || null,
        orphanage_id || null,
        donation_type_id,
        amount || null,
      ],
    );

    // --- 5. Insert items into Clothes or Books ---
    if (items && items.length > 0) {
      for (const item of items) {
        if (isClothes) {
          const cloth_id = await getNextId("Clothes", "cloth_id");
          await promiseDb.query(
            `INSERT INTO Clothes (cloth_id, donation_id, type, size, conditionOfCloth, description, quantity)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              cloth_id,
              donation_id,
              item.type,
              item.size || null,
              item.conditionOfCloth || null,
              item.description || null,
              item.quantity,
            ],
          );
        } else if (isBooks) {
          const book_id = await getNextId("Books", "book_id");
          await promiseDb.query(
            `INSERT INTO Books (book_id, donation_id, title, author, conditionOfBook, description, quantity)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              book_id,
              donation_id,
              item.title,
              item.author || null,
              item.conditionOfBook || null,
              item.description || null,
              item.quantity,
            ],
          );
        }
      }
    }

    // --- 6. Upgrade role from 'general' to 'donor' if first donation ---
    const [userRows] = await promiseDb.query(
      "SELECT role FROM Users WHERE user_id = ?",
      [user_id],
    );
    const currentDbRole = userRows[0]?.role;
    if (currentDbRole === "general") {
      const [countResult] = await promiseDb.query(
        "SELECT COUNT(*) as count FROM Donation WHERE user_id = ?",
        [user_id],
      );
      if (countResult[0].count === 1) {
        await promiseDb.query(
          "UPDATE Users SET role = 'donor' WHERE user_id = ?",
          [user_id],
        );
        console.log(`User ${user_id} upgraded from 'general' to 'donor'.`);
      }
    }

    // --- 7. Send success response ---
    res.status(201).json({
      success: true,
      message: "Donation recorded successfully",
      donation_id: donation_id,
      status: "pending",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get donor's own donation history
// @route   GET /api/donations/my-donations
// @access  Private
export const getMyDonations = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const promiseDb = db.promise();

    const [donations] = await promiseDb.query(
      `SELECT d.donation_id, dt.type_name, d.amount, d.date, d.status, d.campaign_id
             FROM Donation d
             JOIN Donation_Type dt ON d.donation_type_id = dt.donation_type_id
             WHERE d.user_id = ?
             ORDER BY d.date DESC`,
      [user_id],
    );

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

// @desc    Get total donations (public)
// @route   GET /api/donations/total
// @access  Public
export const getTotalDonations = async (req, res) => {
  try {
    const promiseDb = db.promise();

    const [perTypeResult] = await promiseDb.query(
      `SELECT dt.type_name, 
          COALESCE(SUM(d.amount), 0) as total_amount
       FROM Donation_Type dt
       LEFT JOIN Donation d ON dt.donation_type_id = d.donation_type_id 
         AND d.status = 'approved'
       GROUP BY dt.donation_type_id, dt.type_name`
    );

    const [clothesResult] = await promiseDb.query(
      `SELECT SUM(quantity) as total_items 
       FROM Clothes c
       JOIN Donation d ON c.donation_id = d.donation_id
       WHERE d.status = 'approved'`
    );

    const [booksResult] = await promiseDb.query(
      `SELECT SUM(quantity) as total_items 
       FROM Books b
       JOIN Donation d ON b.donation_id = d.donation_id
       WHERE d.status = 'approved'`
    );

    res.json({
      success: true,
      totals: {
        total_clothes_items: clothesResult[0].total_items || 0,
        total_books_items: booksResult[0].total_items || 0,
      },
      perType: perTypeResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
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
    const promiseDb = db.promise();

    let query = `
            SELECT d.*, dt.type_name, u.name as donor_name, u.email as donor_email
            FROM Donation d
            JOIN Donation_Type dt ON d.donation_type_id = dt.donation_type_id
            JOIN Users u ON d.user_id = u.user_id
            WHERE d.donation_id = ?
        `;

    if (user_role !== "admin") {
      query += ` AND d.user_id = ?`;
      const [donations] = await promiseDb.query(query, [donation_id, user_id]);
      if (donations.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Donation not found" });
      }
      let items = [];
      if (donations[0].donation_type_id === 4) {
        const [clothes] = await promiseDb.query(
          "SELECT * FROM Clothes WHERE donation_id = ?",
          [donation_id],
        );
        items = clothes;
      } else if (donations[0].donation_type_id === 5) {
        const [books] = await promiseDb.query(
          "SELECT * FROM Books WHERE donation_id = ?",
          [donation_id],
        );
        items = books;
      }
      return res.json({ success: true, donation: donations[0], items });
    }

    const [donations] = await promiseDb.query(query, [donation_id]);
    if (donations.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found" });
    }
    res.json({ success: true, donation: donations[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
