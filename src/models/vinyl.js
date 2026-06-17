const mongoose = require('mongoose');

const vinylSchema = new mongoose.Schema(
    {
        serial_number: {
            type: Number,
            unique: true,
            sparse: true,
            index: true
        },
        brand: {
            type: String,
            required: true,
            trim: true
        },
        model: {
            type: String,
            required: true,
            trim: true
        },
        time_record: {
            type: Number,
            required: true,
            min: 0
        },
        qualitydisk: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        collection: 'Vinyl',
        timestamps: true
    }
);

module.exports = mongoose.model('Vinyl', vinylSchema);