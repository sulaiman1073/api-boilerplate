const moment = require("moment");
const db = require("../config/database");
const {
  BUFFER_TIME,
  LOOP,
  defaultPlayerStatus
} = require("../shared/videoSyncing");
const getCurrentPlayerStatus = require("../helpers/getCurrentPlayerStatus");

module.exports.addVideo = async ({
  userId,
  channelId,
  source,
  sourceId,
  length,
  videoInfo
}) => {
  return db.tx(async tx => {
    await tx.VideoRepository.getHasPermission({ userId, channelId });

    let playerStatus = await getCurrentPlayerStatus({
      db: tx,
      channelId
    });
    if (playerStatus.status === "Playing") {
      // Save the current playback status before updating playlist
      playerStatus = await tx.ChannelRepository.updatePlayerStatus({
        ...playerStatus,
        channelId
      });
    }

    const videoId = `${source} ${sourceId}`;
    const video = await tx.VideoRepository.addVideo({
      videoId,
      channelId,
      length,
      videoInfo
    });
    const channelVideo = await tx.VideoRepository.addChannelVideo({
      channelId,
      videoId
    });

    if (channelVideo.queuePosition === 0) {
      // Auto play playlist when the first video in the queue is added
      playerStatus = await tx.ChannelRepository.updatePlayerStatus({
        ...playerStatus,
        clockStartTime: moment().add(BUFFER_TIME, "seconds").format(),
        status: "Playing",
        channelId
      });
    }

    const { videoInfo: dbVideoInfo, ...minVideo } = video;

    return {
      ...channelVideo,
      ...dbVideoInfo,
      ...minVideo,
      playerStatus
    };
  });
};

module.exports.deleteVideo = async ({ userId, channelId, channelVideoId }) => {
  return db.tx(async tx => {
    await tx.VideoRepository.getHasPermission({ userId, channelId });

    let playerStatus = await getCurrentPlayerStatus({
      db: tx,
      channelId
    });

    const deletedChannelVideo = await tx.VideoRepository.deleteChannelVideo({
      channelVideoId
    });
    const returning = await tx.VideoRepository.updateQueuePositionsAfterDelete({
      ...deletedChannelVideo
    });

    // Find largest queue position
    const max = returning.reduce(
      (max, pos) => (pos.queuePosition > max ? pos.queuePosition : max),
      0
    );

    if (deletedChannelVideo.queuePosition < playerStatus.queueStartPosition) {
      playerStatus.queueStartPosition -= 1;
    } else if (
      deletedChannelVideo.queuePosition === playerStatus.queueStartPosition
    ) {
      // If the current video is removed, play the next video or end the stream
      playerStatus.clockStartTime = moment()
        .add(BUFFER_TIME, "seconds")
        .format();

      if (playerStatus.queueStartPosition > max) {
        if (LOOP) {
          playerStatus.queueStartPosition = 0;
          playerStatus.videoStartTime = 0;
        } else {
          playerStatus = defaultPlayerStatus();
        }
      }
    }

    playerStatus = await tx.ChannelRepository.updatePlayerStatus({
      ...playerStatus,
      channelId
    });

    return { deletedVideo: deletedChannelVideo, playerStatus };
  });
};

module.exports.getQueue = async ({ channelId }) => {
  return db.VideoRepository.getChannelQueue({ channelId });
};

module.exports.updateQueue = async ({
  userId,
  channelId,
  oldIndex,
  newIndex
}) => {
  if (oldIndex === newIndex) return;

  return db.tx(async tx => {
    await tx.VideoRepository.getHasPermission({ userId, channelId });

    const channelVideo = await tx.VideoRepository.updateQueuePosition({
      channelId,
      oldIndex,
      newIndex
    });

    if (oldIndex > newIndex) {
      await tx.VideoRepository.updateQueuePositionsAfterHighToLowSwap({
        channelId,
        channelVideoId: channelVideo.id,
        oldIndex,
        newIndex
      });
    } else {
      await tx.VideoRepository.updateQueuePositionsAfterLowToHighSwap({
        channelId,
        channelVideoId: channelVideo.id,
        oldIndex,
        newIndex
      });
    }

    let playerStatus = await getCurrentPlayerStatus({
      db: tx,
      channelId
    });

    const { queueStartPosition } = playerStatus;
    let newQueueStartPosition = -1;

    if (playerStatus.status === "Ended") {
      newQueueStartPosition = 0;
    } else if (oldIndex === queueStartPosition) {
      newQueueStartPosition = newIndex;
    } else if (
      newIndex <= queueStartPosition &&
      oldIndex > queueStartPosition
    ) {
      newQueueStartPosition = queueStartPosition + 1;
    } else if (
      oldIndex < queueStartPosition &&
      newIndex >= queueStartPosition
    ) {
      newQueueStartPosition = queueStartPosition - 1;
    }

    if (newQueueStartPosition !== -1) {
      playerStatus = await tx.ChannelRepository.updatePlayerStatus({
        ...playerStatus,
        channelId,
        queueStartPosition: newQueueStartPosition
      });
    } else {
      playerStatus = null;
    }

    return playerStatus;
  });
};
