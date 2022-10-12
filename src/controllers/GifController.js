const Joi = require("@hapi/joi");
const axios = require("axios");
const config = require("../config");

const controllers = [
  {
    method: "GET",
    path: "/trending/{offset}",
    options: {
      description: "Get trending gifs",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            offset: Joi.number()
              .integer()
              .min(0)
              .required()
          })
          .required()
      },
      response: {
        status: {
          200: Joi.array()
            .required()
            .label("getTrendingGifs")
        }
      }
    },
    async handler(req, res) {
      const { offset } = req.params;
      const response = await axios.get(
        `https://api.giphy.com/v1/gifs/trending?api_key=${config.giphyApiKey}&limit=10&offset=${offset}&rating=pg-13`
      );
      return response.data.data.map(gif => ({
        id: gif.id,
        title: gif.title,
        image: gif.images.fixed_height_downsampled.url
      }));
    }
  },
  {
    method: "GET",
    path: "/search",
    options: {
      description: "Search for gifs",
      tags: ["api"],
      validate: {
        query: Joi.object()
          .keys({
            // Matches alphanumeric, space, underscore and hyphen.
            searchTerm: Joi.string()
              .pattern(new RegExp("^[A-Za-z0-9? ,_-]+$"))
              .required(),
            offset: Joi.number()
              .integer()
              .min(0)
              .required()
          })
          .optional()
      },
      response: {
        status: {
          200: Joi.array()
            .required()
            .label("searchGifs")
        }
      }
    },
    async handler(req, res) {
      const { searchTerm, offset } = req.query;
      const response = await axios.get(
        `https://api.giphy.com/v1/gifs/search?api_key=${config.giphyApiKey}&q=${searchTerm}&limit=10&offset=${offset}&rating=pg-13&lang=en`
      );
      return response.data.data.map(gif => ({
        id: gif.id,
        title: gif.title,
        image: gif.images.fixed_height_downsampled.url
      }));
    }
  }
];

const GifController = {
  name: "GifController",
  version: "1.0.0",
  async register(server, options) {
    server.route(controllers);
  }
};

module.exports = GifController;
