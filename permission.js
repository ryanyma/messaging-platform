import { Op } from 'sequelize';

const createResolver = resolver => {
  const baseResolver = resolver;
  baseResolver.createResolver = childResolver => {
    const newResolver = async (parent, args, context, info) => {
      await resolver(parent, args, context, info);
      return childResolver(parent, args, context, info);
    };
    return createResolver(newResolver);
  };
  return baseResolver;
};

// requiresAuth
export default createResolver((parent, args, { user }) => {
  if (!user || !user.id) {
    throw new Error('Not authenticated');
  }
});

export const requiresTeamAccess = createResolver(
  async (parent, { channelId }, { user, models }) => {
    if (!user || !user.id) {
      throw new Error('Not authenticated');
    }

    const channel = await models.Channel.findOne({ where: { id: channelId } });
    const member = await models.Member.findOne({
      where: { teamId: channel.teamId, userId: user.id }
    });
    if (!member) {
      throw new Error('You have to be a member of the team to subcribe to its messages');
    }
  }
);

export const directMessageSubscription = createResolver(
  async (parent, { teamId, userId }, { user, models }) => {
    if (!user || !user.id) {
      throw new Error('Not authenticated');
    }
    console.log('hi');
    console.log(userId, user.id);
    const members = await models.Member.findAll({
      where: {
        teamId,
        [Op.or]: [{ userId }, { userId: user.id }]
      }
    });
    console.log(members.length);
    if (members.length !== 2) {
      console.log('fuck');
      console.log(members.length);
      throw new Error('Something went wrong');
    }
  }
);
