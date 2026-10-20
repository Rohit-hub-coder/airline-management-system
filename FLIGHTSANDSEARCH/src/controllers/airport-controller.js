const { AirportService } = require('../services/index');
const airportService = new AirportService();

const create = async (req, res) => {
    try {
        const airport = await airportService.create(req.body);  // pehle: createAirport
        return res.status(201).json({
            success: true,
            message: "Successfully created an airport",
            data: airport,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating airport",
            data: {},
            err: error
        });
    }
};

const get = async (req, res) => {
    try {
        const airportId = req.params.id;
        const airport = await airportService.get(airportId);  // pehle: getAirport
        return res.status(200).json({
            success: true,
            message: "Successfully fetched an airport",
            data: airport,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching airport",
            data: {},
            err: error
        });
    }
};

const destroy = async (req, res) => {
    try {
        const airportId = req.params.id;
        await airportService.destroy(airportId);  // pehle: deleteAirport
        return res.status(200).json({
            success: true,
            message: "Successfully deleted the airport",
            data: {},
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting airport",
            data: {},
            err: error
        });
    }
};

const update = async (req, res) => {
    try {
        const airportId = req.params.id;
        const airport = await airportService.update(airportId, req.body);  // pehle: updateAirport
        return res.status(200).json({
            success: true,
            message: "Successfully updated the airport",
            data: airport,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating airport",
            data: {},
            err: error
        });
    }
};

module.exports = { create, get, destroy, update };