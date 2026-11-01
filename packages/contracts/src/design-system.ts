export enum LanguageCode {
  EN = 'en',
  TE = 'te',
}

export interface BilingualText {
  en: string;
  te: string;
}

export interface ColorTokens {
  primaryElectric: string;
  primaryElectricDark: string;
  voltageNavy: string;
  voltageNavySurface: string;
  surfaceLight: string;
  surfaceDark: string;
  backgroundLight: string;
  backgroundDark: string;
  textPrimaryLight: string;
  textPrimaryDark: string;
  textSecondaryLight: string;
  textSecondaryDark: string;
  batteryOptimal: string;
  batteryGood: string;
  batteryLow: string;
  batteryCritical: string;
  safetyAlert: string;
  borderLight: string;
  borderDark: string;
}

export interface TypographyScale {
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  letterSpacing?: number;
}

export interface TypographyTokens {
  fontFamilyEnglish: string;
  fontFamilyTelugu: string;
  displayLarge: TypographyScale;
  headlineMedium: TypographyScale;
  titleMedium: TypographyScale;
  bodyLarge: TypographyScale;
  bodyMedium: TypographyScale;
  bodySmall: TypographyScale;
  labelLarge: TypographyScale;
  labelSmall: TypographyScale;
}

export interface SpacingTokens {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  huge: number;
}

export interface RadiusTokens {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  pill: number;
}

export interface ElevationTokens {
  none: string;
  low: string;
  medium: string;
  high: string;
  emergencyPulse: string;
}

export interface MapThemeTokens {
  darkBaseFill: string;
  electricRoutePolyline: string;
  batteryDepletionGradientStart: string;
  batteryDepletionGradientEnd: string;
  geofenceBoundaryStroke: string;
  geofenceFillAlpha: string;
  chargingHubPoiColor: string;
}

export interface ButtonTokenConfig {
  minTouchTargetDp: number;
  borderRadiusDp: number;
  variants: {
    primaryElectric: {
      background: string;
      textColor: string;
      focusRingColor: string;
    };
    secondaryOutline: {
      background: string;
      borderColor: string;
      textColor: string;
    };
    emergencySos: {
      background: string;
      textColor: string;
      hapticPattern: string;
    };
    ghost: {
      background: string;
      textColor: string;
    };
  };
}

export interface ResponsiveGuideline {
  mobileCompact360dp: string;
  mobileStandard412dp: string;
  tablet768dp: string;
}

export interface ScreenInventoryItem {
  screenId: string;
  name: string;
  role: 'rider' | 'captain' | 'shared';
  layoutDescription: string;
  asciiWireframe: string;
  responsiveGuidelines: ResponsiveGuideline;
  emptyStateGuidance: {
    condition: string;
    bilingualMessage: BilingualText;
    recoveryAction: BilingualText;
  };
  errorStateGuidance: {
    trigger: string;
    bilingualMessage: BilingualText;
    fallbackScreenId: string;
  };
  accessibilityNotes: {
    minTouchTarget: string;
    contrastRatio: string;
    screenReaderSemantic: string;
  };
  bilingualLabels: Record<string, BilingualText>;
}

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radii: RadiusTokens;
  elevations: ElevationTokens;
  mapTheme: MapThemeTokens;
  buttons: ButtonTokenConfig;
}

