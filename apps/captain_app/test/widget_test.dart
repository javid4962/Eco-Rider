import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:captain_app/core/localization/locale_controller.dart';
import 'package:captain_app/main.dart';

void main() {
  testWidgets('EcoRide Captain App Shell Smoke Test (English & Telugu)', (WidgetTester tester) async {
    final controller = LocaleController(
      storageKey: 'test_widget_smoke_captain',
      initialLocale: const Locale('en'),
    );

    await tester.pumpWidget(EcoRideCaptainApp(controller: controller));
    await tester.pumpAndSettle();

    // Verify Title and Duty status in English
    expect(find.text('EcoRide Captain'), findsOneWidget);
    expect(find.text('DUTY OFFLINE'), findsOneWidget);
    expect(find.text('EV Battery Feasibility'), findsOneWidget);

    // Switch to Telugu and verify
    controller.setLocale(const Locale('te'));
    await tester.pumpAndSettle();

    expect(find.text('ఈకోరైడ్ కెప్టెన్'), findsOneWidget);
    expect(find.text('డ్యూటీ ఆఫ్ లో ఉంది'), findsOneWidget);
    expect(find.text('ఈవీ బ్యాటరీ లభ్యత'), findsOneWidget);
  });
}
