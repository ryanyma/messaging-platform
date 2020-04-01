import { withFilter } from 'graphql-subscriptions';
import requiresAuth, { directMessageSubscription } from '../permission';
import { Op } from 'sequelize';

import pubsub from '../pubsub';

const NEW_DIRECT_MESSAGE = 'NEW_DIRECT_MESSAGE';

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

  Subscription: {
    newDirectMessage: {
      subscribe: directMessageSubscription.createResolver(
        withFilter(
          () => pubsub.asyncIterator(NEW_DIRECT_MESSAGE),
          (payload, args, { user }) =>
            payload.teamId === args.teamId &&
            ((payload.senderId === user.id && payload.receiverId === args.userId) ||
              (payload.senderId === args.userId && payload.receiverId === user.id))
        )
      )
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

        pubsub.publish(NEW_DIRECT_MESSAGE, {
          teamId: args.teamId,
          senderId: user.id,
          receiverId: args.receiverId,
          newDirectMessage: {
            ...directMessage.dataValues,
            sender: {
              username: user.username
            }
          }
        });

        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    })
  }
};
