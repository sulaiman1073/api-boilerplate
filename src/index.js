const { initServer, startServer } = require("./server");

const abc = async () => {
  await initServer();
  await startServer();
};

abc();
