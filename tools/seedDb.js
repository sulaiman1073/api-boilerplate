/* eslint-disable no-empty */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
const faker = require("faker");
const allSettled = require("promise.allsettled");
const { format } = require("date-fns");
const { sampleSize } = require("lodash");
const UserService = require("../src/services/UserService");
const ChannelService = require("../src/services/ChannelService");

async function seedDb() {
  console.log("Seeding database...");

  const password = "password";

  try {
    const usersSeed = Array.from({ length: 50 }).map(() => ({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      username: faker.internet.userName(),
      password,
      email: faker.internet.email(),
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar()
    }));

    let seededUsers = await allSettled(
      usersSeed.map(user => UserService.addUser(user))
    );

    seededUsers = seededUsers
      .filter(su => su.status === "fulfilled")
      .map(su => su.value);

    console.log("Seeded users");

    const user1Info = {
      firstName: "us",
      lastName: "er",
      username: "user1",
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar(),
      email: "user1@gmail.com",
      password
    };

    const user2Info = {
      firstName: "us",
      lastName: "er",
      username: "user2",
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar(),
      email: "user2@gmail.com",
      password
    };

    const user3Info = {
      firstName: "us",
      lastName: "er",
      username: "user3",
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar(),
      email: "user3@gmail.com",
      password
    };

    const user4Info = {
      firstName: "us",
      lastName: "er",
      username: "user4",
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar(),
      email: "user4@gmail.com",
      password
    };

    const user5Info = {
      firstName: "us",
      lastName: "er",
      username: "user5",
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar(),
      email: "user5@gmail.com",
      password
    };

    let seededDevs = await allSettled(
      [
        user1Info,
        user2Info,
        user3Info,
        user4Info,
        user5Info
      ].map(user => UserService.addUser(user))
    );

    seededDevs = seededDevs
      .filter(su => su.status === "fulfilled")
      .map(su => su.value);

    const devIds = seededDevs.map(su => su.id);
    const user1Id = seededDevs.filter(su => su.username === "user1")[0]
      .id;
    const user2Id = seededDevs.filter(su => su.username === "user2")[0].id;
    const user3Id = seededDevs.filter(su => su.username === "user3")[0]
      .id;
    const user4Id = seededDevs.filter(
      su => su.username === "user4"
    )[0].id;
    const user6Id = seededDevs.filter(
      su => su.username === "user5"
    )[0].id;

    const user1Ids = [
      ...sampleSize(seededUsers, 8).map(u => u.id),
      ...devIds.filter(id => id !== user1Id)
    ];
    const user2Ids = [
      ...sampleSize(seededUsers, 8).map(u => u.id),
      ...devIds.filter(id => id !== user2Id)
    ];
    const user3Ids = [
      ...sampleSize(seededUsers, 8).map(u => u.id),
      ...devIds.filter(id => id !== user3Id)
    ];
    const user4Ids = [
      ...sampleSize(seededUsers, 8).map(u => u.id),
      ...devIds.filter(id => id !== user4Id)
    ];
    const user5Ids = [
      ...sampleSize(seededUsers, 8).map(u => u.id),
      ...devIds.filter(id => id !== user6Id)
    ];

    for await (const fid of user1Ids) {
      try {
        await UserService.addFriendRequest({ fromUser: user1Id, toUser: fid });
        await UserService.addFriend({
          userId1: fid,
          userId2: user1Id
        });
      } catch (error) {}
    }

    for await (const fid of user2Ids) {
      try {
        await UserService.addFriendRequest({ fromUser: user2Id, toUser: fid });
        await UserService.addFriend({
          userId1: fid,
          userId2: user2Id
        });
      } catch (error) {}
    }

    for await (const fid of user3Ids) {
      try {
        await UserService.addFriendRequest({
          fromUser: user3Id,
          toUser: fid
        });
        await UserService.addFriend({
          userId1: fid,
          userId2: user3Id
        });
      } catch (error) {}
    }

    for await (const fid of user4Ids) {
      try {
        await UserService.addFriendRequest({
          fromUser: user4Id,
          toUser: fid
        });
        await UserService.addFriend({
          userId1: fid,
          userId2: user4Id
        });
      } catch (error) {}
    }

    for await (const fid of user5Ids) {
      try {
        await UserService.addFriendRequest({
          fromUser: user6Id,
          toUser: fid
        });
        await UserService.addFriend({
          userId1: fid,
          userId2: user6Id
        });
      } catch (error) {}
    }

    console.log("Seeded friends");

    await ChannelService.addRoom({
      userId: user1Id,
      userIds: [user2Id, user3Id, user4Id, user5Id]
    });

    console.log("Seeded groups");

    console.log("Seeded database.");
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

seedDb();
