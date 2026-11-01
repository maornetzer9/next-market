const israelTime = require("../utils/dateFormat");
const { Schema } = require('mongoose');

const cartSchema = new Schema({
    id                  : { type: Number },
    title               : { type: String },
    description         : { type: String },
    category            : { type: String },
    price               : { type: Number },
    rating              : { type: Number },
    stock               : { type: Number },
    quantity            : { type: Number },
    thumbnail           : { type: String },
    createdAt           :
                          {
                              type: String,
                              default:() => israelTime
                          }
});



module.exports = cartSchema