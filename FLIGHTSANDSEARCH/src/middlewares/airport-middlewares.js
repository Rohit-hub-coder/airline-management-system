const { ClientErrorCodes } = require('../utils/error-codes');

const validateCreateAirport = (req, res, next) => {
    if (
        !req.body.name ||
        !req.body.code ||
        !req.body.address ||
        !req.body.cityId
    ) {
        return res.status(ClientErrorCodes.BAD_REQUEST).json({
            data: {},
            success: false,
            message: 'Invalid request body for create airport',
            err: 'Missing mandatory properties to create an airport'
        });
    }
    next();
}

module.exports = {
    validateCreateAirport
}