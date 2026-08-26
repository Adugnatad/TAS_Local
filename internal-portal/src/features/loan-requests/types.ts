export interface LoanRequest {
  id: string;
  status?: string;
  coopStreamStatus?: string;
  amount?: number;
  currency?: string;
  productCode?: string;
  productId?: string;
  businessType?: string;
  purpose?: string;
  requestRef?: string;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  [key: string]: unknown;
}

export interface LoanPayload {
  amount: number;
  currency?: string;
  productCode?: string;
  productId?: string;
  businessType?: string;
  purpose?: string;
  requestRef?: string;
  [key: string]: unknown;
}

export type CatalogOption = {
  id?: string;
  code?: string;
  name?: string;
  label?: string;
  value?: string;
};
