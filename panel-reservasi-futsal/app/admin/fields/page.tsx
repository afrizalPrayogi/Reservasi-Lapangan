'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, Trash2, Plus, X } from 'lucide-react';
import { DashboardLayout } from '@/components/templates';
import { Button, Card, Input, Badge, Text } from '@/components/atoms';
import { useAuthStore, useFieldStore } from '@/stores';
import type { Field, FieldPrice, FieldOpeningHour } from '@/stores/fieldStore';
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
  openingHours: FieldOpeningHour[];
};

type PriceFormRow = {
  id: string;
  dayType: 'WEEKDAY' | 'WEEKEND';
  startHour: string;
  endHour: string;
  price: string;
};

type OpeningHourFormRow = {
  id: string;
  dayType: 'WEEKDAY' | 'WEEKEND';
  startHour: string;
  endHour: string;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function getFieldTypeLabel(type: string) {
  const labels: Record<string, string> = {
    VINYL: 'Vinyl (Karpet)',
    WOOD: 'Lantai Kayu',
    CEMENT: 'Semen',
  };
  return labels[type] || type;
}

const defaultImage =
  'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=60';

// Temporary hardcoded venueId - you can fetch this from user's venue or make it configurable
const DEFAULT_VENUE_ID = '794ac37d-2f68-4411-865e-ba5410c6b931';

export default function AdminFieldsPage() {
  const router = useRouter();
  const { isAuthenticated, initialized, checkAuth } = useAuthStore();
  const { fields, fetchFields, addField, updateField, deleteField, isLoading } = useFieldStore();

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState<FieldFormState>({
    venueId: DEFAULT_VENUE_ID,
    name: '',
    type: 'VINYL',
    isActive: true,
    lengthMeter: '48',
    widthMeter: '25',
    imageUrls: ['', '', '', ''],
    prices: [],
    openingHours: [],
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
  const [openingHourRows, setOpeningHourRows] = useState<OpeningHourFormRow[]>([]);
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [initialized, isAuthenticated, router]);

  useEffect(() => {
    if (initialized && isAuthenticated) {
      fetchFields().catch((err) => {
        console.warn('Failed to fetch fields:', err);
      });
    }
  }, [initialized, isAuthenticated, fetchFields]);

  const filteredFields = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter((f) =>
      [f.name, f.type].some((v) => v.toLowerCase().includes(q))
    );
  }, [fields, query]);

  const openCreate = () => {
    setFormError('');
    setMode('create');
    setEditingId(null);
    setForm({
      venueId: DEFAULT_VENUE_ID,
      name: '',
      type: 'VINYL',
      isActive: true,
      lengthMeter: '48',
      widthMeter: '25',
      imageUrls: ['', '', '', ''],
      prices: [],
      openingHours: [],
    });
    setPriceRows([
      {
        id: '1',
        dayType: 'WEEKDAY',
        startHour: '0',
        endHour: '24',
        price: '150000',
      },
      {
        id: '2',
        dayType: 'WEEKEND',
        startHour: '0',
        endHour: '24',
        price: '150000',
      },
    ]);
    setOpeningHourRows([
      {
        id: '1',
        dayType: 'WEEKDAY',
        startHour: '6',
        endHour: '24',
      },
      {
        id: '2',
        dayType: 'WEEKEND',
        startHour: '6',
        endHour: '24',
      },
    ]);
    setModalOpen(true);
  };

  const openEdit = (field: Field) => {
    setFormError('');
    setMode('edit');
    setEditingId(field.id);
    const urls = [...(field.imageUrls || [])];
    while (urls.length < 4) {
      urls.push('');
    }
    setForm({
      venueId: field.venueId || DEFAULT_VENUE_ID,
      name: field.name,
      type: field.type || 'VINYL',
      isActive: field.isActive ?? true,
      lengthMeter: String(field.lengthMeter || 48),
      widthMeter: String(field.widthMeter || 25),
      imageUrls: urls.slice(0, 4),
      prices: field.prices || [],
      openingHours: field.openingHours || [],
    });
    
    const rows: PriceFormRow[] = (field.prices || []).map((p, i) => ({
      id: String(i + 1),
      dayType: p.dayType,
      startHour: String(p.startHour),
      endHour: String(p.endHour),
      price: String(p.price),
    }));
    setPriceRows(rows.length > 0 ? rows : [
      { id: '1', dayType: 'WEEKDAY', startHour: '0', endHour: '24', price: '150000' },
      { id: '2', dayType: 'WEEKEND', startHour: '0', endHour: '24', price: '150000' }
    ]);

    const openingRows: OpeningHourFormRow[] = (field.openingHours || []).map((item, i) => ({
      id: String(i + 1),
      dayType: item.dayType,
      startHour: String(item.startHour),
      endHour: String(item.endHour ?? 24),
    }));
    setOpeningHourRows(openingRows.length > 0 ? openingRows : [
      { id: '1', dayType: 'WEEKDAY', startHour: '6', endHour: '24' },
      { id: '2', dayType: 'WEEKEND', startHour: '6', endHour: '24' }
    ]);
    
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError('');
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
      if (!Number.isFinite(price) || price <= 0)
        return setFormError('Harga harus angka > 0');

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

    const openingHours: FieldOpeningHour[] = [];
    for (const row of openingHourRows) {
      const start = Number(row.startHour);
      const end = Number(row.endHour);

      if (!Number.isFinite(start) || start < 0 || start > 23)
        return setFormError('Jam buka harus 0-23');
      if (end !== 24) return setFormError('Jam tutup operasional harus 24:00');
      if (start >= end) return setFormError('Jam buka harus lebih kecil dari jam tutup');

      openingHours.push({
        dayType: row.dayType,
        startHour: start,
        endHour: end,
      });
    }

    if (openingHours.length === 0) {
      return setFormError('Minimal 1 jam operasional harus diisi');
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
      openingHours,
    };

    try {
      if (mode === 'create') {
        await addField(payload);
      } else if (mode === 'edit' && editingId) {
        await updateField(editingId, payload);
      }
      closeModal();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data');
    }
  };

  const onDelete = async (field: Field) => {
    const ok = window.confirm(`Hapus ${field.name}?`);
    if (!ok) return;
    try {
      await deleteField(field.id);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus lapangan');
    }
  };

  const displayImage = (field: Field) => {
    if (field.imageUrls && field.imageUrls.length > 0) return field.imageUrls[0];
    if (field.image) return field.image;
    return defaultImage;
  };

  return (
    <DashboardLayout title="Kelola Lapangan" breadcrumb={['Admin', 'Kelola Lapangan']}>
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl w-full">
            <Input
              fullWidth
              placeholder="Cari lapangan..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Button onClick={openCreate} disabled={isLoading} className="sm:w-auto w-full">
            <Plus size={18} />
            Tambah Lapangan
          </Button>
        </div>

        {isLoading && fields.length === 0 ? (
          <Card>
            <Text variant="body" className="text-gray-600">
              Memuat data...
            </Text>
          </Card>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFields.map((field) => (
                <Card
                  key={field.id}
                  className="rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  padding="none"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={displayImage(field)}
                      alt={field.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant={field.isActive ? 'success' : 'error'}>
                        {field.isActive ? 'Aktif' : 'Tidak aktif'}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Text variant="h4" className="font-extrabold text-gray-900">
                          {field.name}
                        </Text>
                        <Text variant="caption" className="text-gray-500">
                          {getFieldTypeLabel(field.type)}
                        </Text>
                        {field.lengthMeter && field.widthMeter && (
                          <Text variant="caption" className="text-gray-500">
                            {field.lengthMeter}m x {field.widthMeter}m
                          </Text>
                        )}
                      </div>

                      <div className="text-right">
                        {field.prices && field.prices.length > 0 && (
                          <>
                            <div className="text-xs text-gray-500">mulai dari</div>
                            <div className="text-sm font-semibold text-gray-700">
                              {formatRupiah(field.prices[0].price)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button
                        variant="ghost"
                        className="bg-white border border-gray-200 hover:bg-gray-100"
                        onClick={() => router.push(`/admin/fields/${field.id}`)}
                      >
                        <Eye size={16} />
                        Detail
                      </Button>
                      <Button
                        variant="ghost"
                        className="bg-red-100 text-red-700 hover:bg-red-200"
                        onClick={() => onDelete(field)}
                      >
                        <Trash2 size={16} />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {filteredFields.length === 0 && (
                <Card className="col-span-full">
                  <Text variant="body" className="text-gray-600">
                    Tidak ada lapangan yang cocok.
                  </Text>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

          <Card className="relative w-full max-w-3xl my-8 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto" padding="lg">
            <div className="flex items-start justify-between gap-4 sticky top-0 bg-white pb-4 border-b">
              <div>
                <Text variant="h3">
                  {mode === 'create' ? 'Tambah Lapangan' : 'Edit Lapangan'}
                </Text>
                <Text variant="caption" className="text-gray-500">
                  Lengkapi data lapangan di bawah.
                </Text>
              </div>
              <Button variant="ghost" onClick={closeModal}>
                Tutup
              </Button>
            </div>

            {formError && (
              <div className="mt-4">
                <Card className="bg-red-50 border-red-200" padding="sm">
                  <Text variant="caption" className="text-red-700">
                    {formError}
                  </Text>
                </Card>
              </div>
            )}

            <div className="mt-5 space-y-6">
              {/* Basic Info */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Status
                  </label>
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

              {/* Images */}
              <div className="space-y-5">
                <Text variant="body" className="font-bold text-gray-700 block">
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
                  <label className="block text-sm font-medium text-gray-700">
                    Harga Per Jam
                  </label>
                  <Button type="button" size="sm" onClick={addPriceRow}>
                    <Plus size={16} />
                    Tambah Harga
                  </Button>
                </div>
                <Text variant="caption" className="text-gray-500 block mb-3">
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
                            onChange={(e) =>
                              updatePriceRow(row.id, 'dayType', e.target.value)
                            }
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
                            onChange={(e) =>
                              updatePriceRow(row.id, 'startHour', e.target.value)
                            }
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
                            onChange={(e) =>
                              updatePriceRow(row.id, 'endHour', e.target.value)
                            }
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

              {/* Operational Hours */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Jam Operasional
                  </label>
                </div>
                <Text variant="caption" className="text-gray-500 block mb-3">
                  Atur jam mulai buka untuk Weekday dan Weekend. Jam tutup dibuat tetap 24:00.
                </Text>

                <div className="space-y-3">
                  {openingHourRows.map((row) => (
                    <Card key={row.id} className="p-3 bg-gray-50" padding="none">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Hari</label>
                          <select
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            value={row.dayType}
                            onChange={(e) =>
                              setOpeningHourRows((rows) =>
                                rows.map((item) =>
                                  item.id === row.id
                                    ? { ...item, dayType: e.target.value as 'WEEKDAY' | 'WEEKEND' }
                                    : item
                                )
                              )
                            }
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
                            onChange={(e) =>
                              setOpeningHourRows((rows) =>
                                rows.map((item) =>
                                  item.id === row.id
                                    ? { ...item, startHour: e.target.value }
                                    : item
                                )
                              )
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Sampai Jam</label>
                          <input
                            type="number"
                            min="24"
                            max="24"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500 focus:outline-none"
                            value={row.endHour}
                            readOnly
                          />
                        </div>

                        <div className="flex items-end">
                          <div className="text-xs text-gray-500">
                            Jam tutup selalu 24:00
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex flex-col-reverse sm:flex-row gap-3 sm:justify-end sticky bottom-0 bg-white">
              <Button variant="outline" onClick={closeModal}>
                Batal
              </Button>
              <Button onClick={onSubmit} disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : mode === 'create' ? 'Simpan' : 'Update'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
