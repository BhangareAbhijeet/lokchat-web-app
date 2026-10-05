const express = require("express");
const router = express.Router();
const User = require("../models/user");

// ✅ Normalize phone numbers consistently
function normalizePhoneNumber(phone, countryCode = "+91") {
  if (!phone) return null;
  phone = phone.replace(/\D/g, ""); // remove all non-digits

  if (phone.startsWith("0")) phone = phone.slice(1);
  if (!phone.startsWith(countryCode.replace("+", ""))) {
    phone = `${countryCode}${phone}`;
  } else {
    phone = `+${phone}`;
  }
  return phone;
}

/* ------------------------------------------------------------------
   🧠 STEP 1: SYNC DEVICE CONTACTS WITH SERVER
   Client sends: { contacts: [ { name, phone } ] }
   Route: POST /api/contacts/sync/:userId
------------------------------------------------------------------ */
router.post("/sync/:userId", async (req, res) => {
  try {
    const { contacts } = req.body;
    const { userId } = req.params;

    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ error: "Contacts array required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Normalize frontend contacts
    const normalizedPhones = contacts
      .map((c) => normalizePhoneNumber(c.phone))
      .filter(Boolean);

    console.log("📱 Normalized phones from frontend:", normalizedPhones);

    // ✅ Get all other users
    const allUsers = await User.find({ _id: { $ne: userId } })
      .select("firstName lastName phone profilePic isOnline lastSeen");

    // ✅ Flexible matching (handles +91 / plain / 0-prefixed numbers)
    const matchedUsers = allUsers.filter((u) => {
      if (!u.phone) return false;
      const dbPhone = normalizePhoneNumber(u.phone);

      return (
        normalizedPhones.includes(dbPhone) ||
        normalizedPhones.includes(u.phone) ||
        normalizedPhones.includes(u.phone.replace("+91", "")) ||
        normalizedPhones.includes(`+91${u.phone.replace(/\D/g, "")}`)
      );
    });
console.log("🧾 All user phones in DB:");
allUsers.forEach((u) => {
  console.log(`Name: ${u.firstName} | Raw: ${u.phone} | Normalized: ${normalizePhoneNumber(u.phone)}`);
});

    console.log("✅ Found", matchedUsers.length, "registered users");

    // ✅ Save matched users to this user's contact list
    user.contacts = matchedUsers.map((u) => u._id);
    await user.save();

    res.json({
      message: "Contacts synced successfully",
      registeredCount: matchedUsers.length,
      registeredContacts: matchedUsers,
    });
  } catch (err) {
    console.error("❌ Sync Error:", err.message);
    res.status(500).json({ error: "Server error during sync" });
  }
});

/* ------------------------------------------------------------------
   ✅ STEP 2: ADD CONTACT MANUALLY
------------------------------------------------------------------ */
router.post("/:userId/add", async (req, res) => {
  try {
    const { contactId } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const contactUser = await User.findById(contactId);
    if (!contactUser)
      return res.status(404).json({ message: "Contact user not found" });

    if (!user.contacts.includes(contactId)) {
      user.contacts.push(contactId);
      await user.save();
    }

    res.json({ message: "Contact added successfully", contacts: user.contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   ✅ STEP 3: GET USER CONTACTS
------------------------------------------------------------------ */
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "contacts",
      "firstName lastName phone profilePic isOnline lastSeen"
    );

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
