import { AuthOtpPurpose, OtpLocale, OtpTemplateDefinition } from '@ecoride/contracts';

/**
 * Telecom Regulatory Authority of India (TRAI) DLT-Registered Content Templates
 * Entity: EcoRide Mobility (AP) Private Limited
 * Header: ECORID (Transactional / Service Implicit)
 */
export const DLT_TEMPLATES: Record<AuthOtpPurpose, Record<OtpLocale, OtpTemplateDefinition>> = {
  LOGIN: {
    te: {
      dltTemplateId: '1107160000000010001',
      templateText:
        'మీ EcoRide లాగిన్ OTP: {#var#}. ఇది 5 నిమిషాల పాటు మాత్రమే చెల్లుతుంది. ఎవరితోనూ పంచుకోవద్దు. - EcoRide (AP)',
      otpLength: 6,
      expiryMinutes: 5,
    },
    en: {
      dltTemplateId: '1107160000000010002',
      templateText:
        'Your EcoRide login OTP is {#var#}. Valid for 5 minutes. Do not share this code with anyone. - EcoRide (AP)',
      otpLength: 6,
      expiryMinutes: 5,
    },
    hi: {
      dltTemplateId: '1107160000000010003',
      templateText:
        'आपका EcoRide लॉगिन OTP {#var#} है। 5 मिनट के लिए वैध। इसे किसी के साथ साझा न करें। - EcoRide (AP)',
      otpLength: 6,
      expiryMinutes: 5,
    },
  },
  RIDE_START: {
    te: {
      dltTemplateId: '1107160000000010004',
      templateText:
        'మీ EcoRide రైడ్ ప్రారంభ OTP: {#var#}. క్యాప్టెన్ వాహనం వద్దకు వచ్చాక మాత్రమే చెప్పండి. - EcoRide',
      otpLength: 4,
      expiryMinutes: 5,
    },
    en: {
      dltTemplateId: '1107160000000010005',
      templateText:
        'Your EcoRide ride start OTP is {#var#}. Share only with your EV Captain upon boarding. - EcoRide',
      otpLength: 4,
      expiryMinutes: 5,
    },
    hi: {
      dltTemplateId: '1107160000000010006',
      templateText:
        'आपका EcoRide राइड स्टार्ट OTP {#var#} है। बोर्डिंग के समय केवल अपने EV कैप्टन को बताएं। - EcoRide',
      otpLength: 4,
      expiryMinutes: 5,
    },
  },
  EMERGENCY: {
    te: {
      dltTemplateId: '1107160000000010007',
      templateText: 'EcoRide ఎమర్జెన్సీ ధృవీకరణ కోడ్: {#var#}. భద్రతా పర్యవేక్షణ కోసం. - EcoRide',
      otpLength: 6,
      expiryMinutes: 5,
    },
    en: {
      dltTemplateId: '1107160000000010008',
      templateText:
        'EcoRide emergency alert verification OTP: {#var#}. Active security check. - EcoRide',
      otpLength: 6,
      expiryMinutes: 5,
    },
    hi: {
      dltTemplateId: '1107160000000010009',
      templateText: 'EcoRide आपातकालीन सत्यापन OTP: {#var#}। सक्रिय सुरक्षा जांच। - EcoRide',
      otpLength: 6,
      expiryMinutes: 5,
    },
  },
};

/**
 * Returns the localized DLT template for the specified purpose and language.
 * Falls back to English ('en') if requested locale is missing.
 */
export function getDltTemplate(
  purpose: AuthOtpPurpose,
  locale: OtpLocale = 'en',
): OtpTemplateDefinition {
  const purposeTemplates = DLT_TEMPLATES[purpose] || DLT_TEMPLATES.LOGIN;
  return purposeTemplates[locale] || purposeTemplates.en;
}
