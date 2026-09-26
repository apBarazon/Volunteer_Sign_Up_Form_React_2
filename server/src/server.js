import "dotenv/config";
import app from "./app.js";
import sequelize from "./config/db.js";

// Original models
import Event from "./models/event.model.js";
import Signup from "./models/signup.model.js";
import Volunteer from "./models/volunteer.model.js";

// New models (classmate's data model, used by the frontend)
import VolunteerOpportunity from "./models/volunteerOpportunity.model.js";
import UserApplication from "./models/userApplication.model.js";

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
VolunteerOpportunity.hasMany(UserApplication, {
  foreignKey: "volunteer_id",
  as: "applications",
});

// ── Seed helpers ──────────────────────────────────────────────────────────────

const port = Number(process.env.PORT || 3000);

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

// ── Boot ──────────────────────────────────────────────────────────────────────

try {
  await sequelize.authenticate();
  console.log("✅ MariaDB database connection established successfully.");

  // Synchronize missing tables without repeatedly rewriting existing constraints.
  await sequelize.sync();
  console.log("✅ Database tables synchronized.");

  // Seed starter data
  await seedInitialEvents();
  await seedVolunteerOpportunities();

  app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error("❌ Unable to connect to MariaDB database:", error.message);
  console.log("\n💡 Troubleshooting tips:");
  console.log("  1. Make sure MySQL/MariaDB is started in your XAMPP Control Panel.");
  console.log("  2. Open http://localhost/phpmyadmin and verify the database exists.");
  console.log("  3. Check server/.env to ensure DB_USER, DB_PASSWORD, and DB_PORT match your XAMPP settings.\n");

  process.exitCode = 1;
}