import type { Express } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { requireRole } from '../auth/auth.roles';
import { categoryIdParamsSchema, createCategorySchema, orderIdParamsSchema, restaurantIdParamsSchema, updateOrderStatusSchema, updateRestaurantSchema, updateUserRoleSchema, userIdParamsSchema } from './admin.schema';
import { AdminError, createCategory, deleteCategory, getDashboard, listCategories, listRecentOrders, listRestaurants, listUsers, updateOrderStatus, updateRestaurant, updateUserRole } from './admin.service';

const adminOnly = [requireAuth, requireRole('admin')];
const validationError = (message: string) => ({ error: { code: 'VALIDATION_ERROR', message } });

export function registerAdminRoutes(app: Express) {
  app.get('/v1/admin/dashboard', ...adminOnly, async (_req, res, next) => {
    try { return res.json({ data: await getDashboard() }); } catch (error) { return next(error); }
  });

  app.get('/v1/admin/users', ...adminOnly, async (_req, res, next) => {
    try { return res.json({ data: await listUsers() }); } catch (error) { return next(error); }
  });

  app.patch('/v1/admin/users/:userId/role', ...adminOnly, async (req, res, next) => {
    try {
      const params = userIdParamsSchema.safeParse(req.params); const body = updateUserRoleSchema.safeParse(req.body);
      if (!params.success || !body.success) return res.status(400).json(validationError('Invalid user role update.'));
      return res.json({ data: await updateUserRole(req.auth!.userId, params.data.userId, body.data) });
    } catch (error) {
      if (error instanceof AdminError) return res.status(409).json({ error: { code: 'ADMIN_OPERATION_FAILED', message: error.message } });
      return next(error);
    }
  });

  app.get('/v1/admin/restaurants', ...adminOnly, async (_req, res, next) => {
    try { return res.json({ data: await listRestaurants() }); } catch (error) { return next(error); }
  });

  app.patch('/v1/admin/restaurants/:restaurantId', ...adminOnly, async (req, res, next) => {
    try {
      const params = restaurantIdParamsSchema.safeParse(req.params); const body = updateRestaurantSchema.safeParse(req.body);
      if (!params.success || !body.success) return res.status(400).json(validationError('Invalid restaurant update.'));
      return res.json({ data: await updateRestaurant(params.data.restaurantId, body.data) });
    } catch (error) {
      if (error instanceof AdminError) return res.status(404).json({ error: { code: 'RESTAURANT_NOT_FOUND', message: error.message } });
      return next(error);
    }
  });

  app.get('/v1/admin/orders', ...adminOnly, async (_req, res, next) => {
    try { return res.json({ data: await listRecentOrders() }); } catch (error) { return next(error); }
  });

  app.patch('/v1/admin/orders/:orderId/status', ...adminOnly, async (req, res, next) => {
    try {
      const params = orderIdParamsSchema.safeParse(req.params); const body = updateOrderStatusSchema.safeParse(req.body);
      if (!params.success || !body.success) return res.status(400).json(validationError('Invalid order status update.'));
      return res.json({ data: await updateOrderStatus(params.data.orderId, body.data) });
    } catch (error) {
      if (error instanceof AdminError) return res.status(409).json({ error: { code: 'ORDER_STATUS_CONFLICT', message: error.message } });
      return next(error);
    }
  });

  app.get('/v1/admin/categories', ...adminOnly, async (_req, res, next) => {
    try { return res.json({ data: await listCategories() }); } catch (error) { return next(error); }
  });

  app.post('/v1/admin/categories', ...adminOnly, async (req, res, next) => {
    try {
      const body = createCategorySchema.safeParse(req.body);
      if (!body.success) return res.status(400).json(validationError('Invalid category.'));
      return res.status(201).json({ data: await createCategory(body.data) });
    } catch (error) {
      if (error instanceof AdminError) return res.status(404).json({ error: { code: 'RESTAURANT_NOT_FOUND', message: error.message } });
      return next(error);
    }
  });

  app.delete('/v1/admin/categories/:categoryId', ...adminOnly, async (req, res, next) => {
    try {
      const params = categoryIdParamsSchema.safeParse(req.params);
      if (!params.success) return res.status(400).json(validationError('Invalid category ID.'));
      await deleteCategory(params.data.categoryId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof AdminError) return res.status(404).json({ error: { code: 'CATEGORY_NOT_FOUND', message: error.message } });
      return next(error);
    }
  });
}
