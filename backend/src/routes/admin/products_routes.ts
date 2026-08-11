import { Router, Request, Response } from 'express';
import { getProducts, createProduct, updateProduct, toggleProductActive, deleteProduct, addProductImage, setPrimaryImage, deleteProductImage } from '../../services/products_service';
import { AppError } from '../../lib/errors_utils';
import { authRequired, adminOnly } from '../../middleware/auth';
import { eventBus, EVENTS } from '../../lib/eventBus';

const router = Router();
router.use(authRequired, adminOnly);

router.get('/', async (_req: Request, res: Response) => {
  const result = await getProducts({ page: 1, limit: 1000, includeInactive: true });
  res.json({ data: result.data, meta: result.meta });
});

router.post('/', async (req: Request, res: Response) => {
  const { category_id, name, slug, description, price, original_price, discount_percent, stock, weight_spec, origin, shipping_info, is_featured, composition, shelf_life, attributes } = req.body;

  if (!category_id || !name || !slug || price === undefined || stock === undefined) {
    res.status(400).json({ error: 'category_id, name, slug, price, stock wajib diisi' });
    return;
  }
  if (name.length < 2) { res.status(400).json({ error: 'Nama minimal 2 karakter' }); return; }
  if (price < 0) { res.status(400).json({ error: 'Harga tidak boleh negatif' }); return; }
  if (stock < 0) { res.status(400).json({ error: 'Stok tidak boleh negatif' }); return; }
  if (discount_percent !== undefined && (discount_percent < 0 || discount_percent > 90)) {
    res.status(400).json({ error: 'Diskon harus antara 0-90%' });
    return;
  }
  if (original_price !== undefined && (original_price < 0 || original_price < price)) {
    res.status(400).json({ error: 'original_price tidak boleh negatif atau lebih kecil dari harga jual' });
    return;
  }

  try {
    const id = await createProduct({
      category_id, name, slug,
      description: description || '',
      price, original_price,
      stock,
      weight_spec: weight_spec || '',
      origin: origin || '',
      shipping_info: shipping_info || null,
      is_featured: !!is_featured,
      discount_percent: discount_percent || 0,
      composition: composition || null,
      shelf_life: shelf_life || null,
      attributes: attributes || null,
    });
    res.status(201).json({ message: 'Produk berhasil dibuat', data: { id } });
    eventBus.emit(EVENTS.PRODUCTS, { action: 'create', id });
  } catch (e: any) {
    const status = e instanceof AppError ? e.status : 500;
    res.status(status).json({ error: e.message || 'Terjadi kesalahan' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  try {
    const updated = await updateProduct(id, req.body);
    if (!updated) { res.status(404).json({ error: 'Produk tidak ditemukan' }); return; }
    res.json({ message: 'Produk berhasil diupdate' });
    eventBus.emit(EVENTS.PRODUCTS, { action: 'update', id });
  } catch (e: any) {
    const status = e instanceof AppError ? e.status : 500;
    res.status(status).json({ error: e.message || 'Terjadi kesalahan' });
  }
});

router.patch('/:id/toggle-active', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const updated = await toggleProductActive(id);
  if (!updated) { res.status(404).json({ error: 'Produk tidak ditemukan' }); return; }
  res.json({ message: 'Status produk berhasil diubah' });
  eventBus.emit(EVENTS.PRODUCTS, { action: 'toggle-active', id });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const deleted = await deleteProduct(id);
  if (!deleted) { res.status(404).json({ error: 'Produk tidak ditemukan' }); return; }
  res.json({ message: 'Produk berhasil dihapus' });
  eventBus.emit(EVENTS.PRODUCTS, { action: 'delete', id });
});

// Images
router.post('/:id/images', async (req: Request, res: Response) => {
  const productId = parseInt(String(req.params.id));
  const { image_url, alt_text, is_primary } = req.body;
  if (isNaN(productId) || !image_url) { res.status(400).json({ error: 'id dan image_url wajib' }); return; }
  const imgId = await addProductImage(productId, image_url, alt_text, !!is_primary);
  res.status(201).json({ message: 'Gambar ditambahkan', data: { id: imgId } });
});

router.put('/:id/images/:imageId/primary', async (req: Request, res: Response) => {
  const productId = parseInt(String(req.params.id));
  const imageId = parseInt(String(req.params.imageId));
  if (isNaN(productId) || isNaN(imageId)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  await setPrimaryImage(productId, imageId);
  res.json({ message: 'Gambar utama diubah' });
});

router.delete('/:id/images/:imageId', async (req: Request, res: Response) => {
  const productId = parseInt(String(req.params.id));
  const imageId = parseInt(String(req.params.imageId));
  if (isNaN(productId) || isNaN(imageId)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const deleted = await deleteProductImage(imageId, productId);
  if (!deleted) { res.status(404).json({ error: 'Gambar tidak ditemukan' }); return; }
  res.json({ message: 'Gambar dihapus' });
});

export default router;
