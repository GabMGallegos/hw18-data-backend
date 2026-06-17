require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDatabase = require('./config/database');
const dataCustomerRoutes = require('./routes/dataVinylRoutes');

const app = express();
const port = process.env.PORT || 4010;
const host = process.env.HOST || '0.0.0.0';
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        service: 'hw18-data-backend',
        status: 'running'
    });
});

app.use('/computerstore', dataCustomerRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Data endpoint not found' });
});

app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        message: error.message || 'Internal data backend error'
    });
});

connectDatabase()
    .then(() => {
        app.listen(port, host, () => {
            console.log(`Data backend running on http://${host}:${port}`);
        });
    })
    .catch((error) => {
        console.error('Unable to start data backend:', error.message);
        process.exit(1);
    });
