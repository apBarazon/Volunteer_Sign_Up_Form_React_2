import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class Event extends Model {
  static associate({ Signup }) {
    Event.hasMany(Signup, {
      foreignKey: "eventId",
      as: "signups",
      onDelete: "CASCADE",
    });
  }
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "event_date",
    },
    location: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "Event",
    tableName: "events",
    underscored: true,
    updatedAt: false,
  },
);

export default Event;