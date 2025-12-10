const User = require('./User.model');
const Incident = require('./Incident.model');
const Notification = require('./Notification.model');
const OTP = require('./OTP.model');

// Define associations
User.hasMany(Incident, { foreignKey: 'userId', as: 'incidents', onDelete: 'CASCADE' });
Incident.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE', constraints: false });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });

Incident.hasMany(Notification, { foreignKey: 'incidentId', as: 'notifications', onDelete: 'CASCADE', constraints: false });
Notification.belongsTo(Incident, { foreignKey: 'incidentId', as: 'incident', constraints: false });

module.exports = {
  User,
  Incident,
  Notification,
  OTP,
};