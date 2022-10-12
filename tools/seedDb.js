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

    const andrewInfo = {
      firstName: "Andrew",
      lastName: "Jang",
      username: "andrewdhjang",
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar(),
      email: "andrewdhjang@gmail.com",
      password
    };

    const nesterInfo = {
      firstName: "nes",
      lastName: "ter",
      username: "nest3r",
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar(),
      email: "nest9876@gmail.com",
      password
    };

    const silentFuzzleInfo = {
      firstName: "silent",
      lastName: "fuzzle",
      username: "silentfuzzle",
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar(),
      email: "silentfuzzle123@gmail.com",
      password
    };

    const sandPillInfo = {
      firstName: "sand",
      lastName: "pill",
      username: "sandPill",
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar(),
      email: "sandPill123@gmail.com",
      password
    };

    const andregammaInfo = {
      firstName: "andre",
      lastName: "gamma",
      username: "andregamma",
      dateOfBirth: format(
        faker.date.between("1950-01-01", "2000-01-01"),
        "yyyy-MM-dd"
      ),
      avatar: faker.image.avatar(),
      email: "andregamma123@gmail.com",
      password
    };

    let seededDevs = await allSettled(
      [
        andrewInfo,
        nesterInfo,
        sandPillInfo,
        silentFuzzleInfo,
        andregammaInfo
      ].map(user => UserService.addUser(user))
    );

    seededDevs = seededDevs
      .filter(su => su.status === "fulfilled")
      .map(su => su.value);

    const devIds = seededDevs.map(su => su.id);
    const andrewId = seededDevs.filter(su => su.username === "andrewdhjang")[0]
      .id;
    const nesterId = seededDevs.filter(su => su.username === "nest3r")[0].id;
    const sandPillId = seededDevs.filter(su => su.username === "sandPill")[0]
      .id;
    const silentFuzzleId = seededDevs.filter(
      su => su.username === "silentfuzzle"
    )[0].id;
    const andregammaId = seededDevs.filter(
      su => su.username === "andregamma"
    )[0].id;

    const andrewFriendsIds = [
      ...sampleSize(seededUsers, 8).map(u => u.id),
      ...devIds.filter(id => id !== andrewId)
    ];
    const nesterFriendsIds = [
      ...sampleSize(seededUsers, 8).map(u => u.id),
      ...devIds.filter(id => id !== nesterId)
    ];
    const sandPillFriendsIds = [
      ...sampleSize(seededUsers, 8).map(u => u.id),
      ...devIds.filter(id => id !== sandPillId)
    ];
    const silentFuzzleFriendsIds = [
      ...sampleSize(seededUsers, 8).map(u => u.id),
      ...devIds.filter(id => id !== silentFuzzleId)
    ];
    const andregammaFriendsIds = [
      ...sampleSize(seededUsers, 8).map(u => u.id),
      ...devIds.filter(id => id !== andregammaId)
    ];

    for await (const fid of andrewFriendsIds) {
      try {
        await UserService.addFriendRequest({ fromUser: andrewId, toUser: fid });
        await UserService.addFriend({
          userId1: fid,
          userId2: andrewId
        });
      } catch (error) {}
    }

    for await (const fid of nesterFriendsIds) {
      try {
        await UserService.addFriendRequest({ fromUser: nesterId, toUser: fid });
        await UserService.addFriend({
          userId1: fid,
          userId2: nesterId
        });
      } catch (error) {}
    }

    for await (const fid of sandPillFriendsIds) {
      try {
        await UserService.addFriendRequest({
          fromUser: sandPillId,
          toUser: fid
        });
        await UserService.addFriend({
          userId1: fid,
          userId2: sandPillId
        });
      } catch (error) {}
    }

    for await (const fid of silentFuzzleFriendsIds) {
      try {
        await UserService.addFriendRequest({
          fromUser: silentFuzzleId,
          toUser: fid
        });
        await UserService.addFriend({
          userId1: fid,
          userId2: silentFuzzleId
        });
      } catch (error) {}
    }

    for await (const fid of andregammaFriendsIds) {
      try {
        await UserService.addFriendRequest({
          fromUser: andregammaId,
          toUser: fid
        });
        await UserService.addFriend({
          userId1: fid,
          userId2: andregammaId
        });
      } catch (error) {}
    }

    console.log("Seeded friends");

    await ChannelService.addRoom({
      userId: andrewId,
      userIds: [nesterId, sandPillId, silentFuzzleId, andregammaId]
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
