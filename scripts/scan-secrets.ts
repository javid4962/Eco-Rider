import * as fs from 'fs';
import * as path from 'path';

interface SecretRule {
  name: string;
  pattern: RegExp;
  description: string;
}

const SECRET_RULES: SecretRule[] = [
  {
    name: 'Razorpay Live Key',
    pattern: /rzp_live_[0-9a-zA-Z]{14,}/,
    description: 'Live Razorpay API credential detected',
  },
  {
    name: 'Stripe Live Secret Key',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/,
    description: 'Live Stripe secret key detected',
  },
  {
    name: 'AWS Access Key ID',
    pattern: /AKIA[0-9A-Z]{16}/,
    description: 'Live AWS Access Key detected',
  },
  {
    name: 'Private Cryptographic Key',
    pattern: /-----BEGIN (?:RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/,
    description: 'Unencrypted private key detected',
  },
  {
    name: 'Twilio Live Auth Token',
    pattern: /AC[a-f0-9]{32}/i,
    description: 'Live Twilio Account SID detected',
  },
  {
    name: 'Hardcoded Master OTP Bypass',
    pattern: /(?:otp|start_otp|code)\s*(?:===|==)\s*['"](?:1234|0000|9999)['"]/i,
    description: 'Hardcoded test OTP bypass detected in production logic',
  },
];

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  '.next',
  'coverage',
  '.dart_tool',
  'build',
  'scratch',
  '.system_generated',
]);

const IGNORED_FILES = new Set(['pnpm-lock.yaml', 'scan-secrets.ts', 'scan-secrets.spec.ts']);

interface Finding {
  filePath: string;
  lineNumber: number;
  ruleName: string;
  description: string;
  preview: string;
}

function scanDirectory(dir: string, baseDir: string): Finding[] {
  const findings: Finding[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      findings.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile()) {
      if (IGNORED_FILES.has(entry.name)) {
        continue;
      }

      // Only scan text files
      const ext = path.extname(entry.name).toLowerCase();
      const validExts = [
        '.ts',
        '.tsx',
        '.js',
        '.dart',
        '.json',
        '.yml',
        '.yaml',
        '.md',
        '.sql',
        '.env',
        '.example',
        '.ps1',
      ];
      if (!validExts.includes(ext) && !entry.name.startsWith('.env')) {
        continue;
      }

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          for (const rule of SECRET_RULES) {
            if (rule.pattern.test(line)) {
              findings.push({
                filePath: relPath,
                lineNumber: i + 1,
                ruleName: rule.name,
                description: rule.description,
                preview: line.trim().substring(0, 100),
              });
            }
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return findings;
}

export function runSecretScan(rootDir = process.cwd()): { success: boolean; findings: Finding[] } {
  const findings = scanDirectory(rootDir, rootDir);
  return {
    success: findings.length === 0,
    findings,
  };
}

// CLI execution
const isMainScript = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/scan-secrets.ts');
if (isMainScript) {
  console.log('🔍 Running EcoRide repository secret scanner...');
  const result = runSecretScan();

  if (!result.success) {
    console.error(
      `\n❌ Secret scan FAILED: Found ${result.findings.length} potential security violation(s):`,
    );
    for (const f of result.findings) {
      console.error(`  - [${f.ruleName}] ${f.filePath}:${f.lineNumber} - ${f.description}`);
      console.error(`    Line: "${f.preview}"`);
    }
    process.exit(1);
  } else {
    console.log('✅ Secret scan PASSED: Zero live credentials or secret leaks found.');
    process.exit(0);
  }
}
