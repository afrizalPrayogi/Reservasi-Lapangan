abstract class RegistrasiRepository {
  /// Register a new user.
  /// Returns a Map with 'success' (bool) and 'message' (String or dynamic data).
  Future<Map<String, dynamic>> register({
    required String email,
    required String name,
    required String password,
    required String phone,
  });
}
