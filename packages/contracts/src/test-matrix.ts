export enum TestCategory {
  API = 'api',
  MOBILE = 'mobile',
  ADMIN = 'admin',
  CONCURRENCY = 'concurrency',
  SECURITY = 'security',
  FIELD = 'field',
}

export enum RequirementPriority {
  P0 = 'P0',
  P1 = 'P1',
  P2 = 'P2',
}

export enum RequirementType {
  COMPLIANCE = 'compliance',
  FINANCIAL = 'financial',
  SAFETY = 'safety',
  CORE_DISPATCH = 'core_dispatch',
  EXPERIENCE = 'experience',
}

export interface HumanAcceptanceOwner {
  name: string;
  role: string;
  department: string;
  signOffStage: string;
}

export interface TestRequirementMapping {
  reqId: string;
  title: string;
  priority: RequirementPriority;
  type: RequirementType;
  isReleaseBlocker: boolean;
  description: string;
  measurableCriteria: string;
  applicableCategories: TestCategory[];
  testImplementationReference: string;
  humanOwner: HumanAcceptanceOwner;
}

export interface TestMatrixSummary {
  totalRequirements: number;
  p0Count: number;
  p1Count: number;
  releaseBlockersCount: number;
  complianceCount: number;
  financialCount: number;
  categoryCoverage: Record<TestCategory, number>;
  humanOwnersCount: number;
}
