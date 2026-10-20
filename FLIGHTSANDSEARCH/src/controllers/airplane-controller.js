const { AirplaneService } = require('../services/index');
const airplaneService = new AirplaneService();

const create = async (req, res) => {
    try {
        const airplane = await airplaneService.create(req.body);
        return res.status(201).json({
            success: true,
            message: "Successfully created an airplane",
            data: airplane,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating airplane",
            data: {},
            err: error
        });
    }
};

const get = async (req, res) => {
    try {
        const airplaneId = req.params.id;
        const airplane = await airplaneService.get(airplaneId);
        return res.status(200).json({
            success: true,
            message: "Successfully fetched an airplane",
            data: airplane,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching airplane",
            data: {},
            err: error
        });
    }
};

const getAll = async (req, res) => {
    try {
        const airplanes = await airplaneService.getAll();
        return res.status(200).json({
            success: true,
            message: "Successfully fetched all airplanes",
            data: airplanes,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching airplanes",
            data: {},
            err: error
        });
    }
};

const destroy = async (req, res) => {
    try {
        const airplaneId = req.params.id;
        await airplaneService.destroy(airplaneId);
        return res.status(200).json({
            success: true,
            message: "Successfully deleted the airplane",
            data: {},
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting airplane",
            data: {},
            err: error
        });
    }
};

const update = async (req, res) => {
    try {
        const airplaneId = req.params.id;
        const airplane = await airplaneService.update(airplaneId, req.body);
        return res.status(200).json({
            success: true,
            message: "Successfully updated the airplane",
            data: airplane,
            err: {}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating airplane",
            data: {},
            err: error
        });
    }
};

module.exports = { create, get, getAll, destroy, update };