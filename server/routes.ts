import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import { storage } from './storage';
import { generateToken, authMiddleware, roleMiddleware, verifyToken, type JwtPayload } from './auth';

function paramId(params: any): string {
  const id = params.id;
  return Array.isArray(id) ? id[0] : id;
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function calculateDistance(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  const io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('driver:location', async (data: { driverId: string; lat: number; lng: number }) => {
      await storage.updateUser(data.driverId, { location: { lat: data.lat, lng: data.lng } });
      io.emit('driver:location:update', data);
    });

    socket.on('driver:online', async (data: { driverId: string }) => {
      await storage.updateUser(data.driverId, { isOnline: true });
      socket.join(`driver:${data.driverId}`);
    });

    socket.on('driver:offline', async (data: { driverId: string }) => {
      await storage.updateUser(data.driverId, { isOnline: false });
    });

    socket.on('booking:new', (data: { bookingId: string; vehicleType: string }) => {
      io.emit('booking:request', data);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  app.post('/api/auth/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone || phone.length < 10) return res.status(400).json({ error: 'Valid phone number required' });
    const otp = generateOTP();
    await storage.saveOtp(phone, otp);
    console.log(`[OTP] ${phone}: ${otp}`);
    res.json({ success: true, message: 'OTP sent successfully', otp });
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    const { phone, otp, role } = req.body;
    console.log(`[VERIFY] ${phone}: attempting OTP ${otp}`);
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
    const valid = await storage.verifyOtp(phone, otp);
    if (!valid) {
      console.log(`[VERIFY] ${phone}: OTP verification failed`);
      return res.status(400).json({ error: 'Invalid or expired OTP. Please tap "Resend OTP" and try again.' });
    }
    console.log(`[VERIFY] ${phone}: OTP verified successfully`);
    let user = await storage.getUserByPhone(phone);
    const isNew = !user;
    if (!user) {
      user = await storage.createUser({ name: '', phone, role: role || 'customer', isOnline: false, isApproved: role === 'customer' });
    }
    const token = generateToken({ userId: user.id, phone: user.phone, role: user.role });
    res.json({ success: true, token, user, isNew });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { phone, name, role, vehicleType, vehicleNumber, licenseNumber } = req.body;
    if (!phone || !name) return res.status(400).json({ error: 'Phone and name required' });
    let user = await storage.getUserByPhone(phone);
    if (user) {
      user = (await storage.updateUser(user.id, { name, role: role || user.role, vehicleType, vehicleNumber, licenseNumber, isApproved: role === 'customer' }))!;
    } else {
      user = await storage.createUser({
        name, phone, role: role || 'customer', vehicleType, vehicleNumber, licenseNumber,
        isOnline: false, isApproved: role === 'customer', rating: role === 'driver' ? 4.0 : undefined,
        totalTrips: 0, totalEarnings: 0,
      });
    }
    const token = generateToken({ userId: user.id, phone: user.phone, role: user.role });
    res.json({ success: true, token, user });
  });

  app.post('/api/auth/admin-login', async (req, res) => {
    const { phone, password } = req.body;
    const user = await storage.getUserByPhone(phone);
    if (!user || user.role !== 'admin' || user.password !== password) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    const token = generateToken({ userId: user.id, phone: user.phone, role: user.role });
    res.json({ success: true, token, user });
  });

  app.get('/api/auth/me', authMiddleware, async (req, res) => {
    const { userId } = (req as any).user as JwtPayload;
    const user = await storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });

  app.put('/api/users/profile', authMiddleware, async (req, res) => {
    const { userId } = (req as any).user as JwtPayload;
    const { name, vehicleType, vehicleNumber, licenseNumber } = req.body;
    const user = await storage.updateUser(userId, { name, vehicleType, vehicleNumber, licenseNumber });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });

  app.put('/api/users/toggle-online', authMiddleware, roleMiddleware('driver'), async (req, res) => {
    const { userId } = (req as any).user as JwtPayload;
    const user = await storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await storage.updateUser(userId, { isOnline: !user.isOnline });
    if (updated?.isOnline) {
      io.emit('driver:status', { driverId: userId, isOnline: true });
    }
    res.json({ user: updated });
  });

  app.get('/api/vehicles', async (req, res) => {
    const vehicles = (await storage.getVehicles()).filter(v => v.isActive);
    res.json({ vehicles });
  });

  app.post('/api/bookings', authMiddleware, roleMiddleware('customer'), async (req, res) => {
    const { userId } = (req as any).user as JwtPayload;
    const user = await storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { pickup, delivery, vehicleType, paymentMethod } = req.body;
    if (!pickup || !delivery || !vehicleType) return res.status(400).json({ error: 'Pickup, delivery and vehicle type required' });
    const vehicle = await storage.getVehicleByType(vehicleType);
    if (!vehicle) return res.status(400).json({ error: 'Invalid vehicle type' });
    const distance = calculateDistance(pickup, delivery);
    const distanceCharge = Math.round(distance * vehicle.perKmCharge);
    const totalPrice = vehicle.baseFare + distanceCharge;
    const estimatedTime = Math.round(distance * 3 + 5);
    const otp = generateOTP();
    const booking = await storage.createBooking({
      customerId: userId, customerName: user.name, customerPhone: user.phone,
      pickup, delivery, vehicleType, distance, basePrice: vehicle.baseFare,
      distanceCharge, totalPrice, estimatedTime, paymentMethod: paymentMethod || 'cash',
      status: 'pending', otp,
    });
    io.emit('booking:new', { booking });
    res.json({ booking });
  });

  app.get('/api/bookings', authMiddleware, async (req, res) => {
    const { userId, role } = (req as any).user as JwtPayload;
    let bookings;
    if (role === 'customer') bookings = await storage.getBookingsByCustomer(userId);
    else if (role === 'driver') bookings = await storage.getBookingsByDriver(userId);
    else bookings = await storage.getAllBookings();
    res.json({ bookings });
  });

  app.get('/api/bookings/pending', authMiddleware, roleMiddleware('driver'), async (req, res) => {
    const { userId } = (req as any).user as JwtPayload;
    const driver = await storage.getUserById(userId);
    const bookings = await storage.getPendingBookings(driver?.vehicleType);
    res.json({ bookings });
  });

  app.get('/api/bookings/:id', authMiddleware, async (req, res) => {
    const booking = await storage.getBookingById(paramId(req.params));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  });

  app.put('/api/bookings/:id/accept', authMiddleware, roleMiddleware('driver'), async (req, res) => {
    const { userId } = (req as any).user as JwtPayload;
    const driver = await storage.getUserById(userId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    const booking = await storage.getBookingById(paramId(req.params));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Booking already taken' });
    const updated = await storage.updateBooking(paramId(req.params), {
      status: 'accepted', driverId: userId, driverName: driver.name,
      driverPhone: driver.phone, driverVehicleNumber: driver.vehicleNumber,
      acceptedAt: new Date().toISOString(),
    });
    io.emit('booking:updated', { booking: updated });
    res.json({ booking: updated });
  });

  app.put('/api/bookings/:id/start', authMiddleware, roleMiddleware('driver'), async (req, res) => {
    const { otp } = req.body;
    const booking = await storage.getBookingById(paramId(req.params));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'accepted') return res.status(400).json({ error: 'Booking not in accepted state' });
    if (booking.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    const updated = await storage.updateBooking(paramId(req.params), { status: 'in_progress', startedAt: new Date().toISOString() });
    io.emit('booking:updated', { booking: updated });
    res.json({ booking: updated });
  });

  app.put('/api/bookings/:id/complete', authMiddleware, roleMiddleware('driver'), async (req, res) => {
    const { userId } = (req as any).user as JwtPayload;
    const booking = await storage.getBookingById(paramId(req.params));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'in_progress') return res.status(400).json({ error: 'Trip not in progress' });
    const updated = await storage.updateBooking(paramId(req.params), { status: 'completed', completedAt: new Date().toISOString() });
    const driver = await storage.getUserById(userId);
    if (driver) {
      await storage.updateUser(userId, {
        totalTrips: (driver.totalTrips || 0) + 1,
        totalEarnings: (driver.totalEarnings || 0) + booking.totalPrice,
      });
    }
    io.emit('booking:updated', { booking: updated });
    res.json({ booking: updated });
  });

  app.put('/api/bookings/:id/cancel', authMiddleware, async (req, res) => {
    const { reason } = req.body;
    const booking = await storage.getBookingById(paramId(req.params));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (['completed', 'cancelled'].includes(booking.status)) return res.status(400).json({ error: 'Cannot cancel this booking' });
    const updated = await storage.updateBooking(paramId(req.params), { status: 'cancelled', cancelReason: reason, cancelledAt: new Date().toISOString() });
    io.emit('booking:updated', { booking: updated });
    res.json({ booking: updated });
  });

  app.put('/api/bookings/:id/rate', authMiddleware, roleMiddleware('customer'), async (req, res) => {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
    const booking = await storage.getBookingById(paramId(req.params));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const updated = await storage.updateBooking(paramId(req.params), { rating, ratingComment: comment });
    res.json({ booking: updated });
  });

  app.get('/api/admin/stats', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    res.json(await storage.getStats());
  });

  app.get('/api/admin/users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    const { role } = req.query;
    const users = role ? await storage.getUsersByRole(role as string) : await storage.getAllUsers();
    res.json({ users: users.filter(u => u.role !== 'admin') });
  });

  app.put('/api/admin/users/:id/approve', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    const user = await storage.updateUser(paramId(req.params), { isApproved: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });

  app.delete('/api/admin/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    await storage.deleteUser(paramId(req.params));
    res.json({ success: true });
  });

  app.get('/api/admin/bookings', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    res.json({ bookings: await storage.getAllBookings() });
  });

  app.get('/api/admin/vehicles', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    res.json({ vehicles: await storage.getVehicles() });
  });

  app.put('/api/admin/vehicles/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    const { baseFare, perKmCharge, isActive } = req.body;
    const vehicle = await storage.updateVehicle(paramId(req.params), { baseFare, perKmCharge, isActive });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle });
  });

  app.get('/api/admin/drivers/online', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    res.json({ drivers: await storage.getOnlineDrivers() });
  });

  return httpServer;
}
