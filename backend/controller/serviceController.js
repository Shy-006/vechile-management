import { Service } from '../model/Service.js';

export const addService = async (req, res) => {
  try {
    const { serviceName, basePrice } = req.body;
    if (!serviceName || basePrice === undefined) {
      return res.status(400).json({ error: 'Service name and base price are required.' });
    }

    const existingService = await Service.findOne({ serviceName: serviceName.trim() });
    if (existingService) {
      return res.status(400).json({ error: 'This service category already exists.' });
    }

    const service = new Service({
      serviceName: serviceName.trim(),
      basePrice: Number(basePrice)
    });

    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getServices = async (req, res) => {
  try {
    const services = await Service.find({}).sort({ serviceName: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
