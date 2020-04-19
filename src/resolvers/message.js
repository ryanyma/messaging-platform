import { PubSub, withFilter } from 'graphql-subscriptions';
import requiresAuth, { requiresTeamAccess } from '../permission';
import pubsub from '../pubsub';
import { Op } from 'sequelize';

const NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE';

export default {
  Message: {
    url: (parent, args, { serverUrl }) => (parent.url ? `${serverUrl}/${parent.url}` : parent.url),
    user: ({ user, userId }, args, { models }) => {
      if (user) {
        return user;
      }

      return models.User.findOne({ where: { id: userId } }, { raw: true });
    },
  },
  Subscription: {
    newChannelMessage: {
      subscribe: requiresTeamAccess.createResolver(
        withFilter(
          () => pubsub.asyncIterator(NEW_CHANNEL_MESSAGE),
          (payload, args) => payload.channelId === args.channelId
        )
      ),
    },
  },
  Query: {
    getMessages: requiresAuth.createResolver(
      async (parent, { cursor, channelId }, { models, user }) => {
        const channel = await models.Channel.findOne({ raw: true, where: { id: channelId } });

        if (!channel.public) {
          const member = await models.PCMember.findOne({
            raw: true,
            where: { channelId, userId: user.id },
          });
          if (!member) {
            throw new Error('Not Authorized');
          }
        }

        const options = {
          order: [['created_at', 'DESC']],
          where: { channelId },
          limit: 35,
        };

        if (cursor) {
          options.where.created_at = {
            [Op.lt]: new Date(parseInt(cursor, 10)).toString(),
          };
        }

        return models.Message.findAll(options, { raw: true });
      }
    ),
  },
  Mutation: {
    createMessage: requiresAuth.createResolver(
      async (parent, { file, ...args }, { models, user }) => {
        try {
          const messageData = args;
          if (file) {
            messageData.filetype = file.type;
            messageData.url = file.path;
          }
          const message = await models.Message.create({
            ...messageData,
            userId: user.id,
          });

          const asyncFunc = async () => {
            const currentUser = await models.User.findOne({
              where: {
                id: user.id,
              },
            });

            pubsub.publish(NEW_CHANNEL_MESSAGE, {
              channelId: args.channelId,
              newChannelMessage: {
                ...message.dataValues,
                user: currentUser.dataValues,
              },
            });
          };

          asyncFunc();
          return true;
        } catch (err) {
          console.log(err);
          return false;
        }
      }
    ),
  },
};
