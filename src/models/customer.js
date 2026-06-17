const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            unique: true,
            sparse: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        age: {
            type: Number,
            required: true,
            min: 0
        },
        moneySpent: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        collection: 'Customer',
        timestamps: true
    }
);

module.exports = mongoose.model('Customer', customerSchema);
