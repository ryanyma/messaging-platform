export default (sequelize, DataTypes) => {
  const Channel = sequelize.define('channel', {
    name: DataTypes.STRING,
    public: DataTypes.BOOLEAN,
  });

  Channel.associate = (models) => {
    Channel.belongsTo(models.Team, {
      foreignKey: 'team_id',
    });
  };

  return Channel;
};