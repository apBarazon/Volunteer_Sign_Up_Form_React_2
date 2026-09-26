import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

/**
 * VolunteerOpportunity — maps to the `volunteers` table.
 * Stores the opportunity cards shown on the Home page.
 * (Named to avoid collision with the original Volunteer model
 *  which stores individual volunteer people.)
 */
class VolunteerOpportunity extends Model {}

VolunteerOpportunity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    spotsLeft: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "spots_left",
    },
  },
  {
    sequelize,
    modelName: "VolunteerOpportunity",
    tableName: "volunteers",
    underscored: true,
    updatedAt: false,
  }
);

export default VolunteerOpportunity;
