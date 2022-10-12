const bcrypt = require("bcryptjs");
const db = require("../config/database");
const addViewers = require("../helpers/addViewers");

module.exports.login = async ({ usernameOrEmail, password }) => {
  return db.task(async t => {
    const user = await t.UserRepository.getUser({
      usernameOrEmail,
      withPassword: true
    });

    if (!user || !(await bcrypt.compare(password, user.password))) return false;

    const loginData = await t.SessionRepository.getLoginData({
      userId: user.id
    });

    const loginDataWithViewers = await addViewers(t, loginData);

    return loginDataWithViewers;
  });
};

module.exports.getLoginData = async ({ userId }) => {
  return db.task(async t => {
    const loginData = await t.SessionRepository.getLoginData({ userId });
    const loginDataWithViewers = await addViewers(t, loginData);

    return loginDataWithViewers;
  });
};
