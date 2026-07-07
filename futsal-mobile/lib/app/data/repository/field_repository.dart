import 'package:reservasi_futsal/app/data/model/field_model.dart';

abstract class FieldRepository {
  Future<List<Field>> getFields();
  Future<Field> getFieldById(String id, {String? date});
}
