import Event from "../models/event.model.js";
import Signup from "../models/signup.model.js";
import Volunteer from "../models/volunteer.model.js";

/**
 * Handle volunteer sign-up submission
 */
export async function signup(req, res, next) {
  try {
    const { fullName, email, phone, eventId } = req.validatedBody || req.body;

    // 1. Verify that the event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Selected event does not exist." });
    }

    // 2. Check event capacity if a capacity limit is set
    if (event.capacity !== null && event.capacity !== undefined) {
      const activeSignups = await Signup.count({
        where: {
          eventId,
          status: "confirmed",
        },
      });

      if (activeSignups >= event.capacity) {
        return res.status(400).json({
          error: "Sorry, this event is already at full capacity.",
        });
      }
    }

    // 3. Find or create the volunteer record by email
    const normalizedEmail = email.trim().toLowerCase();
    const [volunteer] = await Volunteer.findOrCreate({
      where: { email: normalizedEmail },
      defaults: {
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
      },
    });

    // 4. Check if the volunteer is already signed up for this event
    const existingSignup = await Signup.findOne({
      where: {
        volunteerId: volunteer.id,
        eventId: event.id,
      },
    });

    if (existingSignup) {
      return res.status(400).json({
        error: `You are already registered for '${event.title}'.`,
      });
    }

    // 5. Create the confirmed sign-up record
    const newSignup = await Signup.create({
      volunteerId: volunteer.id,
      eventId: event.id,
      status: "confirmed",
    });

    // 6. Return 201 Created with full confirmation details
    res.status(201).json({
      message: "Sign-up successful!",
      signup: newSignup,
      volunteer: {
        id: volunteer.id,
        fullName: volunteer.fullName,
        email: volunteer.email,
      },
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        location: event.location,
      },
    });
  } catch (error) {
    next(error);
  }
}
