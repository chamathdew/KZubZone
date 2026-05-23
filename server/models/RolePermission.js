const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "manage_movies"
  description: { type: String }
}, { timestamps: true });

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "SuperAdmin", "Editor", "Moderator"
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
}, { timestamps: true });

module.exports = {
  Permission: mongoose.model('Permission', permissionSchema),
  Role: mongoose.model('Role', roleSchema)
};
