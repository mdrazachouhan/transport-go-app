import { UserModel, BookingModel, VehiclePricingModel, OtpRecordModel } from './models';
import type { IUser, IBooking, IVehiclePricing } from './models';

export interface User {
  id: string;
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
  createdAt: string;
}

export interface Booking {
  id: string;
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
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface VehiclePricing {
  id: string;
  type: string;
  name: string;
  baseFare: number;
  perKmCharge: number;
  capacity: string;
  icon: string;
  isActive: boolean;
}

export interface OtpRecord {
  phone: string;
  otp: string;
  expiresAt: number;
  verified: boolean;
}

function docToUser(doc: IUser): User {
  return {
    id: doc._id.toString(),
    name: doc.name,
    phone: doc.phone,
    role: doc.role,
    password: doc.password,
    vehicleType: doc.vehicleType,
    vehicleNumber: doc.vehicleNumber,
    licenseNumber: doc.licenseNumber,
    isOnline: doc.isOnline,
    isApproved: doc.isApproved,
    rating: doc.rating,
    totalTrips: doc.totalTrips,
    totalEarnings: doc.totalEarnings,
    location: doc.location,
    createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
  };
}

function docToBooking(doc: IBooking): Booking {
  return {
    id: doc._id.toString(),
    customerId: doc.customerId,
    customerName: doc.customerName,
    customerPhone: doc.customerPhone,
    driverId: doc.driverId,
    driverName: doc.driverName,
    driverPhone: doc.driverPhone,
    driverVehicleNumber: doc.driverVehicleNumber,
    pickup: doc.pickup,
    delivery: doc.delivery,
    vehicleType: doc.vehicleType,
    distance: doc.distance,
    basePrice: doc.basePrice,
    distanceCharge: doc.distanceCharge,
    totalPrice: doc.totalPrice,
    estimatedTime: doc.estimatedTime,
    paymentMethod: doc.paymentMethod,
    status: doc.status,
    otp: doc.otp,
    rating: doc.rating,
    ratingComment: doc.ratingComment,
    cancelReason: doc.cancelReason,
    createdAt: doc.createdAt?.toISOString?.() || new Date().toISOString(),
    acceptedAt: doc.acceptedAt?.toISOString?.(),
    startedAt: doc.startedAt?.toISOString?.(),
    completedAt: doc.completedAt?.toISOString?.(),
    cancelledAt: doc.cancelledAt?.toISOString?.(),
  };
}

function docToVehicle(doc: any): VehiclePricing {
  return {
    id: doc._id.toString(),
    type: doc.type,
    name: doc.name,
    baseFare: doc.baseFare,
    perKmCharge: doc.perKmCharge,
    capacity: doc.capacity,
    icon: doc.icon,
    isActive: doc.isActive,
  };
}

class MongoStorage {
  async seedDefaults() {
    const vehicleCount = await VehiclePricingModel.countDocuments();
    if (vehicleCount === 0) {
      await VehiclePricingModel.insertMany([
        { type: 'auto', name: 'Auto', baseFare: 50, perKmCharge: 12, capacity: 'Up to 200kg', icon: 'rickshaw', isActive: true },
        { type: 'tempo', name: 'Tempo', baseFare: 150, perKmCharge: 18, capacity: 'Up to 1000kg', icon: 'van-utility', isActive: true },
        { type: 'truck', name: 'Truck', baseFare: 300, perKmCharge: 25, capacity: '1000kg+', icon: 'truck', isActive: true },
      ]);
      console.log('Seeded default vehicle pricing');
    }

    const adminExists = await UserModel.findOne({ phone: '9999999999', role: 'admin' });
    if (!adminExists) {
      await UserModel.create({
        name: 'Admin',
        phone: '9999999999',
        role: 'admin',
        password: 'admin123',
      });
      console.log('Seeded default admin user');
    }
  }

  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const doc = await UserModel.create(data);
    return docToUser(doc);
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const doc = await UserModel.findById(id);
      return doc ? docToUser(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ phone });
    return doc ? docToUser(doc) : undefined;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const docs = await UserModel.find({ role });
    return docs.map(docToUser);
  }

  async getAllUsers(): Promise<User[]> {
    const docs = await UserModel.find();
    return docs.map(docToUser);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    try {
      const doc = await UserModel.findByIdAndUpdate(id, { $set: data }, { new: true });
      return doc ? docToUser(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await UserModel.findByIdAndDelete(id);
      return !!result;
    } catch {
      return false;
    }
  }

  async getOnlineDrivers(vehicleType?: string): Promise<User[]> {
    const query: any = { role: 'driver', isOnline: true, isApproved: { $ne: false } };
    if (vehicleType) query.vehicleType = vehicleType;
    const docs = await UserModel.find(query);
    return docs.map(docToUser);
  }

  async createBooking(data: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const doc = await BookingModel.create(data);
    return docToBooking(doc);
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    try {
      const doc = await BookingModel.findById(id);
      return doc ? docToBooking(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    const docs = await BookingModel.find({ customerId }).sort({ createdAt: -1 });
    return docs.map(docToBooking);
  }

  async getBookingsByDriver(driverId: string): Promise<Booking[]> {
    const docs = await BookingModel.find({ driverId }).sort({ createdAt: -1 });
    return docs.map(docToBooking);
  }

  async getPendingBookings(vehicleType?: string): Promise<Booking[]> {
    const query: any = { status: 'pending' };
    if (vehicleType) query.vehicleType = vehicleType;
    const docs = await BookingModel.find(query);
    return docs.map(docToBooking);
  }

  async getAllBookings(): Promise<Booking[]> {
    const docs = await BookingModel.find().sort({ createdAt: -1 });
    return docs.map(docToBooking);
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking | undefined> {
    try {
      const doc = await BookingModel.findByIdAndUpdate(id, { $set: data }, { new: true });
      return doc ? docToBooking(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async getVehicles(): Promise<VehiclePricing[]> {
    const docs = await VehiclePricingModel.find();
    return docs.map(docToVehicle);
  }

  async getVehicleByType(type: string): Promise<VehiclePricing | undefined> {
    const doc = await VehiclePricingModel.findOne({ type });
    return doc ? docToVehicle(doc) : undefined;
  }

  async updateVehicle(id: string, data: Partial<VehiclePricing>): Promise<VehiclePricing | undefined> {
    try {
      const doc = await VehiclePricingModel.findByIdAndUpdate(id, { $set: data }, { new: true });
      return doc ? docToVehicle(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async saveOtp(phone: string, otp: string): Promise<void> {
    await OtpRecordModel.findOneAndUpdate(
      { phone },
      { phone, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000), verified: false },
      { upsert: true, new: true }
    );
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const record = await OtpRecordModel.findOne({ phone });
    if (!record) return false;
    if (new Date() > record.expiresAt) return false;
    if (record.otp !== otp) return false;
    record.verified = true;
    await record.save();
    return true;
  }

  async getStats() {
    const [totalUsers, totalCustomers, totalDrivers, onlineDrivers, allBookings] = await Promise.all([
      UserModel.countDocuments({ role: { $ne: 'admin' } }),
      UserModel.countDocuments({ role: 'customer' }),
      UserModel.countDocuments({ role: 'driver' }),
      UserModel.countDocuments({ role: 'driver', isOnline: true }),
      BookingModel.find(),
    ]);

    const bookingsList = allBookings.map(docToBooking);
    return {
      totalUsers,
      totalCustomers,
      totalDrivers,
      onlineDrivers,
      totalBookings: bookingsList.length,
      completedBookings: bookingsList.filter(b => b.status === 'completed').length,
      activeBookings: bookingsList.filter(b => ['pending', 'accepted', 'in_progress'].includes(b.status)).length,
      cancelledBookings: bookingsList.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookingsList.filter(b => b.status === 'completed').reduce((s, b) => s + b.totalPrice, 0),
    };
  }
}

export const storage = new MongoStorage();
