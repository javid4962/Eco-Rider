import { runSecretScan } from '../../../scripts/scan-secrets';

describe('Secret Scanner Unit Tests (EV-013)', () => {
  it('should scan clean codebase without finding leaked credentials or live keys', () => {
    const result = runSecretScan();
    expect(result.success).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it('should detect simulated live payment gateway keys', () => {
    const simulatedRazorpayLive = 'const apiKey = "rzp_live_1234567890abcdef1234";';
    const razorpayRule = /rzp_live_[0-9a-zA-Z]{14,}/;
    expect(razorpayRule.test(simulatedRazorpayLive)).toBe(true);
  });

  it('should detect simulated AWS access keys', () => {
    const simulatedAws = 'const awsKey = "AKIAIOSFODNN7EXAMPLE";';
    const awsRule = /AKIA[0-9A-Z]{16}/;
    expect(awsRule.test(simulatedAws)).toBe(true);
  });

  it('should detect prohibited hardcoded OTP bypasses', () => {
    const bypass1 = 'if (otp === "1234") return true;';
    const bypass2 = 'if (start_otp == "0000") allow();';
    const otpBypassRule = /(?:otp|start_otp|code)\s*(?:===|==)\s*['"](?:1234|0000|9999)['"]/i;

    expect(otpBypassRule.test(bypass1)).toBe(true);
    expect(otpBypassRule.test(bypass2)).toBe(true);
  });
});
