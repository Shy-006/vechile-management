import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  serviceName: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true },
  basePrice: { 
    type: Number, 
    required: true, 
    min: 0 }
}, { timestamps: true });

export const Service = mongoose.model('Service', ServiceSchema);
