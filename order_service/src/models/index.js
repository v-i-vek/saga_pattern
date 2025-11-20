/**
 * Models should only contain schema definitions and not handle DB connections.
 * Define your model files here (e.g. order.js) which export functions that
 * receive a `sequelize` instance and DataTypes and return a model.
 *
 * Example model file (src/models/order.js):
 * module.exports = (sequelize, DataTypes) => {
 *   return sequelize.define('Order', { total: DataTypes.DECIMAL }, {});
 * };
 *
 * You can create an index file that imports/initializes those models when
 * you have a sequelize instance available (from src/config/db.js).
 */

module.exports = {};
