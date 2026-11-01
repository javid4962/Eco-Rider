import 'package:flutter_test/flutter_test.dart';
import 'package:rider_app/main.dart';

void main() {
  testWidgets('EcoRide Rider App Shell Smoke Test', (WidgetTester tester) async {
    await tester.pumpWidget(const EcoRideRiderApp());

    // Verify Title and 100% Electric branding
    expect(find.text('EcoRide Rider'), findsOneWidget);
    expect(find.text('100% ELECTRIC'), findsOneWidget);
    expect(find.text('Visakhapatnam Pilot'), findsOneWidget);
    expect(find.text('Where to in AP?'), findsOneWidget);
    expect(find.text('ఎక్కడికి వెళ్ళాలి?'), findsOneWidget);
  });
}
