/**
 * EcoRide Security & Privacy Log Sanitizer
 * Enforces strict exclusion of personal locations, OTPs, and credentials from all system logs.
 */

const SECRET_KEY_REGEX =
  /(?:password|secret|token|auth|authorization|cookie|apikey|accesskey|privatekey)/i;
const OTP_KEY_REGEX = /(?:^|_)(?:otp|start_?otp|startcode|code|pin)(?:$|_)/i;
const LOCATION_KEY_REGEX =
  /(?:latitude|longitude|pickuplat|pickuplng|dropofflat|dropofflng|pickuplocation|dropofflocation|coordinates)/i;
const PHONE_REGEX = /(\+?91)?[6-9]\d{5}(\d{4})/g;
const DB_URI_REGEX = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@/gi;

export class LogSanitizer {
  /**
   * Deep sanitizes any input (object, string, error, array) to redact sensitive data.
   */
  static sanitize(input: unknown): unknown {
    if (input === null || input === undefined) {
      return input;
    }

    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }

    if (input instanceof Error) {
      return {
        name: input.name,
        message: this.sanitizeString(input.message),
        // Exclude internal system stack trace in sanitized output
        stack: '[REDACTED_STACK_TRACE]',
      };
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitize(item));
    }

    if (typeof input === 'object') {
      const sanitizedObj: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
        if (SECRET_KEY_REGEX.test(key)) {
          sanitizedObj[key] = '[REDACTED_SECRET]';
        } else if (OTP_KEY_REGEX.test(key)) {
          sanitizedObj[key] = '[REDACTED_OTP]';
        } else if (LOCATION_KEY_REGEX.test(key)) {
          sanitizedObj[key] = '[REDACTED_COORDINATES]';
        } else {
          sanitizedObj[key] = this.sanitize(val);
        }
      }
      return sanitizedObj;
    }

    return input;
  }

  /**
   * Sanitizes string values (e.g. log messages, URLs, error text).
   */
  static sanitizeString(str: string): string {
    if (!str) return str;

    let sanitized = str;

    // 1. Redact database credentials in connection strings
    sanitized = sanitized.replace(DB_URI_REGEX, 'postgres://$1:[REDACTED_SECRET]@');

    // 2. Redact 4-digit or 6-digit OTPs in strings (e.g. "OTP: 4821" or "code=123456")
    sanitized = sanitized.replace(
      /(?:otp|code|pin)\s*[:=]\s*['"]?(\d{4,6})['"]?/gi,
      'otp: [REDACTED_OTP]',
    );

    // 3. Redact Bearer tokens in headers or strings
    sanitized = sanitized.replace(/Bearer\s+([a-zA-Z0-9_.-]+)/gi, 'Bearer [REDACTED_SECRET]');

    // 4. Mask phone numbers: +919123400001 -> +91*****0001
    sanitized = sanitized.replace(PHONE_REGEX, '$1*****$2');

    return sanitized;
  }
}
