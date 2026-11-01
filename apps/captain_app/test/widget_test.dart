import 'package:flutter_test/flutter_test.dart';
import 'package:captain_app/main.dart';

void main() {
  testWidgets('EcoRide Captain App Shell Smoke Test', (WidgetTester tester) async {
    await tester.pumpWidget(const EcoRideCaptainApp());

    // Verify Title and Duty status
    expect(find.text('EcoRide Captain'), findsOneWidget);
    expect(find.text('DUTY OFFLINE'), findsOneWidget);
    expect(find.text('డ్యూటీ ఆఫ్ లో ఉంది'), findsOneWidget);
    expect(find.text('EV Battery Feasibility'), findsOneWidget);
  });
}
