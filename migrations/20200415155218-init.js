/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */

let dbm;
let type;
let seed;
const fs = require("fs");
const path = require("path");

let Promise;

exports.setup = (options, seedLink) => {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

exports.up = db => {
  const filePath = path.join(__dirname, "sqls", "20200415155218-init-up.sql");
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: "utf-8" }, (err, data) => {
      if (err) return reject(err);
      console.log(`received data:\n ${data}`);

      resolve(data);
    });
  }).then(data => {
    return db.runSql(data);
  });
};

exports.down = db => {
  const filePath = path.join(__dirname, "sqls", "20200415155218-init-down.sql");
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: "utf-8" }, (err, data) => {
      if (err) return reject(err);
      console.log(`received data:\n ${data}`);

      resolve(data);
    });
  }).then(data => {
    return db.runSql(data);
  });
};

exports._meta = {
  version: 1
};
