import { Router, Request, Response } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../services/user/wishlist_service';
import { authRequired } from '../../middleware/auth';

const router = Router();
router.use(authRequired);

router.get('/', async (req: Request, res: Response) => {
  const data = await getWishlist(req.user!.userId);
  res.json({ data });
});

router.post('/:productId', async (req: Request, res: Response) => {
  const productId = parseInt(String(req.params.productId));
  if (isNaN(productId)) { res.status(400).json({ error: 'ID produk tidak valid' }); return; }

  const result = await addToWishlist(req.user!.userId, productId);
  if (result === null) {
    res.json({ message: 'Produk sudah ada di wishlist' });
  } else {
    res.status(201).json({ message: 'Produk ditambahkan ke wishlist' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const deleted = await removeFromWishlist(req.user!.userId, id);
  if (!deleted) { res.status(404).json({ error: 'Wishlist tidak ditemukan' }); return; }
  res.json({ message: 'Dihapus dari wishlist' });
});

export default router;
