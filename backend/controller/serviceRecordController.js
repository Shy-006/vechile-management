import { ServiceRecord } from '../model/ServiceRecord.js';
import { Vehicle } from '../model/Vehicle.js';

export const createServiceRecord = async (req, res) => {
  try {
    const { vehicleId, services, remarks, serviceDate } = req.body;
    if (!vehicleId || !services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'Vehicle reference and at least one service item are required.' });
    }

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Selected vehicle not found.' });
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
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      performedBy: req.user.id
    });

    await record.save();
  
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
