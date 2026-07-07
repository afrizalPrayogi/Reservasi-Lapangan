import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:reservasi_futsal/app/data/model/field_model.dart';
import '../controllers/field_detail_controller.dart';
import 'payment_summary_view.dart';

class FieldDetailView extends GetView<FieldDetailController> {
  final Field field;

  const FieldDetailView({super.key, required this.field});

  @override
  Widget build(BuildContext context) {
    // Reuse controller if already registered (prevents re-put on rebuild)
    final ctrl = Get.isRegistered<FieldDetailController>()
        ? Get.find<FieldDetailController>()
        : Get.put(FieldDetailController());
    ctrl.setField(field);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildTopBar(),
              const SizedBox(height: 12),
              _buildHeaderCard(),
              const SizedBox(height: 20),
              _buildDateSection(),
              const SizedBox(height: 18),
              _buildDurationSection(),
              const SizedBox(height: 18),
              _buildStartTimeSection(),
              const SizedBox(height: 20),
              _buildGallerySection(),
              const SizedBox(height: 90),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 14),
          child: SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: () {
                if (controller.selectedDate.value == null) {
                  Get.snackbar(
                    'Perhatian',
                    'Silakan pilih tanggal booking terlebih dahulu',
                    snackPosition: SnackPosition.BOTTOM,
                    backgroundColor: Colors.orange,
                    colorText: Colors.white,
                    margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  );
                  return;
                }
                Get.to(
                  () => PaymentSummaryView(
                    field: field,
                    durationHours: controller.durationHours.value,
                    startTime: controller.selectedStartTime.value,
                    orderDate: controller.getIsoDate(),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0D1B3E),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                ),
              ),
              child: const Text(
                'Pesan',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        _circleIconButton(
          icon: Icons.arrow_back_ios_new,
          onTap: () => Get.back(),
        ),
      ],
    );
  }

  Widget _circleIconButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 44,
          height: 44,
          child: Icon(icon, size: 20, color: const Color(0xFF0D1B3E)),
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    final statusText = field.isAvailable ? 'Available' : 'Booked';
    final statusColor = field.isAvailable ? Colors.green : Colors.grey;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Image.network(
              field.imageUrl,
              width: 92,
              height: 92,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: 92,
                  height: 92,
                  color: Colors.grey[200],
                  child: const Icon(Icons.image, color: Colors.grey),
                );
              },
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  field.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0D1B3E),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Luas ${field.size}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                const SizedBox(height: 10),
                Text(
                  statusText,
                  style: TextStyle(
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                    fontWeight: FontWeight.w700,
                    color: statusColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tanggal Booking',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFF0D1B3E),
          ),
        ),
        const SizedBox(height: 10),
        InkWell(
          onTap: () => controller.pickDate(Get.context!),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.calendar_today,
                  size: 20,
                  color: Color(0xFF0D1B3E),
                ),
                const SizedBox(width: 12),
                Obx(
                  () => Text(
                    controller.formatDate(controller.selectedDate.value),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: controller.selectedDate.value != null
                          ? const Color(0xFF0D1B3E)
                          : Colors.grey[600],
                    ),
                  ),
                ),
                const Spacer(),
                Icon(Icons.arrow_drop_down, color: Colors.grey[600]),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDurationSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Waktu Sewa',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFF0D1B3E),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            const Icon(Icons.access_time, size: 18, color: Color(0xFF0D1B3E)),
            const SizedBox(width: 10),
            Obx(
              () => Text(
                '${controller.durationHours.value} Jam',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0D1B3E),
                ),
              ),
            ),
            const Spacer(),
            _smallRoundButton(
              icon: Icons.add,
              onTap: controller.incrementDuration,
            ),
            const SizedBox(width: 10),
            _smallRoundButton(
              icon: Icons.remove,
              onTap: controller.decrementDuration,
            ),
          ],
        ),
      ],
    );
  }

  Widget _smallRoundButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: SizedBox(
          width: 30,
          height: 30,
          child: Icon(icon, size: 18, color: const Color(0xFF0D1B3E)),
        ),
      ),
    );
  }

  Widget _buildStartTimeSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Mulai Jam',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFF0D1B3E),
          ),
        ),
        const SizedBox(height: 10),
        Obx(
          () => Wrap(
            spacing: 10,
            runSpacing: 10,
            children: controller.times.map((time) {
              final selected = time == controller.selectedStartTime.value;
              final hour = int.tryParse(time.split(':')[0]) ?? -1;
              final isBooked = controller.bookedHours.contains(hour);

              Color backgroundColor = Colors.white;
              Color borderColor = Colors.grey[300]!;
              Color textColor = Colors.grey[700]!;

              if (selected) {
                backgroundColor = const Color(0xFFE9F7EF);
                borderColor = const Color(0xFF2ECC71);
                textColor = const Color(0xFF2ECC71);
              } else if (isBooked) {
                backgroundColor = const Color(0xFFFDE8E8); // Light red
                borderColor = const Color(0xFFF8B4B4); // Red border
                textColor = const Color(0xFFC81E1E); // Dark red text
              }

              return InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: isBooked ? null : () => controller.selectTime(time),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: backgroundColor,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: borderColor,
                      width: 1,
                    ),
                  ),
                  child: Text(
                    time,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: textColor,
                      decoration: isBooked ? TextDecoration.lineThrough : null,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildGallerySection() {
    if (controller.galleryUrls.isEmpty) {
      return const SizedBox.shrink();
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Gallery',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFF0D1B3E),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            for (int i = 0; i < controller.galleryUrls.length; i++) ...[
              GestureDetector(
                onTap: () => _showGalleryViewer(i),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    controller.galleryUrls[i],
                    width: 74,
                    height: 74,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        width: 74,
                        height: 74,
                        color: Colors.grey[200],
                        child: const Icon(Icons.image, color: Colors.grey),
                      );
                    },
                  ),
                ),
              ),
              if (i < controller.galleryUrls.length - 1)
                const SizedBox(width: 10),
            ],
          ],
        ),
      ],
    );
  }

  void _showGalleryViewer(int initialIndex) {
    Get.dialog(
      GalleryViewerDialog(
        imageUrls: controller.galleryUrls,
        initialIndex: initialIndex,
      ),
    );
  }
}

class GalleryViewerDialog extends StatefulWidget {
  final List<String> imageUrls;
  final int initialIndex;

  const GalleryViewerDialog({
    super.key,
    required this.imageUrls,
    required this.initialIndex,
  });

  @override
  State<GalleryViewerDialog> createState() => _GalleryViewerDialogState();
}

class _GalleryViewerDialogState extends State<GalleryViewerDialog> {
  late PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(0),
      child: Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.black.withOpacity(0.9),
        child: Stack(
          children: [
            // PageView for swiping images
            PageView.builder(
              controller: _pageController,
              itemCount: widget.imageUrls.length,
              onPageChanged: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              itemBuilder: (context, index) {
                return Center(
                  child: InteractiveViewer(
                    minScale: 0.5,
                    maxScale: 4.0,
                    child: Image.network(
                      widget.imageUrls[index],
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          width: 200,
                          height: 200,
                          color: Colors.grey[800],
                          child: const Icon(
                            Icons.broken_image,
                            color: Colors.white,
                            size: 50,
                          ),
                        );
                      },
                    ),
                  ),
                );
              },
            ),

            // Close button
            Positioned(
              top: 40,
              right: 20,
              child: Material(
                color: Colors.white.withOpacity(0.2),
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: () => Get.back(),
                  child: const SizedBox(
                    width: 44,
                    height: 44,
                    child: Icon(Icons.close, color: Colors.white, size: 24),
                  ),
                ),
              ),
            ),

            // Image counter
            Positioned(
              bottom: 30,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${_currentIndex + 1} / ${widget.imageUrls.length}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),

            // Navigation arrows (optional)
            if (widget.imageUrls.length > 1) ...[
              // Previous button
              if (_currentIndex > 0)
                Positioned(
                  left: 20,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: Material(
                      color: Colors.white.withOpacity(0.2),
                      shape: const CircleBorder(),
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () {
                          _pageController.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        child: const SizedBox(
                          width: 44,
                          height: 44,
                          child: Icon(
                            Icons.arrow_back_ios_new,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

              // Next button
              if (_currentIndex < widget.imageUrls.length - 1)
                Positioned(
                  right: 20,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: Material(
                      color: Colors.white.withOpacity(0.2),
                      shape: const CircleBorder(),
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () {
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        child: const SizedBox(
                          width: 44,
                          height: 44,
                          child: Icon(
                            Icons.arrow_forward_ios,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
