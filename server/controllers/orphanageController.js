import db from "../db.js";

export const getOrphanages = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT orphanage_id, name, location, contact_info FROM Orphanage"
    );
    res.json({ success: true, orphanages: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};