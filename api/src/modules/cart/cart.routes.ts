import type { Express } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { addCartItemSchema, cartItemParamsSchema, updateCartItemSchema } from './cart.schema';
import { CartItemError, addCartItem, getCart, removeCartItem, updateCartItem } from './cart.service';

export function registerCartRoutes(app: Express) {
  app.get('/v1/cart', requireAuth, async (req, res, next) => {
    try {
      return res.json({ data: await getCart(req.auth!.userId) });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/v1/cart/items', requireAuth, async (req, res, next) => {
    try {
      const parsed = addCartItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid cart item.' } });
      return res.status(200).json({ data: await addCartItem(req.auth!.userId, parsed.data) });
    } catch (error) {
      if (error instanceof CartItemError) return res.status(409).json({ error: { code: 'CART_ITEM_ERROR', message: error.message } });
      return next(error);
    }
  });

  app.patch('/v1/cart/items/:itemId', requireAuth, async (req, res, next) => {
    try {
      const params = cartItemParamsSchema.safeParse(req.params);
      const body = updateCartItemSchema.safeParse(req.body);
      if (!params.success || !body.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid cart item update.' } });
      return res.json({ data: await updateCartItem(req.auth!.userId, params.data.itemId, body.data) });
    } catch (error) {
      if (error instanceof CartItemError) return res.status(404).json({ error: { code: 'CART_ITEM_NOT_FOUND', message: error.message } });
      return next(error);
    }
  });

  app.delete('/v1/cart/items/:itemId', requireAuth, async (req, res, next) => {
    try {
      const params = cartItemParamsSchema.safeParse(req.params);
      if (!params.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid cart item.' } });
      return res.json({ data: await removeCartItem(req.auth!.userId, params.data.itemId) });
    } catch (error) {
      if (error instanceof CartItemError) return res.status(404).json({ error: { code: 'CART_ITEM_NOT_FOUND', message: error.message } });
      return next(error);
    }
  });
}
