const knex = require("../config/knex");

module.exports = ({
  userId,
  username,
  email,
  usernameOrEmail,
  withPassword
}) => {
  const query = knex
    .select("id")
    .select("first_name AS firstName")
    .select("last_name AS lastName")
    .select("username")
    .select("date_of_birth AS dateOfBirth")
    .select("avatar")
    .select("email")
    .select("email_verified AS emailVerified")
    .select("created_at AS createdAt")
    .from("users")
    .whereNull("deleted_at");

  if (usernameOrEmail) {
    query.andWhereRaw(
      /* SQL */ `
      (username = ? OR email = ?)
      `,
      [usernameOrEmail, usernameOrEmail]
    );
  } else if (userId) {
    query.andWhere("id", userId);
  } else if (username) {
    query.andWhere("username", username);
  } else if (email) {
    query.andWhere("email", email);
  }

  if (withPassword) {
    query.select("password");
  }

  return query.toString();
};
