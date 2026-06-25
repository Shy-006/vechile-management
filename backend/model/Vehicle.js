import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true },
  vehicleNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true },
  manufacturer: { 
    type: String, 
    required: true },
  model: { 
    type: String, 
    required: true }
}, { timestamps: true });

export const Vehicle = mongoose.model('Vehicle', VehicleSchema);
