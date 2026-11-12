import { Router } from 'express';
import { listings } from '../data/store.js';
import { adviceReplyLanguage } from '../lib/advice-language.js';
import { translateListingBatch } from '../lib/listing-translation.js';

const router = Router();
router.post('/listings/translate', async (req, res) => {
  const { listingIds, language } = req.body ?? {};
  if (typeof language !== 'string' || !adviceReplyLanguage(language) || !Array.isArray(listingIds) ||
    listingIds.length < 1 || listingIds.length > 20 ||
    listingIds.some(id => typeof id !== 'string' || !id || id.length > 160)) {
    res.status(400).json({ error: 'invalid_translation_request' }); return;
  }
  // Guests may browse translated public ads; never translate private/paused/deleted listings.
  const ids = new Set(listingIds);
  const sources = listings.filter(item => ids.has(item.id) && item.status === 'active')
    .map(item => ({ id: item.id, title: item.title, description: item.description }));
  const items = await translateListingBatch(sources, language);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ items: items.filter(item => listings.some(current => current.id === item.id &&
    current.status === 'active' && current.title === item.sourceTitle &&
    (current.description ?? '') === item.sourceDescription)) });
});
export default router;
