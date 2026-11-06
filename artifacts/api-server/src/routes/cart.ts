import { Router, type Response } from "express";
import {
  GetCartResponse, AddCartItemBody, UpdateCartItemBody, UpdateCartItemParams,
  RemoveCartItemBody, RemoveCartItemParams, ClearCartBody, MergeCartBody,
} from "@workspace/api-zod";
import { authenticateToken, type AuthRequest } from "../middleware/auth.js";
import { CartError, changeCart, readCart, listingSnapshot, matchingItem, sameRevision } from "../lib/cart.js";
import { listings } from "../data/store.js";

const router = Router();
router.use("/cart", authenticateToken);
const validNumbers = (body: { quantity?: number; revision?: number }) =>
  (body.quantity === undefined || Number.isSafeInteger(body.quantity)) &&
  (body.revision === undefined || Number.isSafeInteger(body.revision));

function endpoint(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return async (req: AuthRequest, res: Response) => {
    try { await handler(req, res); }
    catch (error) {
      if (error instanceof CartError) {
        res.status(error.status).json({ error: "cart_conflict", message: error.message });
      } else {
        req.log?.error({ err: error }, "Cart persistence failed");
        res.status(503).json({ error: "cart_unavailable", message: "Savatcha saqlanmadi. Internetga ulanib, qayta urinib ko‘ring." });
      }
    }
  };
}

router.get("/cart", endpoint(async (req, res) => {
  res.json(GetCartResponse.parse(await readCart(req.userId!)));
}));

router.post("/cart/items", endpoint(async (req, res) => {
  const parsed = AddCartItemBody.safeParse(req.body);
  if (!parsed.success || !validNumbers(parsed.data)) { res.status(400).json({ error: "validation" }); return; }
  const body = parsed.data;
  const cart = await changeCart(req.userId!, body.operationId, { action: "add", ...body }, async (cart, hasOrder) => {
    const listing = listingSnapshot(body.listingId);
    if (!Number.isFinite(listing.price) || listing.price < 0) throw new CartError(409, "Mahsulot narxi noto‘g‘ri.");
    if (listing.userId === req.userId) throw new CartError(403, "O‘z mahsulotingizni savatchaga qo‘sha olmaysiz.");
    if (listing.status !== "active") throw new CartError(409, "Bu mahsulot sotuvda emas.");
    const existing = cart.items.find(item => item.listing.id === body.listingId);
    if (existing) {
      if (await hasOrder(existing.requestId)) throw new CartError(409, "Bu mahsulot buyurtma qilingan. Buyurtmalarimni tekshiring.");
      if (existing.quantity + body.quantity > 999) throw new CartError(409, "Miqdor 999 dan oshmasligi kerak.");
      existing.quantity += body.quantity;
      // Keep the confirmed price and original checkout identity.
    } else {
      if (cart.items.some(item => item.requestId === body.requestId)) throw new CartError(409, "Xarid identifikatori allaqachon ishlatilgan.");
      cart.items.push({ listing, quantity: body.quantity, requestId: body.requestId });
    }
  });
  res.json(GetCartResponse.parse(cart));
}));

router.patch("/cart/items/:listingId", endpoint(async (req, res) => {
  const parsed = UpdateCartItemBody.safeParse(req.body);
  const params = UpdateCartItemParams.safeParse(req.params);
  if (!parsed.success || !params.success || !validNumbers(parsed.data)) { res.status(400).json({ error: "validation" }); return; }
  const body = parsed.data;
  const cart = await changeCart(req.userId!, body.operationId, { action: "quantity", listingId: params.data.listingId, ...body }, async (cart, hasOrder) => {
    sameRevision(cart, body.revision);
    const item = matchingItem(cart, params.data.listingId, body.requestId);
    if (body.quantity !== item.quantity && await hasOrder(item.requestId)) {
      throw new CartError(409, "Buyurtma allaqachon yuborilgan. Buyurtmalarimni tekshiring.");
    }
    item.quantity = body.quantity;
    if (body.refreshListing) item.listing = listingSnapshot(params.data.listingId);
  });
  res.json(GetCartResponse.parse(cart));
}));

router.delete("/cart/items/:listingId", endpoint(async (req, res) => {
  const parsed = RemoveCartItemBody.safeParse(req.body);
  const params = RemoveCartItemParams.safeParse(req.params);
  if (!parsed.success || !params.success || !validNumbers(parsed.data)) { res.status(400).json({ error: "validation" }); return; }
  const body = parsed.data;
  const cart = await changeCart(req.userId!, body.operationId, { action: "remove", listingId: params.data.listingId, ...body }, cart => {
    const item = cart.items.find(item => item.listing.id === params.data.listingId && item.requestId === body.requestId);
    if (!item) return; // Never remove a newer purchase identity.
    if (item.quantity !== body.quantity) throw new CartError(409, "Miqdor boshqa telefonda o‘zgardi. Buyurtmalarim va savatchani tekshiring.");
    cart.items = cart.items.filter(item => item.requestId !== body.requestId);
  });
  res.json(GetCartResponse.parse(cart));
}));

router.delete("/cart", endpoint(async (req, res) => {
  const parsed = ClearCartBody.safeParse(req.body);
  if (!parsed.success || !validNumbers(parsed.data)) { res.status(400).json({ error: "validation" }); return; }
  const body = parsed.data;
  const cart = await changeCart(req.userId!, body.operationId, { action: "clear", ...body }, cart => {
    sameRevision(cart, body.revision);
    cart.items = [];
  });
  res.json(GetCartResponse.parse(cart));
}));

router.post("/cart/merge", endpoint(async (req, res) => {
  const parsed = MergeCartBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.items.every(item =>
    validNumbers(item) && Number.isFinite(item.listing.price) && item.listing.price >= 0
  )) { res.status(400).json({ error: "validation" }); return; }
  const body = parsed.data;
  const cart = await changeCart(req.userId!, body.operationId, { action: "merge", ...body }, async (cart, hasOrder) => {
    const ids = new Set<string>();
    const requests = new Set<string>();
    for (const local of body.items) {
      if (ids.has(local.listing.id) || requests.has(local.requestId)) throw new CartError(400, "Takrorlangan mahsulot yoki xarid so‘rovi.");
      ids.add(local.listing.id);
      requests.add(local.requestId);
      if (cart.items.some(item => item.requestId === local.requestId && item.listing.id !== local.listing.id)) {
        throw new CartError(409, "Xarid identifikatori boshqa mahsulotga tegishli.");
      }
      if (local.listing.userId === req.userId || listings.find(item => item.id === local.listing.id)?.userId === req.userId) {
        throw new CartError(403, "O‘z mahsulotingizni qo‘sha olmaysiz.");
      }
      const existing = cart.items.find(item => item.listing.id === local.listing.id && item.requestId === local.requestId)
        ?? cart.items.find(item => item.listing.id === local.listing.id);
      if (existing) {
        if (existing.requestId !== local.requestId &&
            (await hasOrder(existing.requestId) || await hasOrder(local.requestId))) {
          // Distinct purchase attempts must stay distinct when either has an order.
          // Folding them together would discard an uncertain checkout identity.
          cart.items.push(local);
          continue;
        }
        if (await hasOrder(existing.requestId) && existing.quantity !== local.quantity) {
          // Never alter the quantity attached to an already recorded purchase.
          continue;
        }
        existing.quantity = Math.max(existing.quantity, local.quantity);
      } else {
        // Keep legacy checkout identity and price even if the listing was deleted.
        cart.items.push(local);
      }
    }
  });
  res.json(GetCartResponse.parse(cart));
}));

export default router;
