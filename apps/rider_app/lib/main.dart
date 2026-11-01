import 'package:flutter/material.dart';

void main() {
  runApp(const EcoRideRiderApp());
}

class EcoRideRiderApp extends StatelessWidget {
  const EcoRideRiderApp({super.key});

  static const Color primaryElectric = Color(0xFF059669);
  static const Color voltageNavy = Color(0xFF0B132B);
  static const Color surfaceNavy = Color(0xFF1C2541);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EcoRide Rider',
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
      home: const RiderHomeScreen(),
    );
  }
}

class RiderHomeScreen extends StatelessWidget {
  const RiderHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('EcoRide Rider'),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF059669),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              '100% ELECTRIC',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const Spacer(),
                          const Text(
                            'Visakhapatnam Pilot',
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Where to in AP?',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'ఎక్కడికి వెళ్ళాలి?',
                        style: TextStyle(
                          color: Color(0xFF6FFFE9),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Available Categories (Release A)',
                style: TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 8),
              ListTile(
                tileColor: const Color(0xFF1C2541),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                leading: const Icon(Icons.electric_scooter, color: Color(0xFF059669)),
                title: const Text('City Commute (EV Bike Taxi)', style: TextStyle(color: Colors.white)),
                subtitle: const Text('నగర ప్రయాణం • Active in Pilot Zone', style: TextStyle(color: Colors.white60)),
                trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
