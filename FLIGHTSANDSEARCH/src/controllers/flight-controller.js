const { FlightService } = require('../services/index');
const { SuccessCodes, ServerErrorCodes } = require('../utils/error-codes');

const flightService = new FlightService();

const create = async (req, res) => {
    try {
        const flightRequestData = {
            flightNumber: req.body.flightNumber,
            airplaneId: req.body.airplaneId,
            departureAirportId: req.body.departureAirportId,
            arrivalAirportId: req.body.arrivalAirportId,
            arrivalTime: req.body.arrivalTime,
            departureTime: req.body.departureTime,
            price: req.body.price
        }
        const flight = await flightService.create(flightRequestData);
        return res.status(SuccessCodes.CREATED).json({
            data: flight,
            success: true,
            err: {},
            message: 'Successfully created a flight'
        });
    } catch (error) {
        console.log(error);
        return res.status(ServerErrorCodes.INTERNAL_SERVER_ERROR).json({
            data: {},
            success: false,
            message: 'Not able to create a flight',
            err: error
        });
    }
};

const get = async (req, res) => {
    try {
        const flightId = req.params.id;
        const flight = await flightService.get(flightId);
        return res.status(SuccessCodes.OK).json({
            success: true,
            message: "Successfully fetched a flight",
            data: flight,
            err: {}
        });
    } catch (error) {
        return res.status(ServerErrorCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong while fetching flight",
            data: {},
            err: error
        });
    }
};

const getAll = async (req, res) => {
    try {
        const flights = await flightService.getAll();
        return res.status(SuccessCodes.OK).json({
            success: true,
            message: "Successfully fetched all flights",
            data: flights,
            err: {}
        });
    } catch (error) {
        return res.status(ServerErrorCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong while fetching flights",
            data: {},
            err: error
        });
    }
};

const destroy = async (req, res) => {
    try {
        const flightId = req.params.id;
        await flightService.destroy(flightId);
        return res.status(SuccessCodes.OK).json({
            success: true,
            message: "Successfully deleted the flight",
            data: {},
            err: {}
        });
    } catch (error) {
        return res.status(ServerErrorCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong while deleting flight",
            data: {},
            err: error
        });
    }
};

const update = async (req, res) => {
    try {
        const flightId = req.params.id;
        const flight = await flightService.update(flightId, req.body);
        return res.status(SuccessCodes.OK).json({
            success: true,
            message: "Successfully updated the flight",
            data: flight,
            err: {}
        });
    } catch (error) {
        return res.status(ServerErrorCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong while updating flight",
            data: {},
            err: error
        });
    }
};

const getFlights = async (req, res) => {
    try {
        const flights = await flightService.getFlights(req.query);
        return res.status(SuccessCodes.OK).json({
            success: true,
            message: "Successfully fetched flights",
            data: flights,
            err: {}
        });
    } catch (error) {
        return res.status(ServerErrorCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong while fetching flights",
            data: {},
            err: error
        });
    }
};

module.exports = { create, get, getAll, destroy, update, getFlights };