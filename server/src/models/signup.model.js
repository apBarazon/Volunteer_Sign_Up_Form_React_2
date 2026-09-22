import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class Signup extends Model {
  static associate({ Volunteer, Event }) {
    Signup.belongsTo(Volunteer, {
      foreignKey: "volunteerId",
      as: "volunteer",
      onDelete: "CASCADE",
    });
    Signup.belongsTo(Event, {
      foreignKey: "eventId",
      as: "event",
      onDelete: "CASCADE",
    });
  }
}

Signup.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    volunteerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "volunteer_id",
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "event_id",
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
      allowNull: false,
      defaultValue: "confirmed",
    },
  },
  {
    sequelize,
    modelName: "Signup",
    tableName: "signups",
    underscored: true,
    createdAt: "signed_up_at",
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["volunteer_id", "event_id"],
      },
    ],
  },
);

export default Signup;