import db from "../db.js";

export const getOrphanages = async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [orphanages] = await promiseDb.query(`
      SELECT r.receiver_id, r.name, r.location, r.contact_info
      FROM receiver r
      JOIN Orphanage o ON r.receiver_id = o.receiver_id
    `);
    res.json({ success: true, orphanages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
