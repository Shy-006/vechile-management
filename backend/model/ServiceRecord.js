import mongoose from 'mongoose';

const ServiceRecordSchema = new mongoose.Schema({

  vehicleId: { type: mongoose.Schema.Types.ObjectId,
     ref: 'Vehicle', required: true },
     services: [{
     serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    cost: { type: Number, required: true, min: 0 }
  }],

  totalAmount: { 
    type: Number,
    required: true,
     min: 0 },

  remarks: { 
    type: String, 
    default: '' },

  serviceDate: { 
    type: Date, 
    default: Date.now },

  performedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true }
}, { timestamps: true });

export const ServiceRecord = mongoose.model('ServiceRecord', ServiceRecordSchema);
