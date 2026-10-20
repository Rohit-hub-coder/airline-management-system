const CrudService = require('./crud-service');
const { CityRepository } = require('../repository/index');

class CityService extends CrudService {
    constructor() {
        const cityRepository = new CityRepository();
        super(cityRepository);
        this.cityRepository = cityRepository;
    }

    async createMultipleCities(data) {
        try {
            const response = await this.cityRepository.createMultipleCities(data);
            return response;
        } catch (error) {
            console.log("Something went wrong at service layer");
            throw {error};
        }
    }

    async getCityWithAirports(cityId) {
        try {
            const city = await this.cityRepository.getCityWithAirports(cityId);
            return city;
        } catch (error) {
            console.log("Something went wrong at service layer");
            throw {error};
        }
    }
}

module.exports = CityService;