const moment = require("moment");
const { calculatePlayerStatus } = require("../shared/videoSyncing");

module.exports = async ({ db, channelId }) => {
  const storedPlayerStatus = await db.ChannelRepository.getPlayerStatus({
    channelId
  });
  const { queue } = await db.VideoRepository.getChannelQueue({ channelId });
  const currTime = moment();
  const playerStatus = calculatePlayerStatus(
    storedPlayerStatus,
    queue,
    true,
    currTime
  );
  playerStatus.clockStartTime = currTime.format();

  return playerStatus;
};
