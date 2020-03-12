import { PubSub, withFilter } from 'graphql-subscriptions';
import requiresAuth, { requiresTeamAccess } from '../permission';
import { Op } from 'sequelize';

const NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE';

export default {
  DirectMessage: {
    sender: ({ sender, senderId }, args, { models }) => {
      console.log(sender, senderId);
      if (sender) {
        return sender;
      }
      return models.User.findOne({ where: { id: senderId } }, { raw: true });
    }
  },
  //   Subscription: {
  //     newChannelMessage: {
  //       subscribe: requiresTeamAccess.createResolver(
  //         withFilter(
  //           () => pubsub.asyncIterator(NEW_CHANNEL_MESSAGE),
  //           (payload, args) => payload.channelId === args.channelId
  //         )
  //       )
  //     }
  //   },
  Query: {
    directMessages: requiresAuth.createResolver(
      async (parent, { teamId, otherUserId }, { models, user }) =>
        models.DirectMessage.findAll(
          {
            order: [['created_at', 'ASC']],
            where: {
              teamId,
              [Op.or]: [
                {
                  [Op.and]: [{ receiverId: otherUserId }, { senderId: user.id }]
                },
                {
                  [Op.and]: [{ receiverId: user.id }, { senderId: otherUserId }]
                }
              ]
            }
          },
          { raw: true }
        )
    )
  },
  Mutation: {
    createDirectMessage: requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        const directMessage = await models.DirectMessage.create({
          ...args,
          senderId: user.id
        });
        console.log(directMessage);
        // const asyncFunc = async () => {
        //   const currentUser = await models.User.findOne({
        //     where: {
        //       id: user.id,
        //     },
        //   });

        //   pubsub.publish(NEW_CHANNEL_MESSAGE, {
        //     channelId: args.channelId,
        //     newChannelMessage: {
        //       ...message.dataValues,
        //       user: currentUser.dataValues,
        //     },
        //   });
        // };

        // asyncFunc();

        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    })
  }
};
