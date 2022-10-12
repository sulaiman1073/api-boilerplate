/* eslint-disable prefer-destructuring */
const { initServer } = require("../src/server");
const db = require("../src/config/database");

// clear db before all tests, beforeAll(async ()) ...etc
let cookie;

describe("UserController", () => {
  let server;

  beforeEach(async () => {
    server = await initServer();
  });

  afterEach(async () => {
    await server.stop();
  });

  it("Register a user", async () => {
    const res = await server.inject({
      method: "post",
      url: "/users",
      payload: {
        firstName: "firstName",
        lastName: "lastName",
        username: "someguy123",
        dateOfBirth: "1980-01-01",
        email: "email123@gmail.com",
        password: "PassW0rd123"
      }
    });

    cookie = res.headers["set-cookie"][0];
    const responsePayload = res.result;
    console.log("cookie", cookie);
    console.log("responsePayload", responsePayload);
    expect(1).toEqual(1);
    expect(res.statusCode).toEqual(201);
    await db.query("delete from users where id = $1", [responsePayload.id]);
  });
});
