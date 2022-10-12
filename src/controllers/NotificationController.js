const NotificationService = require("../services/NotificationService");
const validators = require("../helpers/validators");

const controllers = [
  {
    method: "DELETE",
    path: "/{channelId}",
    options: {
      description: "Deletes chat notification",
      tags: ["api"],
      validate: validators.notifications["DELETE /{channelId}"].req,
      response: {
        status: {
          200: validators.notifications["DELETE /{channelId}"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;

      const deletedNotification = await NotificationService.deleteChatNotification(
        {
          userId,
          channelId
        }
      );

      return (
        deletedNotification || {
          userId,
          channelId
        }
      );
    }
  }
];

const NotificationController = {
  name: "NotificationController",
  version: "1.0.0",
  async register(server, options) {
    server.route(controllers);
  }
};

module.exports = NotificationController;
