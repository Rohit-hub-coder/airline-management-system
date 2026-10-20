module.exports = (sequelize, DataTypes) => {
  const Outbox = sequelize.define('Outbox', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    payload: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Sent'),
      allowNull: false,
      defaultValue: 'Pending'
    }
  }, {
    tableName: 'outbox',
    timestamps: true
  });

  return Outbox;
};
