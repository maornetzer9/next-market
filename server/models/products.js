const { model, Schema } = require('mongoose');
const israelTime = require('../utils/dateFormat');

const purchase = new Schema({
    name        : {
                      type: String,
                      required: true
                  },
    quantity    : {
                    type: Number,
                    required: true,
                    default: 0
                  },
    createAt    : {
                    type: String,
                    default: () => israelTime
                   }
});



const productSchema = new Schema({
    id          :
                 {
                     type: Number,
                     required: true,
                     unique: true,
                 },
    title       :
                 {
                  type: String,
                  default: ''
                 },
    description :
                 {
                   type: String,
                   default: ''
                 },
    price      :
                 {
                   type: Number,
                   default: 0
                 },
    rating      :
                 {
                   type: Number,
                   default: 0
                 },
    reviewsCount :
                 {
                   type: Number,
                   default: 0
                 },
    stock       :
                 {
                   type: Number,
                   default: 0
                 },
    category    :    String,
    thumbnail   :
                 {
                    type: String,
                    default: ''
                 } ,
    purchases   :
                 {
                     type: [ purchase ],
                     default: []
                 },

    bought      :
                 {
                    type: Number,
                    default: 0
                 },
    total       :
                 {
                    type: Array,
                    default: []
                 }
});

const Products = model('Products', productSchema);

module.exports = Products;
