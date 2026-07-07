'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/templates';
import { Button, Card, Input, Text } from '@/components/atoms';
import { useAuthStore, useFieldStore } from '@/stores';
import type { Field, FieldPrice } from '@/stores/fieldStore';
import { fieldService } from '@/services';

type FieldFormState = {
  venueId: string;
  name: string;
  type: string;
  isActive: boolean;
  lengthMeter: string;
  widthMeter: string;
  imageUrls: string[];
  prices: FieldPrice[];
};

type PriceFormRow = {
  id: string;
  dayType: 'WEEKDAY' | 'WEEKEND';
  startHour: string;
  endHour: string;
  price: string;
};

const defaultImage =
  'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=60';

const DEFAULT_VENUE_ID = '794ac37d-2f68-4411-865e-ba5410c6b931';

export default function EditFieldPage() {
  const router = useRouter();
  const params = useParams();
  const fieldId = params.id as string;

  const { isAuthenticated, initialized, checkAuth } = useAuthStore();
  const { updateField, isLoading } = useFieldStore();

  const [form, setForm] = useState<FieldFormState>({
    venueId: DEFAULT_VENUE_ID,
    name: '',
    type: 'SYNTHETIC',
    isActive: true,
    lengthMeter: '48',
    widthMeter: '25',
    imageUrls: ['', '', '', ''],
    prices: [],
  });

  const updateImageUrl = (idx: number, val: string) => {
    setForm((s) => {
      const newUrls = [...s.imageUrls];
      while (newUrls.length <= idx) {
        newUrls.push('');
      }
      newUrls[idx] = val;
      return { ...s, imageUrls: newUrls };
    });
  };

  const [uploadingIndices, setUploadingIndices] = useState<Record<number, boolean>>({});

  const handleImageUpload = async (idx: number, file: File | null) => {
    if (!file) return;
    setUploadingIndices((prev) => ({ ...prev, [idx]: true }));
    setFormError('');
    try {
      const url = await fieldService.uploadImage(file);
      updateImageUrl(idx, url);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Gagal mengunggah gambar');
    } finally {
      setUploadingIndices((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const [priceRows, setPriceRows] = useState<PriceFormRow[]>([]);
  const [formError, setFormError] = useState<string>('');
  const [loadError, setLoadError] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [initialized, isAuthenticated, router]);

  useEffect(() => {
    if (initialized && isAuthenticated && fieldId) {
      loadFieldData();
    }
  }, [initialized, isAuthenticated, fieldId]);

  const loadFieldData = async () => {
    try {
      const field = await fieldService.getFieldById(fieldId);
      const urls = [...(field.imageUrls || [])];
      while (urls.length < 4) {
        urls.push('');
      }
      setForm({
        venueId: field.venueId || DEFAULT_VENUE_ID,
        name: field.name,
        type: field.type || 'SYNTHETIC',
        isActive: field.isActive ?? true,
        lengthMeter: String(field.lengthMeter || 48),
        widthMeter: String(field.widthMeter || 25),
        imageUrls: urls.slice(0, 4),
        prices: field.prices || [],
      });

      const rows: PriceFormRow[] = (field.prices || []).map((p, i) => ({
        id: String(i + 1),
        dayType: p.dayType,
        startHour: String(p.startHour),
        endHour: String(p.endHour),
        price: String(p.price),
      }));
      setPriceRows(
        rows.length > 0
          ? rows
          : [
              { id: '1', dayType: 'WEEKDAY', startHour: '0', endHour: '24', price: '150000' },
              { id: '2', dayType: 'WEEKEND', startHour: '0', endHour: '24', price: '150000' }
            ]
      );
    } catch (err: any) {
      setLoadError(err.message || 'Gagal memuat data lapangan');
    }
  };

  const addPriceRow = () => {
    const newId = String(priceRows.length + 1);
    setPriceRows((rows) => [
      ...rows,
      { id: newId, dayType: 'WEEKDAY', startHour: '8', endHour: '17', price: '150000' },
    ]);
  };

  const removePriceRow = (id: string) => {
    setPriceRows((rows) => rows.filter((r) => r.id !== id));
  };

  const updatePriceRow = (id: string, field: keyof PriceFormRow, value: any) => {
    setPriceRows((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const onSubmit = async () => {
    setFormError('');

    const name = form.name.trim();
    const type = form.type.trim();
    const lengthMeter = Number(form.lengthMeter);
    const widthMeter = Number(form.widthMeter);

    if (!name) return setFormError('Nama lapangan wajib diisi');
    if (!type) return setFormError('Tipe lapangan wajib diisi');
    if (!Number.isFinite(lengthMeter) || lengthMeter <= 0)
      return setFormError('Panjang lapangan harus angka > 0');
    if (!Number.isFinite(widthMeter) || widthMeter <= 0)
      return setFormError('Lebar lapangan harus angka > 0');

    // Validate prices
    const prices: FieldPrice[] = [];
    for (const row of priceRows) {
      const start = Number(row.startHour);
      const end = Number(row.endHour);
      const price = Number(row.price);

      if (!Number.isFinite(start) || start < 0 || start > 23)
        return setFormError('Jam mulai harus 0-23');
      if (!Number.isFinite(end) || end < 1 || end > 24)
        return setFormError('Jam selesai harus 1-24');
      if (start >= end) return setFormError('Jam mulai harus < jam selesai');
      if (!Number.isFinite(price) || price <= 0) return setFormError('Harga harus angka > 0');

      prices.push({
        dayType: row.dayType,
        startHour: start,
        endHour: end,
        price,
      });
    }

    if (prices.length === 0) {
      return setFormError('Minimal 1 harga harus diisi');
    }

    const cleanedUrls = form.imageUrls.map((u) => u.trim()).filter(Boolean);
    const payload = {
      venueId: form.venueId,
      name,
      type,
      isActive: form.isActive,
      lengthMeter,
      widthMeter,
      imageUrls: cleanedUrls.length > 0 ? cleanedUrls : [defaultImage],
      prices,
    };

    try {
      await updateField(fieldId, payload);
      router.push(`/admin/fields/${fieldId}`);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data');
    }
  };

  if (loadError) {
    return (
      <DashboardLayout title="Edit Lapangan" breadcrumb={['Admin', 'Kelola Lapangan', 'Edit']}>
        <Card className="bg-red-50 border-red-200">
          <Text variant="body" className="text-red-700">
            {loadError}
          </Text>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/fields')}>
            Kembali
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Lapangan" breadcrumb={['Admin', 'Kelola Lapangan', 'Edit']}>
      <div className="space-y-6">
        {/* Header */}
        <Button variant="outline" onClick={() => router.push(`/admin/fields/${fieldId}`)}>
          <ArrowLeft size={18} />
          Batal
        </Button>

        {formError && (
          <Card className="bg-red-50 border-red-200" padding="sm">
            <Text variant="caption" className="text-red-700">
              {formError}
            </Text>
          </Card>
        )}

        {/* Form */}
        <Card>
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <Text variant="h4" className="mb-4 font-bold">
                Informasi Lapangan
              </Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  fullWidth
                  label="Nama Lapangan"
                  placeholder="Contoh: Lapangan Badminton - A"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tipe Lapangan
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.type}
                    onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
                  >
                    <option value="VINYL">Vinyl (Karpet)</option>
                    <option value="WOOD">Lantai Kayu</option>
                    <option value="CEMENT">Semen</option>
                  </select>
                </div>

                <Input
                  fullWidth
                  label="Panjang (meter)"
                  placeholder="48"
                  inputMode="numeric"
                  value={form.lengthMeter}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      lengthMeter: e.target.value.replace(/[^0-9]/g, ''),
                    }))
                  }
                />

                <Input
                  fullWidth
                  label="Lebar (meter)"
                  placeholder="25"
                  inputMode="numeric"
                  value={form.widthMeter}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      widthMeter: e.target.value.replace(/[^0-9]/g, ''),
                    }))
                  }
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <button
                    type="button"
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors text-sm font-medium ${
                      form.isActive
                        ? 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100'
                        : 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
                    }`}
                    onClick={() => setForm((s) => ({ ...s, isActive: !s.isActive }))}
                  >
                    {form.isActive ? 'Aktif' : 'Tidak aktif'}
                  </button>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-5">
              <Text variant="h4" className="font-bold block">
                Gambar Lapangan
              </Text>
              
              <div className="space-y-1.5">
                <Input
                  fullWidth
                  label="Thumbnail (Card Lapangan)"
                  placeholder="Masukkan link gambar (jpg, png, webp) atau URL"
                  value={form.imageUrls[0] || ''}
                  onChange={(e) => updateImageUrl(0, e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(0, e.target.files?.[0] || null)}
                    className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/15 cursor-pointer"
                  />
                  {uploadingIndices[0] && (
                    <span className="text-xs text-primary animate-pulse font-medium">Mengunggah...</span>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-4">
                <Text variant="caption" className="font-medium text-gray-500 block">
                  Galeri Foto Detail (Maksimal 3 Foto)
                </Text>
                
                <div className="space-y-1.5">
                  <Input
                    fullWidth
                    label="Galeri Foto 1"
                    placeholder="Masukkan link gambar (jpg, png, webp) atau URL"
                    value={form.imageUrls[1] || ''}
                    onChange={(e) => updateImageUrl(1, e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(1, e.target.files?.[0] || null)}
                      className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/15 cursor-pointer"
                    />
                    {uploadingIndices[1] && (
                      <span className="text-xs text-primary animate-pulse font-medium">Mengunggah...</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Input
                    fullWidth
                    label="Galeri Foto 2"
                    placeholder="Masukkan link gambar (jpg, png, webp) atau URL"
                    value={form.imageUrls[2] || ''}
                    onChange={(e) => updateImageUrl(2, e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(2, e.target.files?.[0] || null)}
                      className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/15 cursor-pointer"
                    />
                    {uploadingIndices[2] && (
                      <span className="text-xs text-primary animate-pulse font-medium">Mengunggah...</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Input
                    fullWidth
                    label="Galeri Foto 3"
                    placeholder="Masukkan link gambar (jpg, png, webp) atau URL"
                    value={form.imageUrls[3] || ''}
                    onChange={(e) => updateImageUrl(3, e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(3, e.target.files?.[0] || null)}
                      className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/15 cursor-pointer"
                    />
                    {uploadingIndices[3] && (
                      <span className="text-xs text-primary animate-pulse font-medium">Mengunggah...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Prices */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Text variant="h4" className="font-bold">
                  Harga Per Jam
                </Text>
                <Button type="button" size="sm" onClick={addPriceRow}>
                  <Plus size={16} />
                  Tambah Harga
                </Button>
              </div>
              <Text variant="caption" className="text-gray-500 block mb-4">
                Tips: Atur <b>Dari Jam: 0</b> dan <b>Sampai Jam: 24</b> untuk menetapkan harga seharian penuh.
              </Text>

              <div className="space-y-3">
                {priceRows.map((row) => (
                  <Card key={row.id} className="p-3 bg-gray-50" padding="none">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hari</label>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={row.dayType}
                          onChange={(e) => updatePriceRow(row.id, 'dayType', e.target.value)}
                        >
                          <option value="WEEKDAY">Weekday</option>
                          <option value="WEEKEND">Weekend</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Dari Jam</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={row.startHour}
                          onChange={(e) => updatePriceRow(row.id, 'startHour', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Sampai Jam</label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={row.endHour}
                          onChange={(e) => updatePriceRow(row.id, 'endHour', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Harga (Rp)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={row.price}
                          onChange={(e) =>
                            updatePriceRow(
                              row.id,
                              'price',
                              e.target.value.replace(/[^0-9]/g, '')
                            )
                          }
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          fullWidth
                          onClick={() => removePriceRow(row.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => router.push(`/admin/fields/${fieldId}`)}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
