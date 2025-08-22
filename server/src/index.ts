import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  loginInputSchema,
  createIzinKendaraanInputSchema,
  updateIzinStatusInputSchema,
  getIzinByStatusInputSchema,
  getIzinByDateRangeInputSchema,
  exportDataInputSchema,
  fcmNotificationInputSchema
} from './schema';

// Import handlers
import { login, verifyToken } from './handlers/auth';
import { createIzinKendaraan } from './handlers/create_izin_kendaraan';
import { 
  getAllIzinKendaraan, 
  getIzinKendaraanByStatus, 
  getIzinKendaraanByDateRange, 
  getIzinKendaraanById 
} from './handlers/get_izin_kendaraan';
import { updateIzinStatus } from './handlers/update_izin_status';
import { exportIzinKendaraanToExcel } from './handlers/export_data';
import { sendFCMNotification, updateUserFCMToken } from './handlers/fcm_notification';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Protected procedure middleware (placeholder for JWT verification)
const protectedProcedure = publicProcedure.use(async ({ next, ctx }) => {
  // This should verify JWT token from headers and add user info to context
  // For now, it's a placeholder that passes through
  return next({ ctx: { ...ctx, user: { id: 1, role: 'Karyawan' } } });
});

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  auth: router({
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(({ input }) => login(input)),
  }),

  // Izin Kendaraan routes
  izinKendaraan: router({
    // Create new vehicle permission request (Karyawan)
    create: protectedProcedure
      .input(createIzinKendaraanInputSchema)
      .mutation(({ input }) => createIzinKendaraan(input)),

    // Get all requests (Admin)
    getAll: protectedProcedure
      .query(() => getAllIzinKendaraan()),

    // Get requests by status/NIK (HR, Karyawan)
    getByStatus: protectedProcedure
      .input(getIzinByStatusInputSchema)
      .query(({ input }) => getIzinKendaraanByStatus(input)),

    // Get requests by date range (Admin reporting)
    getByDateRange: protectedProcedure
      .input(getIzinByDateRangeInputSchema)
      .query(({ input }) => getIzinKendaraanByDateRange(input)),

    // Get single request by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getIzinKendaraanById(input.id)),

    // Update request status (HR only)
    updateStatus: protectedProcedure
      .input(updateIzinStatusInputSchema)
      .mutation(({ input, ctx }) => updateIzinStatus(input, ctx.user.id)),
  }),

  // Admin routes
  admin: router({
    // Export data to Excel
    exportData: protectedProcedure
      .input(exportDataInputSchema)
      .mutation(({ input }) => exportIzinKendaraanToExcel(input)),
  }),

  // FCM Notification routes
  notifications: router({
    // Send push notification
    send: protectedProcedure
      .input(fcmNotificationInputSchema)
      .mutation(({ input }) => sendFCMNotification(input)),

    // Update user FCM token
    updateToken: protectedProcedure
      .input(z.object({ fcmToken: z.string() }))
      .mutation(({ input, ctx }) => updateUserFCMToken(ctx.user.id, input.fcmToken)),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Vehicle Permission System tRPC server listening at port: ${port}`);
}

start();