export interface Employee {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  crmSystemId?: string | null;
  engineerSystemId?: string | null;
  status: string;
  roles: string[];
}

export interface CreateEmployeeInput {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  crmSystemId?: string;
  engineerSystemId?: string;
  roles: string[];
}

export interface VerifyEmployeeResponse {
  valid: boolean;
  email: string;
  groups: string[];
  fullName: string | null;
  coopStreamValid: boolean;
  etradeChecked: boolean;
  etradeValid: boolean;
}
