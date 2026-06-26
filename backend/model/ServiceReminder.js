import mongoose from 'mongoose';

const ServiceReminderSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRecord',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'COMPLETED', 'DISMISSED'],
    default: 'PENDING'
  },
  message: {
    type: String,
    required: true
  }
}, { timestamps: true });

export const ServiceReminder = mongoose.model('ServiceReminder', ServiceReminderSchema);
