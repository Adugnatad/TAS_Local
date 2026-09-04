export type LoanProcess = Record<string, unknown> & {
  coopstreamApplicationId?: string;
  applicationId?: string;
  id?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  customerName?: string;
  organizationName?: string;
};

export type LoanProcessCollection =
  | LoanProcess[]
  | {
      content?: LoanProcess[];
      items?: LoanProcess[];
      processes?: LoanProcess[];
      totalElements?: number;
      total?: number;
    };
