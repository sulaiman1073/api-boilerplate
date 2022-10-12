const queries = require("../queries");

class VideoRepository {
  constructor(db) {
    this.db = db;
  }

  async getHasPermission({ userId, channelId }) {
    return this.db.one(queries.getHasPermission, {
      channelId,
      userId
    });
  }

  async getChannelQueue({ channelId }) {
    return this.db.one(queries.getChannelQueue, [channelId]);
  }

  async addVideo({ videoId, length, videoInfo }) {
    return this.db.one(queries.addVideo, [videoId, length, videoInfo]);
  }

  async addChannelVideo({ channelId, videoId }) {
    return this.db.one(queries.addChannelVideo, [channelId, videoId]);
  }

  async deleteChannelVideo({ channelVideoId }) {
    return this.db.one(queries.deleteChannelVideo, { channelVideoId });
  }

  async updateQueuePosition({ channelId, oldIndex, newIndex }) {
    return this.db.one(queries.updateQueuePosition, {
      channelId,
      oldIndex,
      newIndex
    });
  }

  async updateQueuePositionsAfterDelete({ channelId, queuePosition }) {
    return this.db.any(queries.updateQueuePositionsAfterDelete, {
      channelId,
      queuePosition
    });
  }

  async updateQueuePositionsAfterHighToLowSwap({
    channelId,
    channelVideoId,
    oldIndex,
    newIndex
  }) {
    return this.db.any(queries.updateQueuePositionsAfterHighToLowSwap, {
      channelId,
      channelVideoId,
      oldIndex,
      newIndex
    });
  }

  async updateQueuePositionsAfterLowToHighSwap({
    channelId,
    channelVideoId,
    oldIndex,
    newIndex
  }) {
    return this.db.any(queries.updateQueuePositionsAfterLowToHighSwap, {
      channelId,
      channelVideoId,
      oldIndex,
      newIndex
    });
  }

  async getVideosInfo({ channelIds, userId }) {
    return this.db.one(queries.getVideosInfo, [channelIds, userId]);
  }
}

module.exports = VideoRepository;
