const { model, Schema } = require('mongoose');

const checkoutRequestSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    keyHash: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

checkoutRequestSchema.index({ userId: 1, keyHash: 1 }, { unique: true });

const CheckoutRequest = model('checkout_requests', checkoutRequestSchema);

module.exports = CheckoutRequest;
