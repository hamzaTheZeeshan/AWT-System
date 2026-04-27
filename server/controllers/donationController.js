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
    const { donation_type_id, amount, campaign_id, items } = req.body;
    const user_id = req.user.user_id;
    const promiseDb = db.promise();

    // Validate donation type exists
    const [typeCheck] = await promiseDb.query(
      "SELECT * FROM Donation_Type WHERE donation_type_id = ?",
      [donation_type_id],
    );
    if (typeCheck.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid donation type" });
    }

    // Get next donation_id
    const donation_id = await getNextId("Donation", "donation_id");

    // Insert into Donation table
    await promiseDb.query(
      `INSERT INTO Donation (donation_id, user_id, campaign_id, donation_type_id, date, amount, status) 
             VALUES (?, ?, ?, ?, CURDATE(), ?, 'pending')`,
      [
        donation_id,
        user_id,
        campaign_id || null,
        donation_type_id,
        amount || null,
      ],
    );

    // Handle clothes or books items (direct insert into Clothes/Books)
    if (items && items.length > 0) {
      for (const item of items) {
        if (donation_type_id === 4) {
          // Clothes
          const cloth_id = await getNextId("Clothes", "cloth_id");
          await promiseDb.query(
            `INSERT INTO Clothes (cloth_id, donation_id, type, size, conditionOfCloth, description, quantity)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              cloth_id,
              donation_id,
              item.type,
              item.size,
              item.conditionOfCloth,
              item.description,
              item.quantity,
            ],
          );
        } else if (donation_type_id === 5) {
          // Books
          const book_id = await getNextId("Books", "book_id");
          await promiseDb.query(
            `INSERT INTO Books (book_id, donation_id, title, author, conditionOfBook, description, quantity)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              book_id,
              donation_id,
              item.title,
              item.author,
              item.conditionOfBook,
              item.description,
              item.quantity,
            ],
          );
        }
      }
    }

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

    const [moneyResult] = await promiseDb.query(
      `SELECT SUM(amount) as total_amount 
             FROM Donation 
             WHERE donation_type_id IN (1,2,3) AND status = 'approved'`,
    );

    const [clothesResult] = await promiseDb.query(
      `SELECT SUM(quantity) as total_items 
             FROM Clothes c
             JOIN Donation d ON c.donation_id = d.donation_id
             WHERE d.status = 'approved'`,
    );

    const [booksResult] = await promiseDb.query(
      `SELECT SUM(quantity) as total_items 
             FROM Books b
             JOIN Donation d ON b.donation_id = d.donation_id
             WHERE d.status = 'approved'`,
    );

    res.json({
      success: true,
      totals: {
        total_money: moneyResult[0].total_amount || 0,
        total_clothes_items: clothesResult[0].total_items || 0,
        total_books_items: booksResult[0].total_items || 0,
      },
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
