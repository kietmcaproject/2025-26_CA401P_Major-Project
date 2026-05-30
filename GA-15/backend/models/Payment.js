const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String
    },
    signature: {
        type: String
    },
    pack: {
        type: String,
        enum: ['starter', 'pro', 'elite'],
        required: true
    },
    credits: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['created', 'paid', 'failed'],
        default: 'created'
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
