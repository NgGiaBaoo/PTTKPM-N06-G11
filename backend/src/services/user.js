const bcrypt = require("bcrypt");
const UserModel = require("../models/User");

const SALT_ROUNDS = 10;

function normalizeRole(role) {
  const allowed = ["Student", "Employer", "SchoolStaff", "Admin"];
  if (!role || !allowed.includes(role)) {
    return "Student";
  }
  return role;
}

function createUser(user) {
  return new Promise(async (resolve, reject) => {
    try {
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      const role = normalizeRole(user.role);
      const result = await UserModel.createUser({
        username: user.username,
        email: user.email,
        passwordHash: hashedPassword,
        role,
        createdBy: user.createdBy,
        accountStatus: user.accountStatus || (user.createdBy ? "Active" : "Pending"),
        emailVerified: user.emailVerified !== undefined ? user.emailVerified : Boolean(user.createdBy)
      });
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

function getAllUsers() {
  return UserModel.getAllUsers();
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    UserModel.getUserRecordById(id)
      .then((user) => {
        if (!user) {
          return resolve(null);
        }
        resolve({ id: user.UserID, username: user.Username });
      })
      .catch(reject);
  });
}

function updateUser(id, user) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentUser = await UserModel.getUserRecordById(id);
      if (!currentUser) {
        return resolve(null);
      }

      const username = user.username || currentUser.Username;
      const passwordHash = user.password
        ? await bcrypt.hash(user.password, SALT_ROUNDS)
        : currentUser.PasswordHash;
      const role = normalizeRole(user.role || currentUser.Role);

      const result = await UserModel.updateUser(id, { username, passwordHash, role });
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

function deleteUser(id) {
  return UserModel.deleteUser(id);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await UserModel.getUserRecordById(userId);
  if (!user || !(await bcrypt.compare(currentPassword, user.PasswordHash))) {
    const error = new Error("Current password is incorrect");
    error.statusCode = 400;
    throw error;
  }
  return UserModel.updatePassword(userId, await bcrypt.hash(newPassword, SALT_ROUNDS));
}

async function resetPassword(userId, newPassword) {
  return UserModel.updatePassword(userId, await bcrypt.hash(newPassword, SALT_ROUNDS));
}

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser, changePassword, resetPassword };
