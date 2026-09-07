import type { Express } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { requireRole } from '../auth/auth.roles';
import { createCategorySchema, createMenuItemSchema, menuItemIdParamsSchema, categoryIdParamsSchema, orderIdParamsSchema, restaurantOrderStatusSchema, updateCategorySchema, updateMenuItemSchema } from './restaurant.schema';
import { RestaurantOperationError, createCategory, createMenuItem, deleteCategory, listStaffMenu, listStaffOrders, setMenuItemAvailability, updateCategory, updateMenuItem, updateStaffOrderStatus } from './restaurant.service';

const staffOnly = [requireAuth, requireRole('restaurant_staff')];
const validationError = (message: string) => ({ error: { code: 'VALIDATION_ERROR', message } });

export function registerRestaurantStaffRoutes(app: Express) {
  app.get('/v1/restaurant/menu', ...staffOnly, async (req, res, next) => {
    try { return res.json({ data: await listStaffMenu(req.auth!.userId) }); } catch (error) { return next(error); }
  });

  app.post('/v1/restaurant/menu/items', ...staffOnly, async (req, res, next) => {
    try {
      const body = createMenuItemSchema.safeParse(req.body);
      if (!body.success) return res.status(400).json(validationError('Invalid menu item.'));
      return res.status(201).json({ data: await createMenuItem(req.auth!.userId, body.data) });
    } catch (error) {
      if (error instanceof RestaurantOperationError) return res.status(409).json({ error: { code: 'RESTAURANT_OPERATION_FAILED', message: error.message } });
      return next(error);
    }
  });

  app.patch('/v1/restaurant/menu/items/:menuItemId', ...staffOnly, async (req, res, next) => {
    try {
      const params = menuItemIdParamsSchema.safeParse(req.params); const body = updateMenuItemSchema.safeParse(req.body);
      if (!params.success || !body.success) return res.status(400).json(validationError('Invalid menu item update.'));
      return res.json({ data: await updateMenuItem(req.auth!.userId, params.data.menuItemId, body.data) });
    } catch (error) {
      if (error instanceof RestaurantOperationError) return res.status(409).json({ error: { code: 'RESTAURANT_OPERATION_FAILED', message: error.message } });
      return next(error);
    }
  });

  app.patch('/v1/restaurant/menu/items/:menuItemId/availability', ...staffOnly, async (req, res, next) => {
    try {
      const params = menuItemIdParamsSchema.safeParse(req.params);
      const available = typeof req.body?.isAvailable === 'boolean' ? req.body.isAvailable : null;
      if (!params.success || available === null) return res.status(400).json(validationError('isAvailable must be a boolean.'));
      return res.json({ data: await setMenuItemAvailability(req.auth!.userId, params.data.menuItemId, available) });
    } catch (error) {
      if (error instanceof RestaurantOperationError) return res.status(404).json({ error: { code: 'MENU_ITEM_NOT_FOUND', message: error.message } });
      return next(error);
    }
  });

  app.post('/v1/restaurant/categories', ...staffOnly, async (req, res, next) => {
    try {
      const body = createCategorySchema.safeParse(req.body);
      if (!body.success) return res.status(400).json(validationError('Invalid category.'));
      return res.status(201).json({ data: await createCategory(req.auth!.userId, body.data.name) });
    } catch (error) {
      if (error instanceof RestaurantOperationError) return res.status(409).json({ error: { code: 'RESTAURANT_OPERATION_FAILED', message: error.message } });
      return next(error);
    }
  });

  app.patch('/v1/restaurant/categories/:categoryId', ...staffOnly, async (req, res, next) => {
    try {
      const params = categoryIdParamsSchema.safeParse(req.params); const body = updateCategorySchema.safeParse(req.body);
      if (!params.success || !body.success) return res.status(400).json(validationError('Invalid category update.'));
      return res.json({ data: await updateCategory(req.auth!.userId, params.data.categoryId, body.data.name) });
    } catch (error) {
      if (error instanceof RestaurantOperationError) return res.status(404).json({ error: { code: 'CATEGORY_NOT_FOUND', message: error.message } });
      return next(error);
    }
  });

  app.delete('/v1/restaurant/categories/:categoryId', ...staffOnly, async (req, res, next) => {
    try {
      const params = categoryIdParamsSchema.safeParse(req.params);
      if (!params.success) return res.status(400).json(validationError('Invalid category ID.'));
      await deleteCategory(req.auth!.userId, params.data.categoryId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof RestaurantOperationError) return res.status(404).json({ error: { code: 'CATEGORY_NOT_FOUND', message: error.message } });
      return next(error);
    }
  });

  app.get('/v1/restaurant/orders', ...staffOnly, async (req, res, next) => {
    try { return res.json({ data: await listStaffOrders(req.auth!.userId) }); } catch (error) { return next(error); }
  });

  app.patch('/v1/restaurant/orders/:orderId/status', ...staffOnly, async (req, res, next) => {
    try {
      const params = orderIdParamsSchema.safeParse(req.params); const body = restaurantOrderStatusSchema.safeParse(req.body);
      if (!params.success || !body.success) return res.status(400).json(validationError('Invalid order status update.'));
      return res.json({ data: await updateStaffOrderStatus(req.auth!.userId, params.data.orderId, body.data.status) });
    } catch (error) {
      if (error instanceof RestaurantOperationError) return res.status(409).json({ error: { code: 'ORDER_STATUS_CONFLICT', message: error.message } });
      return next(error);
    }
  });
}
