import { ServiceRecord } from '../model/ServiceRecord.js';
import { Vehicle } from '../model/Vehicle.js';
import { ServiceReminder } from '../model/ServiceReminder.js';

export const createServiceRecord = async (req, res) => {
  try {
    const { vehicleId, services, remarks, serviceDate, nextServiceDate } = req.body;
    if (!vehicleId || !services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'Vehicle reference and at least one service item are required.' });
    }

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Selected vehicle not found.' });
    }

    // Validate nextServiceDate if provided
    let calculatedNextServiceDate;
    const serviceDateObj = serviceDate ? new Date(serviceDate) : new Date();
    
    if (nextServiceDate) {
      calculatedNextServiceDate = new Date(nextServiceDate);
      if (isNaN(calculatedNextServiceDate.getTime())) {
        return res.status(400).json({ error: 'Invalid next service date format.' });
      }
      if (calculatedNextServiceDate <= serviceDateObj) {
        return res.status(400).json({ error: 'Next service date must be after the service date.' });
      }
    } else {
      // Default is 3 months from serviceDate
      calculatedNextServiceDate = new Date(serviceDateObj);
      calculatedNextServiceDate.setMonth(calculatedNextServiceDate.getMonth() + 3);
    }

    // Compute total cost
    let totalAmount = 0;
    const formattedServices = services.map(s => {
      const cost = Number(s.cost);
      if (isNaN(cost) || cost < 0) {
        throw new Error(`Invalid cost for service ID ${s.serviceId}`);
      }
      totalAmount += cost;
      return {
        serviceId: s.serviceId,
        cost
      };
    });

    const record = new ServiceRecord({
      vehicleId,
      services: formattedServices,
      totalAmount,
      remarks: remarks || '',
      serviceDate: serviceDateObj,
      performedBy: req.user.id
    });

    await record.save();

    // Auto-resolve any previous PENDING or SENT reminders for this vehicle
    await ServiceReminder.updateMany(
      { vehicleId, status: { $in: ['PENDING', 'SENT'] } },
      { status: 'COMPLETED' }
    );

    // Create a new reminder for the next service
    const formattedDateString = calculatedNextServiceDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const message = `Your ${vehicle.manufacturer} ${vehicle.model} (Reg No: ${vehicle.vehicleNumber}) is due for its next service on ${formattedDateString}.`;

    const reminder = new ServiceReminder({
      vehicleId,
      userId: vehicle.userId,
      serviceRecordId: record._id,
      dueDate: calculatedNextServiceDate,
      status: 'PENDING',
      message
    });

    await reminder.save();
  
    const populatedRecord = await ServiceRecord.findById(record._id)
      .populate('vehicleId')
      .populate('services.serviceId')
      .populate('performedBy', 'name');

    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVehicleHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    // Customers can only view their own vehicles' records
    if (req.user.role !== 'ADMIN' && vehicle.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own vehicle history.' });
    }

    const records = await ServiceRecord.find({ vehicleId })
      .populate('services.serviceId')
      .populate('performedBy', 'name')
      .sort({ serviceDate: -1 });

    res.json({ vehicle, records });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllServiceRecords = async (req, res) => {
  try {
    const records = await ServiceRecord.find({})
      .populate('vehicleId')
      .populate('services.serviceId')
      .populate('performedBy', 'name')
      .sort({ serviceDate: -1 })
      .limit(10);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
