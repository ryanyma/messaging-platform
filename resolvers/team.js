import formatErrors from '../formatErrors';
import requiresAuth from '../permission';

export default {
  Query: {
    allTeams: requiresAuth.createResolver(
      async (parent, args, { models, user }) => {
        const allTeams = await models.Team.findAll(
          { where: { owner: user.id } },
          { raw: true },
        );
        return allTeams;
      },
    ),
    invitedTeams: requiresAuth.createResolver(async (parent, args, { models, user }) => models.sequelize.query('select * from teams join members on id = team_id where user_id = ?', {
      replacements: [user.id],
      model: models.Team,
    })),
  },
  Mutation: {
    addTeamMember: requiresAuth.createResolver(
      async (parent, { email, teamId }, { models, user }) => {
        try {
          const teamPromise = models.Team.findOne(
            { where: { id: teamId } },
            { raw: true },
          );
          const userToAddPromise = models.User.findOne(
            { where: { email } },
            { raw: true },
          );
          const [team, userToAdd] = await Promise.all([
            teamPromise,
            userToAddPromise,
          ]);

          if (team.owner !== user.id) {
            return {
              ok: false,
              errors: [
                {
                  path: 'email',
                  message:
                    'You do not have the permission to add members to the team',
                },
              ],
            };
          }

          if (!userToAdd) {
            return {
              ok: false,
              errors: [
                {
                  path: 'email',
                  message: 'Could not find this user with this email',
                },
              ],
            };
          }

          await models.Member.create({ userId: userToAdd.id, teamId });

          return {
            ok: true,
          };
        } catch (err) {
          console.log(err);
          return {
            ok: false,
            errors: formatErrors(err, models),
          };
        }
      },
    ),
    createTeam: requiresAuth.createResolver(
      async (parent, args, { models, user }) => {
        try {
          const response = await models.sequelize.transaction(async () => {
            const team = await models.Team.create({ ...args, owner: user.id });
            await models.Channel.create({
              name: 'general',
              public: true,
              teamId: team.id,
            });
            return team;
          });
          console.log(response);
          return {
            ok: true,
            team: response,
          };
        } catch (err) {
          console.log(err);
          return {
            ok: false,
            errors: formatErrors(err, models),
          };
        }
      },
    ),
  },
  Team: {
    channels: ({ id }, args, { models }) => models.Channel.findAll({ where: { teamId: id } }),
  },
};
