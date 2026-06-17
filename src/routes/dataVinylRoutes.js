const express = require('express');
const mongoose = require('mongoose');
const Vinyl = require('../models/vinyl');

const router = express.Router();

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

router.get('/vinyls/:id', async (req, res, next) => {
    try {
        const vinyl = await Vinyl.findOne({
            serial_number: Number(req.params.id)
        });

        if (!vinyl) {
            return res.status(404).json({
                message: 'Vinyl not found'
            });
        }

        res.json(vinyl);
    } catch (error) {
        next(error);
    }
});

router.post('/vinyls', async (req, res, next) => {
    try {
        const vinyl = await Vinyl.create(req.body);
        res.status(201).json(vinyl);
    } catch (error) {
        next(error);
    }
});

router.put('/vinyls/:id', async (req, res, next) => {
    try {
        const vinyl = await Vinyl.findOneAndUpdate(
            { serial_number: Number(req.params.id) },
            req.body,
            { new: true }
        );

        if (!vinyl) {
            return res.status(404).json({
                message: 'Vinyl not found'
            });
        }

        res.json(vinyl);
    } catch (error) {
        next(error);
    }
});

router.delete('/vinyls/:id', async (req, res, next) => {
    try {
        const vinyl = await Vinyl.findOneAndDelete({
            serial_number: Number(req.params.id)
        });

        if (!vinyl) {
            return res.status(404).json({
                message: 'Vinyl not found'
            });
        }

        res.json({
            message: 'Vinyl deleted successfully',
            vinyl
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;