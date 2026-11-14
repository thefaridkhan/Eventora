import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Event from './models/Event.js';
import Booking from './models/Booking.js';
import { seedUsers, seedEvents } from './data/seedData.js';

// Setup custom DNS to reliably resolve MongoDB Atlas SRV records
dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
]);

// Setup environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

/**
 * Main database seeder script
 */
const seedDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/eventora';

        console.log('\n===========================================');
        console.log('🌱 Starting Database Seeding Process...');
        console.log('===========================================');

        // Step 1: Connect to MongoDB
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB successfully.\n');

        // Step 2: Clear existing collections & stale indexes
        console.log('🗑️  Clearing existing collections...');
        await User.deleteMany();
        await Event.deleteMany();
        await Booking.deleteMany();

        try {
            await User.collection.dropIndexes();
        } catch (err) {
            // Ignore if index doesn't exist
        }
        console.log('   ✓ Removed old Users, Events, and Bookings.\n');

        // Step 3: Hash passwords & insert Users
        console.log('👤 Seeding Users...');
        const salt = await bcrypt.genSalt(10);

        const hashedUsers = seedUsers.map(user => ({
            ...user,
            password: bcrypt.hashSync(user.password, salt),
            isVerified: true
        }));

        const createdUsers = await User.insertMany(hashedUsers);
        const adminUser = createdUsers.find(u => u.role === 'admin');
        const normalUsers = createdUsers.filter(u => u.role === 'user');

        console.log(`   ✓ Created ${createdUsers.length} total users (1 Admin, ${normalUsers.length} Users).\n`);

        // Step 4: Associate Events with Admin and insert
        console.log('🎉 Seeding Events...');
        const eventsWithAdmin = seedEvents.map(event => ({
            ...event,
            availableSeats: event.totalSeats,
            createdBy: adminUser._id
        }));

        const createdEvents = await Event.insertMany(eventsWithAdmin);
        console.log(`   ✓ Created ${createdEvents.length} events linked to Admin.\n`);

        // Step 5: Generate realistic Bookings
        console.log('🎫 Generating Random Bookings...');
        const bookingsData = [];

        for (const event of createdEvents) {
            // Pick 3-6 random users for each event
            const randomCount = Math.floor(Math.random() * 4) + 3;
            const shuffledUsers = [...normalUsers].sort(() => 0.5 - Math.random());
            const selectedUsers = shuffledUsers.slice(0, randomCount);

            for (const user of selectedUsers) {
                const statuses = ['pending', 'confirmed', 'cancelled'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                let paymentStatus = 'not_paid';
                if (status === 'confirmed' && event.ticketPrice > 0) {
                    paymentStatus = Math.random() > 0.1 ? 'paid' : 'not_paid';
                } else if (event.ticketPrice === 0) {
                    paymentStatus = 'paid';
                }

                bookingsData.push({
                    userId: user._id,
                    eventId: event._id,
                    status,
                    paymentStatus,
                    amount: event.ticketPrice
                });

                // Deduct available seat for confirmed booking
                if (status === 'confirmed') {
                    event.availableSeats -= 1;
                    await event.save();
                }
            }
        }

        await Booking.insertMany(bookingsData);
        console.log(`   ✓ Inserted ${bookingsData.length} randomized bookings.\n`);

        // Step 6: Summary Report
        console.log('===========================================');
        console.log('🚀 Database Seeded Successfully!');
        console.log('===========================================');
        console.log('🔑 Credentials to test:');
        console.log('   Admin Login : admin@eventora.com / password123');
        console.log('   User Login  : user@eventora.com / password123');
        console.log('===========================================\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Seeding failed with error:', error);
        process.exit(1);
    }
};

seedDatabase();
