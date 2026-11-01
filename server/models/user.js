const { model, Schema } = require('mongoose');
const { hashPassword} = require('../utils/bcrypt');
const ordersSchema = require('./orders');
const cartSchema = require('./cart');
const israelTime = require('../utils/dateFormat');

const user = new Schema({
    role            :
                     {
                        type: String,
                        default: 'User'
                     },
    firstName       :
                     {
                        type: String,
                        required: true
                     },
    lastName        :
                     {
                        type: String,
                        required: true
                     },
    username        :
                     {
                        type: String,
                        required: true
                     },
    cart            :{
                        items :
                               {
                                   type: [ cartSchema ],
                                   default: []
                               },
                        total :
                               {
                                   type: Number,
                                   default: 0
                               }
                     },
    orders          :
                     {
                        type: [ ordersSchema ],
                        default: []
                     },
    password        :
                     {
                        type: String,
                        required: true,
                        set: hashPassword
                     },
    isAuth          :
                     {
                        type: Boolean,
                        default : false
                     },
    checked         :
                     {
                        type: Boolean,
                        default : false
                     },
    token           :
                     {
                        type: String,
                     },
    createAt        :
                     {
                        type: String,
                        default:() => israelTime
                     },
})

const User = model('users', user);

module.exports = { User };