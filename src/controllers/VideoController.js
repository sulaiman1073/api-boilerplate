const Joi = require("@hapi/joi");
const { google } = require("googleapis");
const moment = require("moment");
const config = require("../config");
const { WS_EVENTS } = require("../config/constants");
const publisher = require("../config/publisher");
const VideoService = require("../services/VideoService");

const controllers = [
  {
    method: "GET",
    path: "/search",
    options: {
      description: "Search for videos",
      tags: ["api"],
      validate: {
        query: Joi.object()
          .keys({
            source: Joi.string().required(),
            terms: Joi.string(),
            page: Joi.string()
          })
          .required()
      }
    },
    async handler(req, res) {
      const { terms, page } = req.query;

      const api = terms && terms !== "" ? "search" : "videos";

      const parameters = {
        part: "snippet",
        maxResults: 25,
        key: config.youtubeApiKey
      };
      if (terms && terms !== "") {
        parameters.q = terms;
        parameters.type = "video";
      } else {
        parameters.chart = "mostPopular";
      }
      if (page) {
        parameters.pageToken = page;
      }

      try {
        const youtube = google.youtube("v3");
        const response = await youtube[api].list(parameters);

        const results = response.data.items.map(i => {
          const id = i.id.videoId ? i.id.videoId : i.id;

          return {
            id,
            url: `https://www.youtube.com/watch?v=${id}`,
            publishedAt: i.snippet.publishedAt,
            title: i.snippet.title,
            thumbnail: i.snippet.thumbnails.high.url
          };
        });

        return res
          .response({
            nextPageToken: response.data.nextPageToken,
            prevPageToken: response.data.prevPageToken,
            totalResults: response.data.pageInfo.totalResults,
            results
          })
          .code(201);
      } catch (err) {
        return res
          .response({
            error: err
          })
          .code(500);
      }
    }
  },
  {
    method: "GET",
    path: "/queue/{channelId}",
    options: {
      description: "Gets the channel queue",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            channelId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      }
    },
    async handler(req, res) {
      const { channelId } = req.params;
      const queue = await VideoService.getQueue({ channelId });
      return res.response({ queue }).code(201);
    }
  },
  {
    method: "POST",
    path: "/{channelId}",
    options: {
      description: "Adds a video to a channel queue",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            channelId: Joi.string()
              .uuid()
              .required()
          })
          .required(),
        payload: Joi.object()
          .keys({
            source: Joi.string().required(),
            sourceId: Joi.string().required(),
            length: Joi.number(),
            videoInfo: Joi.string().required()
          })
          .required()
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      const videoInfo = req.payload;

      try {
        const youtube = google.youtube("v3");
        const response = await youtube.videos.list({
          part: "contentDetails",
          id: videoInfo.sourceId,
          key: config.youtubeApiKey
        });

        const length = response.data.items[0].contentDetails.duration;
        videoInfo.length = moment.duration(length).asSeconds();

        const { playerStatus, ...video } = await VideoService.addVideo({
          userId,
          channelId,
          ...videoInfo
        });

        const payload = { channelId, video, updatedChannel: playerStatus };

        publisher({
          type: WS_EVENTS.VIDEO_CONTROL.ADD_VIDEO,
          channelId,
          initiator: userId,
          payload
        });

        return res.response(payload).code(201);
      } catch (err) {
        return res
          .response({
            error: err
          })
          .code(500);
      }
    }
  },
  {
    method: "PUT",
    path: "/{channelId}",
    options: {
      description: "Updates video order in a channel queue",
      tags: ["api"],
      payload: { multipart: { output: "annotated" } },
      plugins: {
        "hapi-swagger": {
          payloadType: "form"
        }
      },
      validate: {
        params: Joi.object()
          .keys({
            channelId: Joi.string()
              .uuid()
              .required()
          })
          .required(),
        payload: Joi.object()
          .keys({
            oldIndex: Joi.number().required(),
            newIndex: Joi.number().required()
          })
          .required()
      },
      response: {
        status: {
          201: Joi.object()
            .keys({
              channelId: Joi.string()
                .uuid()
                .required(),
              oldIndex: Joi.number().required(),
              newIndex: Joi.number().required()
            })
            .required()
            .label("updateQueueResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      const { oldIndex, newIndex } = req.payload;
      const playerStatus = await VideoService.updateQueue({
        userId,
        channelId,
        oldIndex,
        newIndex
      });

      const payload = {
        channelId,
        oldIndex,
        newIndex,
        updatedChannel: playerStatus
      };

      publisher({
        type: WS_EVENTS.VIDEO_CONTROL.REORDER_QUEUE,
        channelId,
        initiator: userId,
        payload
      });

      return payload;
    }
  },
  {
    method: "DELETE",
    path: "/{channelVideoId}",
    options: {
      description: "Deletes a video from a channel queue",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            channelVideoId: Joi.string()
              .uuid()
              .required()
          })
          .required(),
        payload: Joi.object()
          .keys({
            channelId: Joi.string().required()
          })
          .required()
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelVideoId } = req.params;
      const { channelId } = req.payload;

      const { deletedVideo, playerStatus } = await VideoService.deleteVideo({
        userId,
        channelId,
        channelVideoId
      });

      const payload = { ...deletedVideo, updatedChannel: playerStatus };

      publisher({
        type: WS_EVENTS.VIDEO_CONTROL.DELETE_VIDEO,
        channelId,
        initiator: userId,
        payload
      });

      return payload;
    }
  }
];

const VideoController = {
  name: "VideoController",
  version: "1.0.0",
  async register(server, options) {
    server.route(controllers);
  }
};

module.exports = VideoController;
