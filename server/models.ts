import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  phone: string;
  role: 'customer' | 'driver' | 'admin';
  password?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  isOnline?: boolean;
  isApproved?: boolean;
  rating?: number;
  totalTrips?: number;
  totalEarnings?: number;
  location?: { lat: number; lng: number };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, default: '' },
  phone: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ['customer', 'driver', 'admin'], required: true },
  password: String,
  vehicleType: String,
  vehicleNumber: String,
  licenseNumber: String,
  isOnline: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  rating: Number,
  totalTrips: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  location: {
    type: { lat: Number, lng: Number },
    default: undefined,
  },
}, { timestamps: true });

export interface IBooking extends Document {
  customerId: string;
  customerName: string;
  customerPhone: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicleNumber?: string;
  pickup: { name: string; area: string; lat: number; lng: number };
  delivery: { name: string; area: string; lat: number; lng: number };
  vehicleType: string;
  distance: number;
  basePrice: number;
  distanceCharge: number;
  totalPrice: number;
  estimatedTime: number;
  paymentMethod: 'cash' | 'upi';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  otp: string;
  rating?: number;
  ratingComment?: string;
  cancelReason?: string;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
}

const LocationSubSchema = {
  name: { type: String, required: true },
  area: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
};

const BookingSchema = new Schema<IBooking>({
  customerId: { type: String, required: true, index: true },
  customerName: String,
  customerPhone: String,
  driverId: { type: String, index: true },
  driverName: String,
  driverPhone: String,
  driverVehicleNumber: String,
  pickup: LocationSubSchema,
  delivery: LocationSubSchema,
  vehicleType: { type: String, required: true },
  distance: Number,
  basePrice: Number,
  distanceCharge: Number,
  totalPrice: Number,
  estimatedTime: Number,
  paymentMethod: { type: String, enum: ['cash', 'upi'], default: 'cash' },
  status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'pending', index: true },
  otp: String,
  rating: Number,
  ratingComment: String,
  cancelReason: String,
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
}, { timestamps: true });

export interface IVehiclePricing extends Document {
  type: string;
  name: string;
  baseFare: number;
  perKmCharge: number;
  capacity: string;
  icon: string;
  isActive: boolean;
}

const VehiclePricingSchema = new Schema<IVehiclePricing>({
  type: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  baseFare: { type: Number, required: true },
  perKmCharge: { type: Number, required: true },
  capacity: String,
  icon: String,
  isActive: { type: Boolean, default: true },
});

export interface IOtpRecord extends Document {
  phone: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
}

const OtpRecordSchema = new Schema<IOtpRecord>({
  phone: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
export const BookingModel = mongoose.model<IBooking>('Booking', BookingSchema);
export const VehiclePricingModel = mongoose.model<IVehiclePricing>('VehiclePricing', VehiclePricingSchema);
export const OtpRecordModel = mongoose.model<IOtpRecord>('OtpRecord', OtpRecordSchema);
