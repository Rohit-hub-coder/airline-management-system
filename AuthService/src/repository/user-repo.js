const { User, Role } = require('../models/index');
const ClientError = require('../utils/client-error');
const { StatusCodes } = require('http-status-codes');

class UserRepository {
  async create(data) {
    try {
      const user = await User.create(data);
      return user;
    } catch (error) {
      console.log('Something went wrong in the repository layer');
      throw error;
    }
  }

  async getById(id) {
    try {
      const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
      if (!user) {
        throw new ClientError(
          'AttributeNotFound',
          'User not found',
          'Please check the id, as there is no record of the given id',
          StatusCodes.NOT_FOUND
        );
      }
      return user;
    } catch (error) {
      console.log('Something went wrong in the repository layer');
      throw error;
    }
  }

  async getByEmail(email) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new ClientError(
          'AttributeNotFound',
          'Invalid email sent in the request',
          'Please check the email, as there is no record of the given email',
          StatusCodes.NOT_FOUND
        );
      }
      return user;
    } catch (error) {
      console.log('Something went wrong in the repository layer');
      throw error;
    }
  }

  async delete(id) {
    try {
      await User.destroy({ where: { id } });
      return true;
    } catch (error) {
      console.log('Something went wrong in the repository layer');
      throw error;
    }
  }

  async addRoleToUser(userId, roleId) {
    try {
      const user = await User.findByPk(userId);
      const role = await Role.findByPk(roleId);
      if (!user || !role) {
        throw new ClientError(
          'AttributeNotFound',
          'User or Role not found',
          'Please check the userId and roleId provided',
          StatusCodes.NOT_FOUND
        );
      }
      await user.addRole(role);
      return user;
    } catch (error) {
      console.log('Something went wrong in the repository layer');
      throw error;
    }
  }

  async getUserWithRoles(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: Role
      });
      return user;
    } catch (error) {
      console.log('Something went wrong in the repository layer');
      throw error;
    }
  }
}

module.exports = UserRepository;