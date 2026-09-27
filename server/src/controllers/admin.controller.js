import sequelize from "../config/db.js";
import Account from "../models/account.model.js";
import UserApplication from "../models/userApplication.model.js";
import VolunteerOpportunity from "../models/volunteerOpportunity.model.js";

function toApplicationResponse(application) {
  return {
    id: application.id,
    firstName: application.firstName,
    lastName: application.lastName,
    email: application.email,
    phone: application.phone,
    age: application.age,
    city: application.city,
    availability: application.availability,
    experience: application.experience,
    skills: application.skills,
    heardAbout: application.heardAbout,
    agreeTerms: application.agreeTerms,
    status: application.status,
    submittedAt: application.submittedAt,
    volunteerId: application.volunteerId,
    volunteerName: application.opportunity?.name ?? "",
    volunteerType: application.opportunity?.type ?? "",
    accountEmail: application.account?.email ?? null,
  };
}

export async function updateAdminApplicationStatus(req, res, next) {
  try {
    const application = await UserApplication.findByPk(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found." });

    await application.update({ status: req.validatedBody.status });
    res.json({ id: application.id, status: application.status });
  } catch (error) {
    next(error);
  }
}

export async function listAdminOpportunities(_req, res, next) {
  try {
    res.json(await VolunteerOpportunity.findAll({ order: [["id", "ASC"]] }));
  } catch (error) {
    next(error);
  }
}

export async function createAdminOpportunity(req, res, next) {
  try {
    const opportunity = await VolunteerOpportunity.create(req.validatedBody);
    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
}

export async function updateAdminOpportunity(req, res, next) {
  try {
    const opportunity = await VolunteerOpportunity.findByPk(req.params.id);
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found." });

    await opportunity.update(req.validatedBody);
    res.json(opportunity);
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminOpportunity(req, res, next) {
  try {
    const opportunity = await VolunteerOpportunity.findByPk(req.params.id);
    if (!opportunity) return res.status(404).json({ message: "Opportunity not found." });

    const applicationCount = await UserApplication.count({ where: { volunteerId: opportunity.id } });
    if (applicationCount > 0) {
      return res.status(409).json({
        message: "This opportunity has applications and cannot be deleted. Edit it instead.",
      });
    }

    await opportunity.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function listAdminApplications(_req, res, next) {
  try {
    const applications = await UserApplication.findAll({
      include: [
        { model: VolunteerOpportunity, as: "opportunity", attributes: ["id", "name", "type"] },
        { model: Account, as: "account", attributes: ["email"] },
      ],
      order: [["submitted_at", "DESC"]],
    });
    res.json(applications.map(toApplicationResponse));
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminApplication(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const application = await UserApplication.findByPk(req.params.id, {
      include: [{ model: VolunteerOpportunity, as: "opportunity" }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!application) {
      await transaction.rollback();
      return res.status(404).json({ message: "Application not found." });
    }

    await application.destroy({ transaction });
    if (application.opportunity) {
      await application.opportunity.increment("spotsLeft", { by: 1, transaction });
    }

    await transaction.commit();
    res.status(204).end();
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
}
