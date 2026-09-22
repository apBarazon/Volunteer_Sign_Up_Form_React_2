import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class Volunteer extends Model {
  static associate({ Signup }) {
    Volunteer.hasMany(Signup, {
      foreignKey: "volunteerId",
      as: "signups",
      onDelete: "CASCADE",
    });
  }
}

Volunteer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "full_name",
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Volunteer",
    tableName: "volunteers",
    underscored: true,
    updatedAt: false,
  },
);

export default Volunteer;