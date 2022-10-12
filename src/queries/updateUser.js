const knex = require("../config/knex");

module.exports = ({
  userId,
  firstName,
  lastName,
  email,
  dateOfBirth,
  password,
  avatar,
  removeAvatar
}) => {
  const query = knex
    .update({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      email,
      email_verified: email ? false : undefined,
      avatar: removeAvatar ? null : avatar,
      password,
      updated_at: knex.raw("NOW()")
    })
    .from("users")
    .where("id", userId)
    .returning([
      "id",
      "first_name AS firstName",
      "last_name AS lastName",
      "username",
      "date_of_birth AS dateOfBirth",
      "avatar",
      "email",
      "email_verified AS emailVerified",
      "created_at AS createdAt"
    ]);

  return query.toString();
};
