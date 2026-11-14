import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dns from 'dns';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import bookingRoutes from './routes/bookings.js';

// ==========================================
// 1. Environment & DNS Configuration
// ==========================================
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

// Custom DNS servers to prevent DNS lookup timeouts on some networks
dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
]);

// ==========================================
// 2. Database Connection
// ==========================================
connectDB();

// ==========================================
// 3. Express App Initialization
// ==========================================
const app = express();

// ==========================================
// 4. Global Middlewares
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 5. API Routes Registration
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==========================================
// 6. Serve Frontend Static Assets (Production / Render)
// ==========================================
const clientDistPath = path.resolve(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));

    // Fallback for Single Page Application client routing (SPA)
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
            return res.sendFile(path.join(clientDistPath, 'index.html'));
        }
        next();
    });
}

// ==========================================
// 7. 404 & Global Error Handling
// ==========================================
app.use((req, res, next) => {
    res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

// ==========================================
// 8. Start Server Listener
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;
