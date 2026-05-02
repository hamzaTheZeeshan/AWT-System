import db from "../db.js";

export const getActiveCampaigns = async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [campaigns] = await promiseDb.query(`
      SELECT 
        c.campaign_id,
        c.title,
        c.description,
        c.target_amount,
        c.end_date,
        COALESCE(SUM(d.amount), 0) as amount_raised
      FROM Campaign c
      LEFT JOIN Donation d ON c.campaign_id = d.campaign_id AND d.status = 'approved'
      WHERE c.end_date >= CURDATE()
      GROUP BY c.campaign_id
      ORDER BY c.end_date ASC
    `);
    res.json({ success: true, campaigns });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
