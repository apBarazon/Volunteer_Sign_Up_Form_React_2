import sequelize from "../config/db.js";
import UserApplication from "../models/userApplication.model.js";
import VolunteerOpportunity from "../models/volunteerOpportunity.model.js";

/**
 * GET /api/applications
 * Returns every submitted application joined with its opportunity.
 * Powers the "My Applications" page.
 */
export async function getApplications(_req, res, next) {
  try {
    const applications = await UserApplication.findAll({
      include: [
        {
          model: VolunteerOpportunity,
          as: "opportunity",
          attributes: ["id", "name", "type"],
        },
      ],
      order: [["submitted_at", "DESC"]],
    });

    const result = applications.map((app) => ({
      id: app.id,
      firstName: app.firstName,
      lastName: app.lastName,
      email: app.email,
      phone: app.phone,
      age: app.age,
      city: app.city,
      availability: app.availability,  // already parsed by Sequelize getter
      experience: app.experience,
      skills: app.skills,              // already parsed by Sequelize getter
      heardAbout: app.heardAbout,
      agreeTerms: app.agreeTerms,
      submittedAt: app.submittedAt,
      volunteerId: app.volunteerId,
      volunteerName: app.opportunity?.name ?? "",
      volunteerType: app.opportunity?.type ?? "",
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/applications
 * Inserts a new application and decrements the opportunity's spots_left.
 * Uses a transaction so both writes either succeed or both roll back.
 */
export async function submitApplication(req, res, next) {
  const {
    volunteerId,
    firstName,
    lastName,
    email,
    phone,
    age,
    city,
    availability = [],
    experience,
    skills = [],
    heardAbout,
    agreeTerms,
  } = req.body;

  // Basic server-side validation
  if (!volunteerId || !firstName || !lastName || !email || !phone) {
    return res.status(400).json({ message: "Missing required fields." });
  }
  if (!agreeTerms) {
    return res.status(400).json({ message: "You must agree to the volunteer terms." });
  }

  const t = await sequelize.transaction();
  try {
    // 1. Verify the opportunity exists
    const opportunity = await VolunteerOpportunity.findByPk(volunteerId, { transaction: t });
    if (!opportunity) {
      await t.rollback();
      return res.status(404).json({ message: "Selected opportunity does not exist." });
    }

    // 2. Check spots
    if (opportunity.spotsLeft <= 0) {
      await t.rollback();
      return res.status(400).json({ message: "Sorry, this opportunity is already full." });
    }

    // 3. Insert the application
    const newApp = await UserApplication.create(
      {
        volunteerId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        age: age ? Number(age) : null,
        city: city || null,
        availability,
        experience: experience || null,
        skills,
        heardAbout: heardAbout || null,
        agreeTerms: !!agreeTerms,
      },
      { transaction: t }
    );

    // 4. Decrement spots_left, never below zero
    await opportunity.decrement("spotsLeft", { by: 1, transaction: t });

    await t.commit();
    res.status(201).json({ id: newApp.id, message: "Application submitted successfully." });
  } catch (error) {
    await t.rollback();
    next(error);
  }
}
