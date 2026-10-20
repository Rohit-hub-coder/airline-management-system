'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Flight extends Model {
    static associate(models) {
      this.belongsTo(models.Airplane, {
        foreignKey: 'airplaneId',
        as: 'airplane'
      });
      this.belongsTo(models.Airport, {
        foreignKey: 'departureAirportId',
        as: 'departureAirport'
      });
      this.belongsTo(models.Airport, {
        foreignKey: 'arrivalAirportId',
        as: 'arrivalAirport'
      });
    }
  }
  Flight.init({
    flightNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    airplaneId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Airplanes',
            key: 'id'
        }
    },
    departureAirportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Airports',
            key: 'id'
        }
    },
    arrivalAirportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Airports',
            key: 'id'
        }
    },
    arrivalTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    departureTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    boardingGate: {
        type: DataTypes.STRING
    },
    totalSeats: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Flight',
  });
  return Flight;
};