export default {
  Mutation: {
    createMessage: async (parent, args, { models, user }) => {
      try {
        await models.Message.create({
          ...args,
          user_id: user.id,
        });
        return true;
      } catch (err) {
        return false;
      }
    },
  },
};
