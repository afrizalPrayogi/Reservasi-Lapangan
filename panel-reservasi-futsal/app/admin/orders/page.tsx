"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, TrendingUp, Clock, DollarSign, Calendar, X, FileDown, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/templates";
import { Button, Card, Input, Badge, Text } from "@/components/atoms";
import { useAuthStore } from "@/stores";
import { bookingService, BookingResponse, BookingStats, fieldService, FieldResponse } from "@/services";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getStatusVariant(
  status: string
): "success" | "warning" | "error" | "info" {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "success";
    case "WAITING_PAYMENT":
    case "WAITING_VERIFICATION":
      return "warning";
    case "REJECTED":
    case "CANCELLED":
      return "error";
    default:
      return "info";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "WAITING_PAYMENT":
      return "Menunggu Pembayaran";
    case "WAITING_VERIFICATION":
      return "Menunggu Verifikasi";
    case "CONFIRMED":
      return "Dikonfirmasi";
    case "REJECTED":
      return "Ditolak";
    case "CANCELLED":
      return "Dibatalkan";
    case "COMPLETED":
      return "Selesai";
    default:
      return status;
  }
}

function getBookingStatusLabel(booking: BookingResponse): string {
  if (booking.status === "PAID") {
    if (booking.isDp && booking.paidAmount < booking.totalPrice) {
      return "DP (Belum Lunas)";
    }
    return "Lunas";
  }
  return getStatusLabel(booking.status);
}

function getBookingStatusVariant(
  booking: BookingResponse
): "success" | "warning" | "error" | "info" {
  if (booking.status === "PAID") {
    if (booking.isDp && booking.paidAmount < booking.totalPrice) {
      return "info";
    }
    return "success";
  }
  return getStatusVariant(booking.status);
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, initialized, checkAuth } = useAuthStore();

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [verifyModal, setVerifyModal] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [settling, setSettling] = useState(false);

  // Walk-in booking state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [fields, setFields] = useState<FieldResponse[]>([]);
  const [walkInFieldId, setWalkInFieldId] = useState("");
  const [walkInDate, setWalkInDate] = useState("");
  const [walkInStartTime, setWalkInStartTime] = useState("18:00");
  const [walkInEndTime, setWalkInEndTime] = useState("19:00");
  const [walkInCustomerName, setWalkInCustomerName] = useState("");
  const [walkInCustomerEmail, setWalkInCustomerEmail] = useState("");
  const [walkInCustomerPhone, setWalkInCustomerPhone] = useState("");
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState("");
  const [walkInProofUrl, setWalkInProofUrl] = useState("");
  const [walkInUploading, setWalkInUploading] = useState(false);

  const handleWalkInImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWalkInUploading(true);
    setWalkInError("");
    try {
      const url = await fieldService.uploadImage(file);
      setWalkInProofUrl(url);
    } catch (err: any) {
      setWalkInError(err.response?.data?.message || err.message || "Gagal mengunggah bukti pembayaran.");
    } finally {
      setWalkInUploading(false);
    }
  };

  const [existingBookings, setExistingBookings] = useState<BookingResponse[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  const fetchExistingBookings = async (fieldId: string, dateStr: string) => {
    if (!fieldId || !dateStr) return;
    setIsLoadingExisting(true);
    try {
      const startISO = new Date(`${dateStr}T00:00:00`).toISOString();
      const endISO = new Date(`${dateStr}T23:59:59`).toISOString();
      const data = await bookingService.getBookings({
        fieldId,
        startDate: startISO,
        endDate: endISO,
      });
      setExistingBookings(data.filter(b => b.status !== "CANCELLED" && b.status !== "REJECTED"));
    } catch (err) {
      console.warn("Failed to fetch existing bookings:", err);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  useEffect(() => {
    if (showWalkInModal && walkInFieldId && walkInDate) {
      fetchExistingBookings(walkInFieldId, walkInDate);
    }
  }, [showWalkInModal, walkInFieldId, walkInDate]);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const resetWalkInForm = () => {
    setWalkInDate(getTodayDateString());
    setWalkInStartTime("18:00");
    setWalkInEndTime("19:00");
    setWalkInCustomerName("");
    setWalkInCustomerEmail("");
    setWalkInCustomerPhone("");
    setWalkInError("");
    setWalkInProofUrl("");
    setWalkInUploading(false);
    if (fields.length > 0) {
      const active = fields.find(f => f.isActive) || fields[0];
      setWalkInFieldId(active.id);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.push("/login");
    }
  }, [initialized, isAuthenticated, router]);

  useEffect(() => {
    if (initialized && isAuthenticated) {
      loadData();
      loadFields();
    }
  }, [initialized, isAuthenticated, statusFilter]);

  const loadFields = async () => {
    try {
      const data = await fieldService.getFields();
      const activeFields = data.filter(f => f.isActive);
      setFields(activeFields);
      if (activeFields.length > 0) {
        setWalkInFieldId(activeFields[0].id);
      }
    } catch (err) {
      console.warn("Failed to load fields:", err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bookingsData, statsData] = await Promise.all([
        bookingService.getBookings(
          statusFilter !== "ALL" ? { status: statusFilter } : undefined
        ),
        bookingService.getBookingStats(),
      ]);
      setBookings(bookingsData);
      setStats(statsData);
    } catch (err) {
      console.warn("Failed to load bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInFieldId) {
      setWalkInError("Silakan pilih lapangan.");
      return;
    }
    if (!walkInDate) {
      setWalkInError("Silakan pilih tanggal.");
      return;
    }
    if (!walkInStartTime || !walkInEndTime) {
      setWalkInError("Silakan tentukan jam mulai dan jam selesai.");
      return;
    }

    const startParts = walkInStartTime.split(":");
    const endParts = walkInEndTime.split(":");
    
    const startDateTime = new Date(walkInDate);
    startDateTime.setHours(parseInt(startParts[0], 10), parseInt(startParts[1], 10), 0, 0);

    const endDateTime = new Date(walkInDate);
    endDateTime.setHours(parseInt(endParts[0], 10), parseInt(endParts[1], 10), 0, 0);

    if (endDateTime <= startDateTime) {
      setWalkInError("Waktu selesai harus setelah waktu mulai.");
      return;
    }

    setWalkInSubmitting(true);
    setWalkInError("");

    try {
      await bookingService.createOfflineBooking({
        fieldId: walkInFieldId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        customerName: walkInCustomerName || undefined,
        customerEmail: walkInCustomerEmail || undefined,
        customerPhone: walkInCustomerPhone || undefined,
        proofUrl: walkInProofUrl || undefined,
      });

      // Reload bookings & stats
      await loadData();
      
      // Close modal
      setShowWalkInModal(false);
      resetWalkInForm();
      alert("Booking walk-in berhasil dibuat!");
    } catch (err: any) {
      console.warn(err);
      const msg = err.response?.data?.message || err.message || "Gagal membuat booking walk-in.";
      setWalkInError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const filteredBookings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.id?.toLowerCase().includes(q) ||
        b.customer?.name?.toLowerCase().includes(q) ||
        b.customer?.email?.toLowerCase().includes(q) ||
        b.field?.name?.toLowerCase().includes(q) ||
        b.field?.venue?.name?.toLowerCase().includes(q)
    );
  }, [bookings, query]);

  const openVerifyModal = (booking: BookingResponse) => {
    setSelectedBooking(booking);
    setVerifyModal(true);
  };

  const closeVerifyModal = () => {
    setVerifyModal(false);
    setSelectedBooking(null);
  };

  const handleVerify = async (action: "approve" | "reject") => {
    if (!selectedBooking) return;
    
    const { user } = useAuthStore.getState();
    if (!user) {
      alert('User tidak ditemukan');
      return;
    }

    setVerifying(true);
    try {
      await bookingService.verifyBooking(
        selectedBooking.id,
        action === "approve",
        action === "reject"
          ? "Pembayaran ditolak oleh admin"
          : "Pembayaran diverifikasi"
      );
      await loadData();
      closeVerifyModal();
    } catch (err: any) {
      alert(err.message || "Gagal memverifikasi pembayaran");
    } finally {
      setVerifying(false);
    }
  };

  const handleSettle = async () => {
    if (!selectedBooking) return;
    
    const remainingAmount = selectedBooking.totalPrice - selectedBooking.paidAmount;
    if (!confirm(`Apakah Anda yakin ingin mencatat pelunasan tunai sebesar ${formatRupiah(remainingAmount)} untuk booking ini?`)) {
      return;
    }

    setSettling(true);
    try {
      await bookingService.settleBooking(selectedBooking.id);
      await loadData();
      closeVerifyModal();
      alert("Pelunasan berhasil dicatat!");
    } catch (err: any) {
      alert(err.message || "Gagal mencatat pelunasan");
    } finally {
      setSettling(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text("Laporan Pesanan Lapangan Badminton", 14, 20);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 14, 28);
    
    if (statusFilter !== "ALL") {
      doc.text(`Filter Status: ${getStatusLabel(statusFilter)}`, 14, 34);
    }
    
    // Prepare table data
    const tableData = filteredBookings.map((booking) => [
      booking.id.substring(0, 8),
      booking.customer?.name || "-",
      booking.field?.name || "-",
      formatDate(booking.startTime),
      `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`,
      formatRupiah(booking.totalPrice),
      getBookingStatusLabel(booking),
    ]);

    // Add table
    autoTable(doc, {
      head: [["ID", "Pemesan", "Lapangan", "Tanggal", "Jadwal", "Total", "Status"]],
      body: tableData,
      startY: statusFilter !== "ALL" ? 40 : 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Add summary
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(10);
    doc.text(`Total Pesanan: ${filteredBookings.length}`, 14, finalY + 10);
    
    if (stats) {
      doc.text(`Booking Aktif: ${stats.activeBookings || 0}`, 14, finalY + 16);
      doc.text(`Menunggu Verifikasi: ${stats.pendingVerification || 0}`, 14, finalY + 22);
      doc.text(`Pendapatan Bulan Ini: ${formatRupiah(stats.monthlyRevenue || 0)}`, 14, finalY + 28);
    }

    // Save PDF
    const fileName = `Laporan_Pesanan_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <DashboardLayout
      title="Kelola Pesanan"
      breadcrumb={["Admin", "Kelola Pesanan"]}
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="w-full md:max-w-md">
              <Input
                fullWidth
                placeholder="Cari ID pesanan, nama user, atau lapangan..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                "ALL",
                "WAITING_PAYMENT",
                "PENDING",
                "PAID",
                "CANCELLED",
                "COMPLETED",
              ].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? "primary" : "outline"}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "ALL" ? "Semua" : getStatusLabel(status)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Export & Walk-in Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={exportToPDF}
            disabled={isLoading || filteredBookings.length === 0}
          >
            <FileDown size={16} />
            Export ke PDF
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              resetWalkInForm();
              setShowWalkInModal(true);
            }}
          >
            <Plus size={16} />
            Booking Walk-in
          </Button>
        </div>

        {/* Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    ID Pesanan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Lapangan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Tanggal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Jadwal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <Text variant="body" className="text-gray-600">
                        Memuat data...
                      </Text>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <Text variant="body" className="text-gray-600">
                        Tidak ada pesanan
                      </Text>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Text
                          variant="body-sm"
                          className="font-semibold text-primary"
                        >
                          {booking.id.substring(0, 8)}
                        </Text>
                      </td>
                      <td className="px-6 py-4">
                        <Text variant="body-sm" className="font-medium">
                          {booking.customer?.name || "-"}
                        </Text>
                        
                      </td>
                      <td className="px-6 py-4">
                        <Text variant="body-sm">
                          {booking.field?.name || "-"}
                        </Text>
                        {booking.field?.venue?.name && (
                          <Text variant="caption" className="text-gray-500">
                            {booking.field.venue.name}
                          </Text>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Text variant="body-sm">
                          {formatDate(booking.startTime)}
                        </Text>
                      </td>
                      <td className="px-6 py-4">
                        <Text variant="body-sm">
                          {formatTime(booking.startTime)} -{" "}
                          {formatTime(booking.endTime)}
                        </Text>
                      </td>
                      <td className="px-6 py-4">
                        <Text variant="body-sm" className="font-semibold">
                          {formatRupiah(booking.totalPrice)}
                        </Text>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getBookingStatusVariant(booking)}>
                          {getBookingStatusLabel(booking)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {booking.payment?.status === "WAITING_VERIFICATION" &&
                            booking.payment?.proofUrl ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openVerifyModal(booking)}
                              >
                                <Eye size={14} />
                                Verifikasi
                              </Button>
                            ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openVerifyModal(booking)}
                            >
                              <Eye size={14} />
                              Detail
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Verify Modal */}
      {verifyModal && selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeVerifyModal}
          />

          <Card
            className="relative w-full max-w-3xl my-8 rounded-2xl shadow-xl"
            padding="lg"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div>
                <Text variant="h3">Detail Pesanan</Text>
                <Text variant="caption" className="text-gray-500">
                  ID: {selectedBooking.id.substring(0, 13)}...
                </Text>
              </div>
              <Button variant="ghost" size="sm" onClick={closeVerifyModal}>
                <X size={20} />
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Info */}
              <div>
                <Text variant="h4" className="font-bold mb-4">
                  Informasi Pesanan
                </Text>
                <div className="space-y-3">
                  <div>
                    <Text variant="caption" className="text-gray-500">
                      Pemesan
                    </Text>
                    <Text variant="body" className="font-medium">
                      {selectedBooking.customer?.name}
                    </Text>
                    {selectedBooking.customer?.email && (
                      <Text variant="caption" className="text-gray-600 block">
                        {selectedBooking.customer.email}
                      </Text>
                    )}
                    {selectedBooking.customer?.phone && (
                      <Text variant="caption" className="text-gray-600 block">
                        {selectedBooking.customer.phone}
                      </Text>
                    )}
                  </div>

                  <div>
                    <Text variant="caption" className="text-gray-500">
                      Lapangan
                    </Text>
                    <Text variant="body" className="font-medium">
                      {selectedBooking.field?.name || "-"}
                    </Text>
                    {selectedBooking.field?.venue?.name && (
                      <Text variant="caption" className="text-gray-600">
                        {selectedBooking.field.venue.name}
                      </Text>
                    )}
                  </div>

                  <div>
                    <Text variant="caption" className="text-gray-500">
                      Tanggal
                    </Text>
                    <Text variant="body" className="font-medium">
                      {formatDate(selectedBooking.startTime)}
                    </Text>
                  </div>

                  <div>
                    <Text variant="caption" className="text-gray-500">
                      Waktu
                    </Text>
                    <Text variant="body" className="font-medium">
                      {formatTime(selectedBooking.startTime)} -{" "}
                      {formatTime(selectedBooking.endTime)}
                    </Text>
                  </div>

                  <div className="pt-3 border-t space-y-1.5 font-medium">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Harga:</span>
                      <span className="text-gray-900">{formatRupiah(selectedBooking.totalPrice)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tipe Pembayaran:</span>
                      <span className="text-primary font-semibold">
                        {selectedBooking.isDp ? "Down Payment (DP 50%)" : "Pembayaran Penuh (Lunas)"}
                      </span>
                    </div>

                    {selectedBooking.isDp ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Uang Muka (DP):</span>
                          <span className="text-gray-900">{formatRupiah(selectedBooking.dpAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-semibold">Telah Dibayar:</span>
                          <span className="text-green-600 font-semibold">{formatRupiah(selectedBooking.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-1.5">
                          <span className="text-gray-700 font-semibold">Sisa Tagihan:</span>
                          <span className="font-bold text-red-600">
                            {formatRupiah(selectedBooking.totalPrice - selectedBooking.paidAmount)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-semibold">Telah Dibayar:</span>
                        <span className="text-green-600 font-semibold">{formatRupiah(selectedBooking.paidAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Proof */}
              <div>
                <Text variant="h4" className="font-bold mb-4">
                  Bukti Pembayaran
                </Text>

                {selectedBooking.payment?.proofUrl && selectedBooking.payment.proofUrl !== 'OFFLINE_PAYMENT' ? (
                  <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={selectedBooking.payment.proofUrl}
                      alt="Bukti Pembayaran"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : selectedBooking.payment?.proofUrl === 'OFFLINE_PAYMENT' ? (
                  <Card className="bg-green-50 h-96 flex flex-col items-center justify-center border-green-200 p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                      <span className="text-xl font-bold">✓</span>
                    </div>
                    <Text variant="body" className="text-green-800 font-bold mb-1">
                      Pembayaran Offline / Tunai
                    </Text>
                    <Text variant="caption" className="text-green-600">
                      Pembayaran tunai di kasir (Walk-in)
                    </Text>
                  </Card>
                ) : (
                  <Card className="bg-gray-50 h-96 flex items-center justify-center">
                    <Text variant="body" className="text-gray-500">
                      Belum ada bukti pembayaran
                    </Text>
                  </Card>
                )}
              </div>
            </div>

            {/* Actions */}
            {selectedBooking.payment?.status === "WAITING_VERIFICATION" &&
              selectedBooking.payment?.proofUrl && (
                <div className="mt-6 pt-6 border-t flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleVerify("reject")}
                    disabled={verifying}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Tolak
                  </Button>
                  <Button
                    onClick={() => handleVerify("approve")}
                    disabled={verifying}
                  >
                    {verifying ? "Memproses..." : "Terima & Konfirmasi"}
                  </Button>
                </div>
              )}

            {selectedBooking.payment?.status !== "WAITING_VERIFICATION" && (
              <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Badge
                  variant={getBookingStatusVariant(selectedBooking)}
                  className="text-base px-4 py-2"
                >
                  Status: {getBookingStatusLabel(selectedBooking)}
                </Badge>

                {selectedBooking.status === "PAID" &&
                  selectedBooking.isDp &&
                  selectedBooking.paidAmount < selectedBooking.totalPrice && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSettle}
                      disabled={settling}
                    >
                      {settling ? "Memproses..." : "Pelunasan (Bayar Sisa)"}
                    </Button>
                  )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Walk-in Booking Modal */}
      {showWalkInModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowWalkInModal(false)}
          />

          <Card
            className="relative w-full max-w-md my-8 rounded-2xl shadow-xl animate-fade-in"
            padding="lg"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div>
                <Text variant="h3">Tambah Booking Walk-in</Text>
                <Text variant="caption" className="text-gray-500">
                  Input pesanan offline langsung dari kasir
                </Text>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowWalkInModal(false)}>
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="mt-6 space-y-4">
              {walkInError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {walkInError}
                </div>
              )}

              {/* Field Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Pilih Lapangan
                </label>
                <select
                  value={walkInFieldId}
                  onChange={(e) => setWalkInFieldId(e.target.value)}
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="" disabled>-- Pilih Lapangan --</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <Input
                label="Tanggal Main"
                type="date"
                fullWidth
                value={walkInDate}
                onChange={(e) => setWalkInDate(e.target.value)}
                required
              />

              {/* Jadwal Terisi Preview */}
              {walkInFieldId && walkInDate && (
                <div className="bg-gray-50 p-3 rounded-lg border text-sm">
                  <span className="font-semibold text-gray-700 block mb-2 text-xs">Jadwal Terisi Tanggal Ini:</span>
                  {isLoadingExisting ? (
                    <span className="text-gray-500 text-xs">Memuat jadwal terisi...</span>
                  ) : existingBookings.length === 0 ? (
                    <span className="text-green-600 text-xs flex items-center gap-1 font-medium">
                      ✓ Semua slot waktu tersedia
                    </span>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {existingBookings.map((b) => (
                        <div key={b.id} className="flex justify-between items-center text-xs text-gray-600 bg-white px-2.5 py-1.5 rounded border">
                          <span className="font-medium">
                            {formatTime(b.startTime)} - {formatTime(b.endTime)}
                          </span>
                          <span className="text-gray-500 font-semibold truncate max-w-[120px]">
                            {b.customer?.name || "Walk-in"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Start & End Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Jam Mulai"
                  type="time"
                  fullWidth
                  value={walkInStartTime}
                  onChange={(e) => setWalkInStartTime(e.target.value)}
                  required
                />
                <Input
                  label="Jam Selesai"
                  type="time"
                  fullWidth
                  value={walkInEndTime}
                  onChange={(e) => setWalkInEndTime(e.target.value)}
                  required
                />
              </div>

              {/* Bukti Pembayaran (Opsional) */}
              <div className="border-t pt-4 mt-4">
                <Text variant="body-sm" className="font-semibold text-gray-700 mb-3 block">
                  Bukti Pembayaran (Opsional)
                </Text>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleWalkInImageUpload}
                      className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/15 cursor-pointer"
                    />
                    {walkInUploading && (
                      <span className="text-xs text-primary animate-pulse font-medium">Mengunggah...</span>
                    )}
                  </div>
                  
                  {walkInProofUrl && (
                    <div className="relative w-32 h-32 mt-2 rounded-lg overflow-hidden border">
                      <img src={walkInProofUrl} alt="Bukti Pembayaran" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setWalkInProofUrl('')}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <Text variant="body-sm" className="font-semibold text-gray-700 mb-3 block">
                  Informasi Customer (Opsional)
                </Text>
                               <div className="space-y-3">
                  <Input
                    label="Nama Customer"
                    type="text"
                    fullWidth
                    placeholder="Contoh: Walk-in A"
                    autoComplete="new-password"
                    value={walkInCustomerName}
                    onChange={(e) => setWalkInCustomerName(e.target.value)}
                  />
                  <Input
                    label="Email Customer"
                    type="email"
                    fullWidth
                    placeholder="customer@email.com"
                    autoComplete="new-password"
                    value={walkInCustomerEmail}
                    onChange={(e) => setWalkInCustomerEmail(e.target.value)}
                  />
                  <Input
                    label="No. Telepon"
                    type="text"
                    fullWidth
                    placeholder="0812xxxxxx"
                    autoComplete="new-password"
                    value={walkInCustomerPhone}
                    onChange={(e) => setWalkInCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWalkInModal(false)}
                  disabled={walkInSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={walkInSubmitting}
                >
                  {walkInSubmitting ? "Menyimpan..." : "Simpan Booking"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
