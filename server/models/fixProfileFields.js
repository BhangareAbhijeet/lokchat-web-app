const mongoose = require("mongoose");
const User = require("./user"); // instead of ./models/user


async function fixProfileFields() {
  await mongoose.connect("mongodb://localhost:27017/YOUR_DB_NAME"); // replace with your DB

  const users = await User.find({
    $or: [
      { profilePic: { $type: "string" } },
      { coverPic: { $type: "string" } }
    ]
  });

  for (let user of users) {
    if (typeof user.profilePic === "string") {
      user.profilePic = { url: "", public_id: "" };
    }
    if (typeof user.coverPic === "string") {
      user.coverPic = { url: "", public_id: "" };
    }
    await user.save();
  }

  console.log(`Fixed ${users.length} users' profile/cover fields.`);
  mongoose.disconnect();
}

fixProfileFields().catch(console.error);