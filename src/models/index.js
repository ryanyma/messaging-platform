import Sequelize from 'sequelize';

const sequelize = new Sequelize('messaging_platform', 'postgres', 'postgres', {
  dialect: 'postgres',
  operatorsAliases: Sequelize.Op,
  host: process.env.DB_HOST || 'localhost',
  define: {
    underscored: true,
  },
});

const models = {
  User: sequelize.import('./user'),
  Channel: sequelize.import('./channel'),
  Message: sequelize.import('./message'),
  Member: sequelize.import('./member'),
  Team: sequelize.import('./team'),
  DirectMessage: sequelize.import('./directMessage'),
  PCMember: sequelize.import('./pcmember'),
};

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

export default models;
