import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

class DioUtils {
  static Dio initDio(String baseUrl) {
    const isLogAllowed = !kReleaseMode;
    final dioInstance = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    if (isLogAllowed) {
      dioInstance.interceptors.add(loggerInterceptor());
    }

    return dioInstance;
  }

  static Interceptor loggerInterceptor() {
    const isLogAllowed = !kReleaseMode;
    return PrettyDioLogger(
      request: isLogAllowed,
      // requestHeader: isLogAllowed,
      responseBody: isLogAllowed,
      requestBody: isLogAllowed,
      // responseHeader: isLogAllowed,
      logPrint: (log) {
        developer.log('$log');
      },
    );
  }
}
