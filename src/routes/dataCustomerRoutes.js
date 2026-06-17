const express = require('express');
const mongoose = require('mongoose');
const Customer = require('../models/customer');

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

async function getNextCustomerId() {
    const lastCustomer = await Customer.findOne({ id: { $type: 'number' } })
        .sort({ id: -1 })
        .select('id -_id')
        .lean();

    return (lastCustomer?.id || 0) + 1;
}

router.get('/health', (req, res) => {
    res.json({
        service: 'hw18-data-backend',
        status: 'running',
        databaseState: mongoose.connection.readyState
    });
});

router.get('/customers', async (req, res, next) => {
    try {
        const customers = await Customer.find().sort({ id: 1 });
        res.json(customers);
    } catch (error) {
        next(error);
    }
});

router.get('/customers/name-fields', async (req, res, next) => {
    try {
        const customers = await Customer.find({}, 'id name -_id').sort({ id: 1 });
        res.json(customers);
    } catch (error) {
        next(error);
    }
});

router.get('/customers/age-fields', async (req, res, next) => {
    try {
        const customers = await Customer.find({}, 'id name age -_id').sort({ id: 1 });
        res.json(customers);
    } catch (error) {
        next(error);
    }
});

router.get('/customers/money-spent-fields', async (req, res, next) => {
    try {
        const customers = await Customer.find({}, 'id name moneySpent -_id').sort({ id: 1 });
        res.json(customers);
    } catch (error) {
        next(error);
    }
});

router.get('/customers/money-spent/total', async (req, res, next) => {
    try {
        const result = await Customer.aggregate([
            {
                $group: {
                    _id: null,
                    totalMoneySpent: { $sum: '$moneySpent' }
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

router.get('/customers/count', async (req, res, next) => {
    try {
        const totalCustomers = await Customer.countDocuments();
        res.json({ totalCustomers });
    } catch (error) {
        next(error);
    }
});

router.get('/customers/summary', async (req, res, next) => {
    try {
        const result = await Customer.aggregate([
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

router.get('/customers/by-name/:name', async (req, res, next) => {
    try {
        const { name } = req.params;
        const customers = await Customer.find({
            name: { $regex: name, $options: 'i' }
        }).sort({ id: 1 });

        res.json(customers);
    } catch (error) {
        next(error);
    }
});

router.get('/customers/by-age/:age', async (req, res, next) => {
    try {
        const age = parseNumber(req.params.age, 'Age');
        const customers = await Customer.find({ age }).sort({ id: 1 });
        res.json(customers);
    } catch (error) {
        next(error);
    }
});

router.get('/customers/by-money-spent-range/:min/:max', async (req, res, next) => {
    try {
        const min = parseNumber(req.params.min, 'Minimum money spent');
        const max = parseNumber(req.params.max, 'Maximum money spent');

        if (min > max) {
            return res.status(400).json({
                message: 'Minimum money spent cannot be greater than maximum money spent'
            });
        }

        const customers = await Customer.find({
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

router.get('/customers/:id', async (req, res, next) => {
    try {
        const id = parseNumber(req.params.id, 'Customer id');
        const customer = await Customer.findOne({ id });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        next(error);
    }
});

router.post('/customers', async (req, res, next) => {
    try {
        const customerData = {
            id: req.body.id === undefined || req.body.id === null || req.body.id === ''
                ? await getNextCustomerId()
                : parseNumber(req.body.id, 'Customer id'),
            name: String(req.body.name).trim(),
            age: parseNumber(req.body.age, 'Age'),
            moneySpent: parseNumber(req.body.moneySpent, 'Money spent')
        };

        const customer = await Customer.create(customerData);
        res.status(201).json(customer);
    } catch (error) {
        if (error.code === 11000) {
            error.statusCode = 409;
            error.message = 'A customer with that id already exists';
        }
        next(error);
    }
});

router.put('/customers/:id', async (req, res, next) => {
    try {
        const id = parseNumber(req.params.id, 'Customer id');
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

        const customer = await Customer.findOneAndUpdate(
            { id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        next(error);
    }
});

router.delete('/customers/:id', async (req, res, next) => {
    try {
        const id = parseNumber(req.params.id, 'Customer id');
        const customer = await Customer.findOneAndDelete({ id });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({
            message: 'Customer deleted successfully',
            customer
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
