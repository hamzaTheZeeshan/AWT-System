export const getOrphanages = async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [orphanages] = await promiseDb.query(
      "SELECT orphanage_id, name, location, contact_info FROM Orphanage",
    );
    res.json({ success: true, orphanages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
