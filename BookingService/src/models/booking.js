module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    flightId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('In Process', 'Pending Payment', 'Booked', 'Cancelled'),
      allowNull: false,
      defaultValue: 'In Process'
    },
    noOfSeats: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalCost: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    tableName: 'bookings',
    timestamps: true
  });

  return Booking;
};
