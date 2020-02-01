import bcrypt from 'bcrypt';

export default (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    username: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isAlphanumeric: {
          args: true,
          msg: 'The username can only contain letters and numbers.',
        },
        len: {
          args: [2, 25],
          msg: 'The username needs to be between 2 and 25 characters long.',
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: {
          args: true,
          msg: 'Invalid email',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [2, 25],
          msg: 'The password needs to be between 2 and 25 characters long.',
        },
      },
    },
  },
  {
    hooks: {
      afterValidate: async (user) => {
        // eslint-disable-next-line no-param-reassign
        user.password = await bcrypt.hash(user.password, 12);
      },
    },
  });

  User.associate = (models) => {
    User.belongsToMany(models.Team, {
      through: 'member',
      foreignKey: 'user_id',
    });
    User.belongsToMany(models.Channel, {
      through: 'channel_member',
      foreignKey: 'user_id',
    });
  };

  return User;
};
