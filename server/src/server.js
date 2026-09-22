import "dotenv/config";
import app from "./app.js";
import sequelize from "./config/db.js";
import Event from "./models/event.model.js";
import Signup from "./models/signup.model.js";
import Volunteer from "./models/volunteer.model.js";

const models = { Event, Signup, Volunteer };

Volunteer.associate(models);
Event.associate(models);
Signup.associate(models);

const port = Number(process.env.PORT || 3000);

try {
  await sequelize.authenticate();
  console.log("Database connection established.");

  app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
  });
} catch (error) {
  console.error("Unable to connect to the database:", error.message);
  process.exitCode = 1;
}