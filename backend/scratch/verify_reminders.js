import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../model/User.js';
import { Vehicle } from '../model/Vehicle.js';
import { Service } from '../model/Service.js';
import { ServiceRecord } from '../model/ServiceRecord.js';
import { ServiceReminder } from '../model/ServiceReminder.js';
import { createServiceRecord } from '../controller/serviceRecordController.js';
import { getReminders, dismissReminder } from '../controller/serviceReminderController.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-service-history';

async function runTests() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  try {
    // Clear test records
    console.log('Cleaning up existing test data...');
    await Vehicle.deleteMany({ vehicleNumber: 'REMIND1' });
    await User.deleteMany({ email: /test-reminder-.*@example\.com/ });
    
    // Create test customer
    const customer = new User({
      name: 'Test Customer',
      email: 'test-reminder-cust@example.com',
      password: 'password123',
      role: 'USER'
    });
    await customer.save();

    // Create test admin
    const admin = new User({
      name: 'Test Admin',
      email: 'test-reminder-admin@example.com',
      password: 'password123',
      role: 'ADMIN'
    });
    await admin.save();

    // Create test vehicle
    const vehicle = new Vehicle({
      userId: customer._id,
      vehicleNumber: 'REMIND1',
      manufacturer: 'Toyota',
      model: 'Corolla'
    });
    await vehicle.save();

    // Create test service
    const service = new Service({
      serviceName: 'Test Service Reminder Oil',
      basePrice: 50
    });
    try {
      await service.save();
    } catch (e) {
      // ignore duplicate
    }
    const savedService = await Service.findOne({ serviceName: 'Test Service Reminder Oil' });

    // Mock response helpers
    const mockResponse = () => {
      const res = {};
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.jsonData = data;
        return res;
      };
      return res;
    };

    console.log('\n--- Test 1: Log Service Record without nextServiceDate (Default 3 Months) ---');
    const req1 = {
      body: {
        vehicleId: vehicle._id.toString(),
        services: [{ serviceId: savedService._id.toString(), cost: 60 }],
        remarks: 'Regular checkup',
        serviceDate: new Date()
      },
      user: { id: admin._id.toString(), role: 'ADMIN' }
    };
    const res1 = mockResponse();
    await createServiceRecord(req1, res1);
    
    if (res1.statusCode && res1.statusCode !== 201) {
      throw new Error(`Failed to create service record: ${JSON.stringify(res1.jsonData)}`);
    }
    
    const reminder1 = await ServiceReminder.findOne({ vehicleId: vehicle._id, status: 'PENDING' });
    if (!reminder1) {
      throw new Error('Reminder 1 was not created!');
    }
    console.log('✅ Reminder 1 created with default 3 months due date.');
    console.log(`Due Date: ${reminder1.dueDate}`);
    console.log(`Message: ${reminder1.message}`);

    console.log('\n--- Test 2: Log Service Record with specific due date in past (to test triggering) ---');
    // Set service date to 4 months ago, and next service due date to 1 month ago (validation requires nextServiceDate > serviceDate)
    const pastServiceDate = new Date();
    pastServiceDate.setMonth(pastServiceDate.getMonth() - 4);
    const pastDueDate = new Date();
    pastDueDate.setMonth(pastDueDate.getMonth() - 1);
    
    // Also, the old reminder should be marked as COMPLETED by logging a new record
    const req2 = {
      body: {
        vehicleId: vehicle._id.toString(),
        services: [{ serviceId: savedService._id.toString(), cost: 70 }],
        remarks: 'Second checkup',
        serviceDate: pastServiceDate,
        nextServiceDate: pastDueDate
      },
      user: { id: admin._id.toString(), role: 'ADMIN' }
    };
    const res2 = mockResponse();
    await createServiceRecord(req2, res2);

    if (res2.statusCode && res2.statusCode !== 201) {
      throw new Error(`Failed to create service record in Test 2: ${JSON.stringify(res2.jsonData)}`);
    }

    // Verify reminder1 is COMPLETED
    const updatedReminder1 = await ServiceReminder.findById(reminder1._id);
    if (updatedReminder1.status !== 'COMPLETED') {
      throw new Error(`Expected Reminder 1 to be COMPLETED, got ${updatedReminder1.status}`);
    }
    console.log('✅ Previous PENDING reminder was auto-completed.');

    // Verify reminder2 is created
    const reminder2 = await ServiceReminder.findOne({ vehicleId: vehicle._id, status: 'PENDING' });
    if (!reminder2) {
      throw new Error('Reminder 2 was not created!');
    }
    console.log('✅ Reminder 2 created with past due date.');

    console.log('\n--- Test 3: Get Reminders for user (Trigger notification check) ---');
    const req3 = {
      user: { id: customer._id.toString(), role: 'USER' },
      query: {}
    };
    const res3 = mockResponse();
    await getReminders(req3, res3);

    // After calling getReminders, reminder2 should transition to SENT because its due date is in the past
    const updatedReminder2 = await ServiceReminder.findById(reminder2._id);
    if (updatedReminder2.status !== 'SENT') {
      throw new Error(`Expected Reminder 2 to transition to SENT, got ${updatedReminder2.status}`);
    }
    console.log('✅ Reminder 2 successfully transitioned to SENT due to passing due date.');
    console.log(`Retrieved ${res3.jsonData.length} reminders for customer.`);
    console.log(`First reminder in response status: ${res3.jsonData[0].status}`);

    console.log('\n--- Test 4: Dismiss a reminder ---');
    const req4 = {
      params: { id: reminder2._id.toString() },
      user: { id: customer._id.toString(), role: 'USER' }
    };
    const res4 = mockResponse();
    await dismissReminder(req4, res4);

    const dismissedReminder = await ServiceReminder.findById(reminder2._id);
    if (dismissedReminder.status !== 'DISMISSED') {
      throw new Error(`Expected Reminder 2 status to be DISMISSED, got ${dismissedReminder.status}`);
    }
    console.log('✅ Reminder successfully dismissed.');

    // Cleanup
    console.log('\nCleaning up verification records...');
    await ServiceReminder.deleteMany({ vehicleId: vehicle._id });
    await ServiceRecord.deleteMany({ vehicleId: vehicle._id });
    await Vehicle.deleteOne({ _id: vehicle._id });
    await User.deleteMany({ email: /test-reminder-.*@example\.com/ });
    await Service.deleteOne({ _id: savedService._id });
    console.log('Cleanup completed successfully.');
    console.log('\n🎉 ALL TESTS PASSED!');

  } catch (error) {
    console.error('❌ Test Failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

runTests();
