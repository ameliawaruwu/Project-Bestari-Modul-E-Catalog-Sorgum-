import { Router, Request, Response } from 'express';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../../services/user/addresses_service';
import { authRequired } from '../../middleware/auth';

const router = Router();
router.use(authRequired);

router.get('/', async (req: Request, res: Response) => {
  const data = await getAddresses(req.user!.userId);
  res.json({ data });
});

router.post('/', async (req: Request, res: Response) => {
  const { label, recipient_name, phone, address_line, city, province, postal_code } = req.body;
  if (!label || !recipient_name || !phone || !address_line) {
    res.status(400).json({ error: 'label, recipient_name, phone, address_line wajib' });
    return;
  }
  try {
    const id = await createAddress(req.user!.userId, req.body);
    res.status(201).json({ message: 'Alamat ditambahkan', data: { id } });
  } catch (e: any) {
    // Limit maks 3 alamat per user — err.status=400 sudah diset di service
    res.status(e?.status || 400).json({ error: e?.message || 'Gagal menambahkan alamat' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const updated = await updateAddress(id, req.user!.userId, req.body);
  if (!updated) { res.status(404).json({ error: 'Alamat tidak ditemukan' }); return; }
  res.json({ message: 'Alamat diupdate' });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const deleted = await deleteAddress(id, req.user!.userId);
  if (!deleted) { res.status(404).json({ error: 'Alamat tidak ditemukan' }); return; }
  res.json({ message: 'Alamat dihapus' });
});

export default router;
