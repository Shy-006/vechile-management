import { Vehicle } from '../model/Vehicle.js';
import { User } from '../model/User.js';
import bcrypt from 'bcryptjs';

export const addVehicle = async (req, res) => {
  try {
    const { vehicleNumber, manufacturer, model, ownerEmail } = req.body;
    if (!vehicleNumber || !manufacturer || !model) {
      return res.status(400).json({ error: 'Vehicle number, manufacturer, and model are required.' });
    }

    let targetUserId = req.user.id;
    let ownerCreated = false;
    let temporaryPassword = null;

    if (req.user.role === 'ADMIN' && ownerEmail) {
      const cleanEmail = ownerEmail.trim().toLowerCase();
      let owner = await User.findOne({ email: cleanEmail });
      
      if (!owner) {
        const emailPrefix = cleanEmail.split('@')[0];
        const formattedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        const defaultPasswordHash = await bcrypt.hash('welcome123', 10);
        
        owner = new User({
          name: formattedName,
          email: cleanEmail,
          password: defaultPasswordHash,
          role: 'USER',
          isTemporaryPassword: true
        });
        await owner.save();
        ownerCreated = true;
        temporaryPassword = 'welcome123';
      }
      
      targetUserId = owner._id;
    }

    const existingVehicle = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase().trim() });
    if (existingVehicle) {
      return res.status(400).json({ error: `Vehicle number ${vehicleNumber} is already registered.` });
    }

    const vehicle = new Vehicle({
      userId: targetUserId,
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      manufacturer,
      model
    });

    await vehicle.save();

    if (ownerCreated) {
      return res.status(201).json({
        vehicle,
        ownerCreated: true,
        temporaryPassword,
        message: 'Vehicle registered and a new user account was created with a temporary password.'
      });
    }

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getVehicles = async (req, res) => {
  try {
    let vehicles;
    if (req.user.role === 'ADMIN') {
      vehicles = await Vehicle.find({}).populate('userId', 'name email');
    } else {
      vehicles = await Vehicle.find({ userId: req.user.id });
    }
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'USER' }).select('name email');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
