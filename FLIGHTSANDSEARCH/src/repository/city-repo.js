const CrudRepository = require('./crud-repo');
const { City, Airport } = require('../models/index');

class CityRepository extends CrudRepository {
    constructor() {
        super(City);
    }

    // Ye City-specific hai, base class mein nahi hoga — isliye yahin rehta hai
    async createMultipleCities(cities) {
        try {
            const response = await City.bulkCreate(cities);
            return response;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw {error};
        }
    }

    async getCityWithAirports(cityId) {
        try {
            const city = await City.findByPk(cityId, {
                include: {
                    association: 'airports'
                }
            });
            return city;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw {error};
        }
    }
}

module.exports = CityRepository;