const { Op } = require('sequelize');
const CrudRepository = require('./crud-repo');
const { Flight, sequelize } = require('../models/index');

class FlightRepository extends CrudRepository {
    constructor() {
        super(Flight);
    }

    #createFilter(data) {
        let filter = {};

        if (data.departureAirportId) {
            filter.departureAirportId = data.departureAirportId;
        }
        if (data.arrivalAirportId) {
            filter.arrivalAirportId = data.arrivalAirportId;
        }

        let priceFilter = [];
        if (data.minPrice) {
            priceFilter.push({ price: { [Op.gte]: data.minPrice } });
        }
        if (data.maxPrice) {
            priceFilter.push({ price: { [Op.lte]: data.maxPrice } });
        }
        if (priceFilter.length > 0) {
            Object.assign(filter, { [Op.and]: priceFilter });
        }

        if (data.departureDate) {
            const startDate = new Date(data.departureDate);
            const endDate = new Date(data.departureDate);
            endDate.setDate(endDate.getDate() + 1);
            filter.departureTime = {
                [Op.gte]: startDate,
                [Op.lt]: endDate
            };
        }

        return filter;
    }

    // Base class ka get() sirf ID se dhoondhta hai, associations include nahi karta
    // Flight ke liye humein airplane/airport ka data bhi chahiye, isliye override kiya
    async get(flightId) {
        try {
            const flight = await Flight.findByPk(flightId, {
                include: [
                    { association: 'airplane' },
                    { association: 'departureAirport' },
                    { association: 'arrivalAirport' }
                ]
            });
            return flight;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw {error};
        }
    }

    async getFlights(filterData) {
        try {
            const filter = this.#createFilter(filterData);
            const response = await Flight.findAll({
                where: filter,
                include: [
                    { association: 'airplane' },
                    { association: 'departureAirport' },
                    { association: 'arrivalAirport' }
                ],
                order: [['price', 'ASC']]
            });
            return response;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw {error};
        }
    }

    async update(flightId, data) {
        try {
            if (data.decrementSeats !== undefined) {
                const seatsToDecrement = Number(data.decrementSeats);
                if (!Number.isInteger(seatsToDecrement) || seatsToDecrement <= 0) {
                    throw { error: 'decrementSeats must be a positive integer' };
                }

                // Enforce totalSeats >= N unconditionally so capacity can never drop below zero
                const whereClause = {
                    id: flightId,
                    totalSeats: { [Op.gte]: seatsToDecrement }
                };

                const [affectedRows] = await Flight.update(
                    { totalSeats: sequelize.literal(`totalSeats - ${seatsToDecrement}`) },
                    { where: whereClause }
                );

                if (affectedRows === 0) {
                    const flightExists = await Flight.findByPk(flightId);
                    if (!flightExists) {
                        throw { error: 'Flight not found' };
                    }
                    throw { error: 'Insufficient seats available' };
                }

                return await Flight.findByPk(flightId);
            }

            if (data.incrementSeats !== undefined) {
                const seatsToIncrement = Number(data.incrementSeats);
                if (!Number.isInteger(seatsToIncrement) || seatsToIncrement <= 0) {
                    throw { error: 'incrementSeats must be a positive integer' };
                }

                const [affectedRows] = await Flight.update(
                    { totalSeats: sequelize.literal(`totalSeats + ${seatsToIncrement}`) },
                    { where: { id: flightId } }
                );

                if (affectedRows === 0) {
                    throw { error: 'Flight not found' };
                }

                return await Flight.findByPk(flightId);
            }

            const flight = await Flight.findByPk(flightId);
            if (!flight) {
                throw { error: 'Flight not found' };
            }
            await Flight.update(data, { where: { id: flightId } });
            await flight.reload();
            return flight;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw error;
        }
    }
}

module.exports = FlightRepository;
