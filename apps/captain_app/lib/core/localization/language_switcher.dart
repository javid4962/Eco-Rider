import 'package:flutter/material.dart';
import 'locale_controller.dart';

/// One-tap language switcher widget for AppBar or headers in Captain App.
class LanguageSwitcherButton extends StatelessWidget {
  final LocaleController controller;

  const LanguageSwitcherButton({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final isTe = controller.isTelugu;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8.0),
          child: ActionChip(
            avatar: const Icon(Icons.language, size: 16, color: Color(0xFF6FFFE9)),
            backgroundColor: const Color(0xFF1C2541),
            side: const BorderSide(color: Color(0xFF059669), width: 1.2),
            label: Text(
              isTe ? 'తెలుగు (TE)' : 'English (EN)',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            onPressed: () {
              controller.toggleLocale();
            },
          ),
        );
      },
    );
  }
}

