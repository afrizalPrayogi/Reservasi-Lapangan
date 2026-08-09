import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/booking_history_controller.dart';

class BookingHistoryView extends GetView<BookingHistoryController> {
  const BookingHistoryView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        if (controller.bookingHistory.isEmpty) {
          return SafeArea(
            child: RefreshIndicator(
              onRefresh: controller.loadBookingHistory,
              color: const Color(0xFF0D1B3E),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: SizedBox(
                  height: MediaQuery.of(context).size.height - 100,
                  child: const Center(
                    child: Text(
                      'Belum ada riwayat booking',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  ),
                ),
              ),
            ),
          );
        }

        return SafeArea(
          child: RefreshIndicator(
            onRefresh: controller.loadBookingHistory,
            color: const Color(0xFF0D1B3E),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              itemCount: controller.bookingHistory.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return const Padding(
                    padding: EdgeInsets.only(bottom: 16),
                    child: Text(
                      'Aktivitas',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0D1B3E),
                      ),
                    ),
                  );
                }

                final booking = controller.bookingHistory[index - 1];
                return _buildBookingCard(booking);
              },
            ),
          ),
        );
      }),
    );
  }

  Widget _buildBookingCard(booking) {
    final statusLabel = booking.status.label;
    final statusColorString = booking.status.color;

    final statusColor = statusColorString.toLowerCase() == 'success'
        ? const Color(0xFF2ECC71)
        : statusColorString.toLowerCase() == 'warning'
        ? const Color(0xFFF39C12)
        : statusColorString.toLowerCase() == 'danger'
        ? Colors.red
        : Colors.grey;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ID Pesanan ${booking.bookingNumber}',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking.fieldName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0D1B3E),
                      ),
                    ),
                    if (booking.venueName.isNotEmpty)
                      Text(
                        booking.venueName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Text(
                statusLabel,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  fontStyle: FontStyle.italic,
                  color: statusColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (booking.payment?.proofUrl != null &&
              booking.payment!.proofUrl!.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: double.infinity,
                height: 180,
                color: Colors.grey[100],
                child: Image.network(
                  booking.payment!.proofUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.grey[200],
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.image_not_supported_outlined,
                        color: Colors.grey,
                        size: 32,
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Bukti pembayaran tersedia',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
            const SizedBox(height: 12),
          ],
          Row(
            children: [
              const Icon(
                Icons.calendar_month_outlined,
                size: 16,
                color: Color(0xFF0D1B3E),
              ),
              const SizedBox(width: 8),
              Text(
                controller.formatDate(booking.date),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0D1B3E),
                ),
              ),
              const Spacer(),
              const Icon(Icons.access_time, size: 16, color: Color(0xFF0D1B3E)),
              const SizedBox(width: 8),
              Text(
                controller.formatTime(booking.startTime),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0D1B3E),
                ),
              ),
              const Spacer(),
              Text(
                '${booking.durationHours} Jam',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0D1B3E),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
