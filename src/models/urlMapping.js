const { DataTypes } = require('sequelize');
const sequelize = require('../database'); // Configure this according to your Sequelize setup

const UrlMapping = sequelize.define('UrlMapping', {
  originalUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shortCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
  },
});

module.exports = UrlMapping;
