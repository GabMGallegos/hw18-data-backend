const express = require('express');
const mongoose = require('mongoose');
const Vinyl = require('../models/vinyl');

const router = express.Router();

function parseNumber(value, fieldName) {
    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue)) {
        const error = new Error(`${fieldName} must be a number`);
        error.statusCode = 400;
        throw error;
    }

    return parsedValue;
}

async function getNextVinylId() {
    const lastVinyl = await Vinyl.findOne({ serial_number: { $type: 'number' } })
        .sort({ serial_number: -1 })
        .select('serial_number -_id')
        .lean();

    return (lastVinyl?.serial_number || 0) + 1;
}

router.get('/health', (req, res) => {
    res.json({
        service: 'hw18-data-backend',
        status: 'running',
        databaseState: mongoose.connection.readyState
    });
});

router.get('/vinyls', async (req, res, next) => {
    try {
        const vinyls = await Vinyl.find().sort({ serial_number: 1 });
        res.json(vinyls);
    } catch (error) {
        next(error);
    }
});

router.get('/vinyls/name-fields', async (req, res, next) => {
    try {
        const vinyls = await Vinyl.find({}, 'serial_number brand -_id').sort({ serial_number: 1 });
        res.json(vinyls);
    } catch (error) {
        next(error);
    }
});

router.get('/vinyls/age-fields', async (req, res, next) => {
    try {
        const vinyls = await Vinyl.find({}, 'serial_number brand time_record -_id').sort({ serial_number: 1 });
        res.json(vinyls);
    } catch (error) {
        next(error);
    }
});

router.get('/vinyls/qualitydisk-fields', async (req, res, next) => {
    try {
        const vinyls = await Vinyl.find({}, 'serial_number brand qualitydisk -_id').sort({ serial_number: 1 });
        res.json(vinyls);
    } catch (error) {
        next(error);
    }
});

router.get('/vinyls/qualitydisk/total', async (req, res, next) => {
    try {
        const result = await Vinyl.aggregate([
            {
                $group: {
                    _id: null,
                    totalMoneySpent: { $sum: '$qualitydisk' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalMoneySpent: 1
                }
            }
        ]);

        res.json(result[0] || { totalMoneySpent: 0 });
    } catch (error) {
        next(error);
    }
});

router.get('/vinyls/count', async (req, res, next) => {
    try {
        const totalVinyls = await Vinyl.countDocuments();
        res.json({ totalVinyls });
    } catch (error) {
        next(error);
    }
});

router.get('/vinyls/summary', async (req, res, next) => {
    try {
        const result = await Vinyl.aggregate([
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    totalMoneySpent: { $sum: '$moneySpent' },
                    averageMoneySpent: { $avg: '$moneySpent' },
                    averageAge: { $avg: '$age' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalCustomers: 1,
                    totalMoneySpent: 1,
                    averageMoneySpent: 1,
                    averageAge: 1
                }
            }
        ]);

        res.json(result[0] || {
            totalCustomers: 0,
            totalMoneySpent: 0,
            averageMoneySpent: 0,
            averageAge: 0
        });
    } catch (error) {
        next(error);
    }
});

router.get('/vinyls/by-name/:name', async (req, res, next) => {
    try {
        const { name } = req.params;
        const customers = await Vinyl.find({
            name: { $regex: name, $options: 'i' }
        }).sort({ id: 1 });

        res.json(customers);
    } catch (error) {
        next(error);
    }
});

router.get('/vinyls/by-age/:age', async (req, res, next) => {
    try {
        const age = parseNumber(req.params.age, 'Age');
        const customers = await Vinyl.find({ age }).sort({ id: 1 });
        res.json(customers);
    } catch (error) {
        next(error);
    }
});

router.get('/vinyls/by-money-spent-range/:min/:max', async (req, res, next) => {
    try {
        const min = parseNumber(req.params.min, 'Minimum money spent');
        const max = parseNumber(req.params.max, 'Maximum money spent');

        if (min > max) {
            return res.status(400).json({
                message: 'Minimum money spent cannot be greater than maximum money spent'
            });
        }

        const customers = await Vinyl.find({
            moneySpent: {
                $gte: min,
                $lte: max
            }
        }).sort({ id: 1 });

        res.json(customers);
    } catch (error) {
        next(error);
    }
});

router.get('/vinyls/:id', async (req, res, next) => {
    try {
        const id = parseNumber(req.params.id, 'Vinyl id');
        const customer = await Vinyl.findOne({ id });

        if (!customer) {
            return res.status(404).json({ message: 'Vinyl not found' });
        }

        res.json(customer);
    } catch (error) {
        next(error);
    }
});

router.post('/vinyls', async (req, res, next) => {
    try {
        const customerData = {
            id: req.body.id === undefined || req.body.id === null || req.body.id === ''
                ? await getNextCustomerId()
                : parseNumber(req.body.id, 'Vinyl id'),
            name: String(req.body.name).trim(),
            age: parseNumber(req.body.age, 'Age'),
            moneySpent: parseNumber(req.body.moneySpent, 'Money spent')
        };

        const customer = await Vinyl.create(customerData);
        res.status(201).json(customer);
    } catch (error) {
        if (error.code === 11000) {
            error.statusCode = 409;
            error.message = 'A customer with that id already exists';
        }
        next(error);
    }
});

router.put('/vinyls/:id', async (req, res, next) => {
    try {
        const id = parseNumber(req.params.id, 'Vinyl id');
        const updateData = {};

        if (req.body.name !== undefined) {
            updateData.name = String(req.body.name).trim();
        }

        if (req.body.age !== undefined) {
            updateData.age = parseNumber(req.body.age, 'Age');
        }

        if (req.body.moneySpent !== undefined) {
            updateData.moneySpent = parseNumber(req.body.moneySpent, 'Money spent');
        }

        const customer = await Vinyl.findOneAndUpdate(
            { id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Vinyl not found' });
        }

        res.json(customer);
    } catch (error) {
        next(error);
    }
});

router.delete('/customers/:id', async (req, res, next) => {
    try {
        const id = parseNumber(req.params.id, 'Vinyl id');
        const customer = await Vinyl.findOneAndDelete({ id });

        if (!customer) {
            return res.status(404).json({ message: 'Vinyl not found' });
        }

        res.json({
            message: 'Vinyl deleted successfully',
            customer
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
