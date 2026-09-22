import "dotenv/config";
import app from "./app.js";
import sequelize from "./config/db.js";
import Event from "./models/event.model.js";
import Signup from "./models/signup.model.js";
import Volunteer from "./models/volunteer.model.js";

const models = { Event, Signup, Volunteer };

// Setup Sequelize associations
Volunteer.associate(models);
Event.associate(models);
Signup.associate(models);

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
    console.log("🌱 Seeded 3 starter events into MariaDB.");
  }
}

try {
  await sequelize.authenticate();
  console.log("✅ MariaDB database connection established successfully.");

  // Automatically create tables in MariaDB if they don't exist yet
  await sequelize.sync({ alter: true });
  console.log("✅ Database tables synchronized (volunteers, events, signups).");

  // Seed sample events if the table is empty
  await seedInitialEvents();

  app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error("❌ Unable to connect to MariaDB database:", error.message);
  console.log("\n💡 Troubleshooting tips:");
  console.log("  1. Make sure MySQL/MariaDB is started in your XAMPP Control Panel.");
  console.log("  2. Open http://localhost/phpmyadmin and verify a database named 'volunteer_app' exists.");
  console.log("  3. Check server/.env to ensure DB_USER, DB_PASSWORD, and DB_PORT match your XAMPP settings.\n");

  // Still start the server so health checks and frontend can report the status
  app.listen(port, () => {
    console.log(`⚠️ Express server running on http://localhost:${port} (Database offline)`);
  });
}