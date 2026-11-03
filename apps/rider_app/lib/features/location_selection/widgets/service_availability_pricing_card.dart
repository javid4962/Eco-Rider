// EcoRide Service Availability & Pricing Card (EV-037)
// Dynamic category display driven exclusively by authoritative API availability.
// Enforces 100% BEV propulsion, seat capacity controls, clear unbookable/zero-driver states,
// statutory operator notices, and regulatory cancellation terms.

import 'package:flutter/material.dart';
import '../../../core/api/api_contracts.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/location_selection_controller.dart';

class ServiceAvailabilityPricingCard extends StatelessWidget {
  final LocationSelectionController controller;
  final VoidCallback? onSearchDestination;

  const ServiceAvailabilityPricingCard({
    super.key,
    required this.controller,
    this.onSearchDestination,
  });

  IconData _getCategoryIcon(String vehicleClass) {
    switch (vehicleClass.toUpperCase()) {
      case 'TWO_WHEELER':
        return Icons.electric_scooter;
      case 'THREE_WHEELER':
        return Icons.electric_moped;
      case 'FOUR_WHEELER':
      default:
        return Icons.electric_car;
    }
  }

  void _showCancellationPolicyModal(BuildContext context, CancellationTermsDto terms, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1C2541),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.policy_outlined, color: Color(0xFF10B981), size: 24),
            const SizedBox(width: 8),
            Text(
              l10n.cancellationTermsTitle,
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0B132B),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.timer_outlined, color: Color(0xFF10B981), size: 16),
                      const SizedBox(width: 6),
                      Text(
                        l10n.freeCancellationWindow(terms.freeCancellationMinutes),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.currency_rupee, color: Color(0xFFF59E0B), size: 16),
                      const SizedBox(width: 6),
                      Text(
                        l10n.driverCompensationFee(terms.formattedCancellationFee),
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              terms.policySummary,
              style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
            ),
            const SizedBox(height: 12),
            const Text(
              'Driver compensation fee directly protects EV captains for dispatched battery kilometers.',
              style: TextStyle(color: Colors.white54, fontSize: 11, fontStyle: FontStyle.italic),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('OK', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final categories = controller.availableCategories;
    final selected = controller.selectedCategory;
    final operatorNotice = controller.operatorNotice;
    final cancellationTerms = controller.cancellationTerms;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1C2541),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Colors.black38,
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header: Section title + 100% Electric badge
          Row(
            children: [
              Text(
                l10n.serviceAvailabilityTitle,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF059669),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'EV PILOT',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Loading state
          if (controller.isLoadingAvailability && categories.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 24.0),
                child: CircularProgressIndicator(color: Color(0xFF059669)),
              ),
            )
          else ...[
            // Dynamic category cards list
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: categories.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final cat = categories[index];
                final isSelected = selected?.serviceCategory == cat.serviceCategory;
                final isZeroDrivers = cat.isEnabled && cat.availableCaptainsCount == 0;
                final isAuthorized = cat.isEnabled;
                final isBookable = cat.isBookable;

                Color borderColor = const Color(0xFF334155);
                if (isSelected && isBookable) {
                  borderColor = const Color(0xFF059669);
                } else if (isSelected && !isBookable) {
                  borderColor = const Color(0xFFDC2626);
                }

                return InkWell(
                  onTap: () {
                    controller.selectCategory(cat);
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF0D1B2A)
                          : const Color(0xFF222F4C).withOpacity(isAuthorized ? 0.9 : 0.45),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: borderColor,
                        width: isSelected ? 2.0 : 1.0,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Category Icon
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isBookable
                                    ? const Color(0xFF059669).withOpacity(0.2)
                                    : const Color(0xFF64748B).withOpacity(0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                _getCategoryIcon(cat.vehicleClass),
                                color: isBookable
                                    ? const Color(0xFF10B981)
                                    : (isAuthorized ? const Color(0xFFF59E0B) : const Color(0xFF94A3B8)),
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),

                            // Name, seating configuration, and description
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          cat.displayName,
                                          style: TextStyle(
                                            color: isAuthorized ? Colors.white : Colors.white60,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      // Seating badge (D+1, D+3, D+10)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF334155),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          cat.seatingConfiguration,
                                          style: const TextStyle(
                                            color: Color(0xFF93C5FD),
                                            fontSize: 10,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    cat.serviceCategory == 'CITY_COMMUTE_2W'
                                        ? l10n.cityCommuteTitle
                                        : cat.description,
                                    style: const TextStyle(color: Colors.white60, fontSize: 11),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),

                            // Fare & ETA / Unavailable chip
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                if (isBookable && cat.formattedFare != null) ...[
                                  Text(
                                    cat.formattedFare!,
                                    style: const TextStyle(
                                      color: Color(0xFF10B981),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                  if (cat.estimatedEtaMinutes != null)
                                    Text(
                                      '~${cat.estimatedEtaMinutes} min ETA',
                                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                                    ),
                                ] else if (isZeroDrivers) ...[
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF59E0B).withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: const Color(0xFFF59E0B), width: 0.8),
                                    ),
                                    child: Text(
                                      l10n.zeroDriversNearby,
                                      style: const TextStyle(
                                        color: Color(0xFFF59E0B),
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ] else ...[
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEF4444).withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: const Color(0xFFEF4444), width: 0.8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.lock_outline, size: 10, color: Color(0xFFEF4444)),
                                        const SizedBox(width: 3),
                                        Text(
                                          l10n.notAuthorizedInZone,
                                          style: const TextStyle(
                                            color: Color(0xFFEF4444),
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),

                        // Captains count or Rejection Reason row
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            if (isBookable) ...[
                              const Icon(Icons.fiber_manual_record, color: Color(0xFF10B981), size: 8),
                              const SizedBox(width: 4),
                              Text(
                                l10n.captainsNearby(cat.availableCaptainsCount),
                                style: const TextStyle(color: Color(0xFF10B981), fontSize: 11),
                              ),
                            ] else if (cat.rejectionOrUnavailableReason != null) ...[
                              Expanded(
                                child: Text(
                                  cat.rejectionOrUnavailableReason!,
                                  style: TextStyle(
                                    color: isZeroDrivers ? const Color(0xFFFBBF24) : const Color(0xFFF87171),
                                    fontSize: 10,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                            const Spacer(),
                            if (isSelected)
                              const Icon(
                                Icons.check_circle,
                                color: Color(0xFF10B981),
                                size: 16,
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            const SizedBox(height: 12),

            // Operator Notice Banner
            if (operatorNotice != null && operatorNotice.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F2338),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF1E3A8A)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.verified, color: Color(0xFF60A5FA), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.operatorNoticeTitle,
                            style: const TextStyle(
                              color: Color(0xFF93C5FD),
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            operatorNotice,
                            style: const TextStyle(color: Colors.white70, fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
            ],

            // Cancellation Terms Row
            if (cancellationTerms != null)
              InkWell(
                onTap: () => _showCancellationPolicyModal(context, cancellationTerms, l10n),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF131D33),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Color(0xFF10B981), size: 16),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '${l10n.cancellationTermsTitle}: ${l10n.freeCancellationWindow(cancellationTerms.freeCancellationMinutes)}',
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 12),
                    ],
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }
}
