const { CityService } = require('../services/index');
const cityService = new CityService();

const create = async (req, res) => {
    try {
        const city = await cityService.create(req.body);
        return res.status(201).json({
            success: true,
            message: "Successfully created a city",
            data: city,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating city",
            data: {},
            err: error
        });
    }
};

const get = async (req, res) => {
    try {
        const cityId = req.params.id;
        const city = await cityService.get(cityId);
        return res.status(200).json({
            success: true,
            message: "Successfully fetched a city",
            data: city,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching city",
            data: {},
            err: error
        });
    }
};

const getAll = async (req, res) => {
    try {
        const cities = await cityService.getAll();
        return res.status(200).json({
            success: true,
            message: "Successfully fetched all cities",
            data: cities,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching cities",
            data: {},
            err: error
        });
    }
};

const destroy = async (req, res) => {
    try {
        const cityId = req.params.id;
        await cityService.destroy(cityId);
        return res.status(200).json({
            success: true,
            message: "Successfully deleted the city",
            data: {},
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting city",
            data: {},
            err: error
        });
    }
};

const update = async (req, res) => {
    try {
        const cityId = req.params.id;
        const city = await cityService.update(cityId, req.body);
        return res.status(200).json({
            success: true,
            message: "Successfully updated the city",
            data: city,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating city",
            data: {},
            err: error
        });
    }
};

const createMultipleCity = async (req, res) => {
    try {
        const cities = await cityService.createMultipleCities(req.body);
        return res.status(201).json({
            success: true,
            message: "Successfully created multiple cities",
            data: cities,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating cities",
            data: {},
            err: error
        });
    }
};

const getAirportsOfCity = async (req, res) => {
    try {
        const cityId = req.params.id;
        const city = await cityService.getCityWithAirports(cityId);
        return res.status(200).json({
            success: true,
            message: "Successfully fetched city with airports",
            data: city,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching city with airports",
            data: {},
            err: error
        });
    }
};

module.exports = { create, get, getAll, destroy, update, createMultipleCity, getAirportsOfCity };