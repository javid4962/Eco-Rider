import 'package:flutter/material.dart';

void main() {
  runApp(const EcoRideCaptainApp());
}

class EcoRideCaptainApp extends StatelessWidget {
  const EcoRideCaptainApp({super.key});

  static const Color primaryElectric = Color(0xFF059669);
  static const Color voltageNavy = Color(0xFF0B132B);
  static const Color surfaceNavy = Color(0xFF1C2541);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EcoRide Captain',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: voltageNavy,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primaryElectric,
          brightness: Brightness.dark,
          surface: surfaceNavy,
        ),
      ),
      home: const CaptainHomeScreen(),
    );
  }
}

class CaptainHomeScreen extends StatefulWidget {
  const CaptainHomeScreen({super.key});

  @override
  State<CaptainHomeScreen> createState() => _CaptainHomeScreenState();
}

class _CaptainHomeScreenState extends State<CaptainHomeScreen> {
  bool isOnline = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('EcoRide Captain'),
        backgroundColor: const Color(0xFF0B132B),
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                color: const Color(0xFF1C2541),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isOnline ? 'DUTY ACTIVE' : 'DUTY OFFLINE',
                            style: TextStyle(
                              color: isOnline ? const Color(0xFF10B981) : Colors.orangeAccent,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isOnline ? 'డ్యూటీలో ఉన్నారు' : 'డ్యూటీ ఆఫ్ లో ఉంది',
                            style: const TextStyle(color: Colors.white70, fontSize: 13),
                          ),
                        ],
                      ),
                      Switch(
                        value: isOnline,
                        activeThumbColor: const Color(0xFF059669),
                        onChanged: (val) {
                          setState(() {
                            isOnline = val;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                color: const Color(0xFF1C2541),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.battery_charging_full, color: Color(0xFF10B981)),
                          SizedBox(width: 8),
                          Text(
                            'EV Battery Feasibility',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Battery SoC: 85% • Optimal Range (~68 km)',
                        style: TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Minimum 20% required for dispatch matching.',
                        style: TextStyle(color: Colors.white38, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Assigned Pilot Zone: Visakhapatnam Corridor',
                style: TextStyle(color: Colors.white54, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
