const { Op } = require('sequelize');
const CrudRepository = require('./crud-repo');
const { Flight } = require('../models/index');

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
            const flight = await Flight.findByPk(flightId);
            if (!flight) {
                throw { error: 'Flight not found' };
            }
            if (data.decrementSeats !== undefined) {
                const seatsToDecrement = Number(data.decrementSeats);
                if (data.reserveIfAvailable && flight.totalSeats < seatsToDecrement) {
                    throw { error: 'Insufficient seats available' };
                }
                await flight.decrement('totalSeats', { by: seatsToDecrement });
                await flight.reload();
                return flight;
            }
            if (data.incrementSeats !== undefined) {
                const seatsToIncrement = Number(data.incrementSeats);
                await flight.increment('totalSeats', { by: seatsToIncrement });
                await flight.reload();
                return flight;
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