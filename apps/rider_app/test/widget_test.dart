import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rider_app/core/localization/locale_controller.dart';
import 'package:rider_app/main.dart';

void main() {
  testWidgets('EcoRide Rider App Shell Smoke Test (English & Telugu)', (WidgetTester tester) async {
    final controller = LocaleController(
      storageKey: 'test_widget_smoke_rider',
      initialLocale: const Locale('en'),
    );

    await tester.pumpWidget(EcoRideRiderApp(controller: controller));
    await tester.pumpAndSettle();

    // Verify Title and 100% Electric branding in English
    expect(find.text('EcoRide Rider'), findsOneWidget);
    expect(find.text('100% ELECTRIC'), findsOneWidget);
    expect(find.text('Visakhapatnam Pilot'), findsOneWidget);
    expect(find.text('Where to in AP?'), findsOneWidget);

    // Switch to Telugu and verify
    controller.setLocale(const Locale('te'));
    await tester.pumpAndSettle();

    expect(find.text('ఈకోరైడ్ రైడర్'), findsOneWidget);
    expect(find.text('100% ఎలక్ట్రిక్'), findsOneWidget);
    expect(find.text('ఎక్కడికి వెళ్ళాలి?'), findsOneWidget);
  });
}
