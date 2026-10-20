const { ClientErrorCodes } = require('../utils/error-codes');

const validateCreateAirplane = (req, res, next) => {
    if (
        !req.body.modelNumber ||
        !req.body.capacity
    ) {
        return res.status(ClientErrorCodes.BAD_REQUEST).json({
            data: {},
            success: false,
            message: 'Invalid request body for create airplane',
            err: 'Missing mandatory properties to create an airplane'
        });
    }
    next();
}

module.exports = {
    validateCreateAirplane
}
