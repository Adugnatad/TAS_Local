export interface Employee {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
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
  roles: string[];
}
