import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true },
  password: { 
    type: String, 
    required: true },
  role: { 
    type: String, 
    enum: ['USER', 'ADMIN'], 
    default: 'USER' },
  isTemporaryPassword: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
