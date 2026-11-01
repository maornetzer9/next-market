const israelTime = require("../utils/dateFormat");
const { Schema } = require('mongoose');


const ordersSchema = new Schema({
    id            :
                        {
                            type: Number,
                            required: true
                        },
    title            :
                        {
                            type: String,
                            required: true
                        },
    fullName            :
                        {
                            type: String,
                            required: true
                        },
    price              :
                        {
                            type: Number,
                            required: true
                        },
    total              :
                        {
                            type: Number,
                            required: true
                        },
    status             :
                        {
                            type: String,
                            enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
                            default: 'Pending'
                        },
    quantity           :
                        {
                            type: Number,
                            default: 0
                        },
    category           :
                        {
                            type: String,
                            default: ""
                        },

    joinedAt           :
                        {
                            type: String,
                        },
    createAt          :
                        {
                            type: String,
                            default:() => israelTime
                        },
    thumbnail          :
                        {
                            type: String,
                            default: ""
                        }
});


module.exports = ordersSchema;
