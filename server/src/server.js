import "dotenv/config";
import app from "./app.js";
import sequelize, { ensureDatabase } from "./config/db.js";

// Original models
import Event from "./models/event.model.js";
import Signup from "./models/signup.model.js";
import Volunteer from "./models/volunteer.model.js";

// New models (classmate's data model, used by the frontend)
import VolunteerOpportunity from "./models/volunteerOpportunity.model.js";
import UserApplication from "./models/userApplication.model.js";
import Account from "./models/account.model.js";

// ── Associations ──────────────────────────────────────────────────────────────

// Original associations
const originalModels = { Event, Signup, Volunteer };
Volunteer.associate(originalModels);
Event.associate(originalModels);
Signup.associate(originalModels);

// New associations: UserApplication belongs to VolunteerOpportunity
UserApplication.belongsTo(VolunteerOpportunity, {
  foreignKey: "volunteer_id",
  as: "opportunity",
});
Account.hasMany(UserApplication, {
  foreignKey: "account_id",
  as: "applications",
});
UserApplication.belongsTo(Account, {
  foreignKey: "account_id",
  as: "account",
});
VolunteerOpportunity.hasMany(UserApplication, {
  foreignKey: "volunteer_id",
  as: "applications",
});

// ── Seed helpers ──────────────────────────────────────────────────────────────

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required in server/.env. Copy server/.env.example and set it before starting the server.");
}

async function seedInitialEvents() {
  const count = await Event.count();
  if (count === 0) {
    await Event.bulkCreate([
      {
        title: "Community Beach & Park Cleanup",
        description: "Help clean up trash, plastic, and debris along the shoreline.",
        eventDate: "2026-10-15",
        location: "Baywalk Seaside Promenade",
        capacity: 25,
      },
      {
        title: "Community Food Pantry Distribution",
        description: "Sorting, packing, and handing out grocery bags to local families in need.",
        eventDate: "2026-10-22",
        location: "Central Community Hall",
        capacity: 15,
      },
      {
        title: "Senior Center Digital Literacy Workshop",
        description: "Assist elderly community members with smartphones, video calling, and computers.",
        eventDate: "2026-10-29",
        location: "Public Library Tech Lab",
        capacity: 10,
      },
    ]);
    console.log("🌱 Seeded 3 starter events into the events table.");
  }
}

async function seedVolunteerOpportunities() {
  const count = await VolunteerOpportunity.count();
  if (count === 0) {
    await VolunteerOpportunity.bulkCreate([
      {
        name: "Community Tutor",
        type: "Education",
        description:
          "Assist children and teens with after-school reading, mathematics, and general study support.",
        spotsLeft: 12,
      },
      {
        name: "Tree Planting & Clean-up",
        type: "Environment",
        description:
          "Join weekend local reforestation and neighborhood waste-reduction campaigns.",
        spotsLeft: 25,
      },
      {
        name: "Food Drive Logistics",
        type: "Outreach",
        description:
          "Help organize, pack, and distribute care packages and meals to families in need.",
        spotsLeft: 8,
      },
    ]);
    console.log("🌱 Seeded 3 starter volunteer opportunities into the volunteers table.");
  }
}

async function ensureAccountIdColumn() {
  const [columns] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'account_id'");
  if (columns.length > 0) return;

  await sequelize.query(
    "ALTER TABLE users ADD COLUMN account_id INT NULL, ADD INDEX idx_users_account_id (account_id), ADD CONSTRAINT fk_users_account_id FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  console.log("✅ Added account ownership to existing applications.");
}

// ── Boot ──────────────────────────────────────────────────────────────────────

try {
  await ensureDatabase();
  await sequelize.authenticate();
  console.log("✅ MariaDB database connection established successfully.");

  // Synchronize missing tables without repeatedly rewriting existing constraints.
  await sequelize.sync();
  console.log("✅ Database tables synchronized.");
  await ensureAccountIdColumn();

  // Seed starter data
  await seedInitialEvents();
  await seedVolunteerOpportunities();

  app.listen(port, host, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
    console.log(`📱 LAN access enabled on port ${port} (use this computer's IP address).`);
  });
} catch (error) {
  console.error("❌ Unable to connect to MariaDB database:", error.message);
  console.log("\n💡 Troubleshooting tips:");
  console.log("  1. Make sure MySQL/MariaDB is started in your XAMPP Control Panel.");
  console.log("  2. Open http://localhost/phpmyadmin and verify the database exists.");
  console.log("  3. Check server/.env to ensure DB_USER, DB_PASSWORD, and DB_PORT match your XAMPP settings.\n");

  process.exitCode = 1;
}