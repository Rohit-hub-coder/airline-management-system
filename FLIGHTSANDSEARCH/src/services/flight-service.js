const CrudService = require('./crud-service');
const { FlightRepository, AirplaneRepository, AirportRepository } = require('../repository/index');
const { compareTime, isValidDate, isFutureDate } = require('../utils/helper');

class FlightService extends CrudService {
    constructor() {
        const flightRepository = new FlightRepository();
        super(flightRepository);
        this.flightRepository = flightRepository;
        this.airplaneRepository = new AirplaneRepository();
        this.airportRepository = new AirportRepository();
    }

    async create(data) {
        try {
            if (!isValidDate(data.departureTime) || !isValidDate(data.arrivalTime)) {
                throw { error: 'Invalid date format provided' };
            }
            if (!isFutureDate(data.departureTime)) {
                throw { error: 'Departure time cannot be in the past' };
            }
            if (!compareTime(data.arrivalTime, data.departureTime)) {
                throw { error: 'Arrival time cannot be less than departure time' };
            }

            const airplane = await this.airplaneRepository.get(data.airplaneId);
            if (!airplane) {
                throw { error: "Airplane with this ID does not exist" };
            }

            const departureAirport = await this.airportRepository.get(data.departureAirportId);
            if (!departureAirport) {
                throw { error: "Departure airport with this ID does not exist" };
            }

            const arrivalAirport = await this.airportRepository.get(data.arrivalAirportId);
            if (!arrivalAirport) {
                throw { error: "Arrival airport with this ID does not exist" };
            }

            const flight = await this.flightRepository.create({
                ...data,
                totalSeats: airplane.capacity
            });

            return flight;
        } catch (error) {
            console.log("Something went wrong at service layer");
            throw {error};
        }
    }

    async getFlights(filter) {
        try {
            const flights = await this.flightRepository.getFlights(filter);
            return flights;
        } catch (error) {
            console.log("Something went wrong at service layer");
            throw {error};
        }
    }
}

module.exports = FlightService;