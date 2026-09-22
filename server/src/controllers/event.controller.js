import Event from "../models/event.model.js";

/**
 * Get all upcoming events
 */
export async function getEvents(_req, res, next) {
  try {
    const events = await Event.findAll({
      order: [["event_date", "ASC"]],
    });
    res.json(events);
  } catch (error) {
    next(error);
  }
}
