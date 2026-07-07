class Field {
  final String id;
  final String name;
  final String imageUrl;
  final String size;
  final double pricePerHour;
  final bool isAvailable;
  final List<String> imageUrls;
  final List<int> bookedHours;

  Field({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.size,
    required this.pricePerHour,
    required this.isAvailable,
    this.imageUrls = const [],
    this.bookedHours = const [],
  });

  factory Field.fromJson(Map<String, dynamic> json) {
    final String id = (json['id'] ?? '').toString();
    final String name = (json['name'] ?? '').toString();

    final dynamic rawImageUrl = json['image_url'] ?? json['imageUrl'];
    final String imageUrl = (rawImageUrl is String && rawImageUrl.isNotEmpty)
        ? rawImageUrl
        : 'https://picsum.photos/seed/${id.isNotEmpty ? id : name}/400/300';

    final dynamic rawSize = json['size'];
    String size = '';
    if (rawSize is String) {
      size = rawSize;
    } else if (rawSize is Map) {
      final dynamic length = rawSize['lengthMeter'] ?? rawSize['length_meter'];
      final dynamic width = rawSize['widthMeter'] ?? rawSize['width_meter'];
      final lengthStr = (length ?? '').toString();
      final widthStr = (width ?? '').toString();
      if (lengthStr.isNotEmpty && widthStr.isNotEmpty) {
        size = '$lengthStr x $widthStr';
      }
    }

    final dynamic rawPrice =
        json['price_per_hour'] ?? json['pricePerHour'] ?? 0;
    final double pricePerHour = rawPrice is num
        ? rawPrice.toDouble()
        : (double.tryParse(rawPrice.toString()) ?? 0);

    final dynamic rawIsAvailable =
        json['is_available'] ?? json['isAvailable'] ?? false;
    final bool isAvailable = rawIsAvailable == true;

    final dynamic rawImages = json['images'];
    final List<String> imageUrls = [];
    if (rawImages is List) {
      for (final img in rawImages) {
        if (img is Map) {
          final url = img['imageUrl'] ?? img['image_url'];
          if (url is String && url.isNotEmpty) {
            imageUrls.add(url);
          }
        }
      }
    }
    if (imageUrls.isEmpty && imageUrl.isNotEmpty) {
      imageUrls.add(imageUrl);
    }

    final dynamic rawBooked = json['bookedHours'] ?? json['booked_hours'];
    final List<int> bookedHours = [];
    if (rawBooked is List) {
      for (final hour in rawBooked) {
        if (hour is num) {
          bookedHours.add(hour.toInt());
        }
      }
    }

    return Field(
      id: id,
      name: name,
      imageUrl: imageUrl,
      size: size,
      pricePerHour: pricePerHour,
      isAvailable: isAvailable,
      imageUrls: imageUrls,
      bookedHours: bookedHours,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'image_url': imageUrl,
    'size': size,
    'price_per_hour': pricePerHour,
    'is_available': isAvailable,
    'images': imageUrls.map((url) => {'imageUrl': url}).toList(),
    'booked_hours': bookedHours,
  };
}
