export type TradeProcess = Record<string, unknown> & {
  processInstanceId: string;
  status?: string;
  customerName?: string;
  organizationName?: string;
  createdAt?: string;
  updatedAt?: string;
};
