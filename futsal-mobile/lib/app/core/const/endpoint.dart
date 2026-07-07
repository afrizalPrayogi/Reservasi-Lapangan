abstract class Endpoints {
  // Authentication
  static const String login = '/api/v1/auth/login';
  static const String register = '/api/v1/auth/register';
  static const String getAllUsers =
      '/api/v1/users'; // Endpoint to get all users
  static const String roles = '/api/v1/role';
  static const String profile = '/api/v1/profile';
  static const String presensi = '/api/v1/presensi';
  static const String presensiStaff = '/api/v1/presensi/staff';
  static const String getPresensiByUser = '/api/v1/presensi/user';
  static const String changeProfilePicture = '/api/v1/profile/change-picture';
  static const String school = '/api/v1/sekolah';
  static const String exportRekapPresensi = '/api/v1/export-rekap';

  // Mobile
  static const String mobileFields = '/api/v1/mobile/fields';

  // Bookings
  static const String bookings = '/api/v1/bookings';
  static const String myBookings = '/api/v1/bookings/my-bookings';
}
