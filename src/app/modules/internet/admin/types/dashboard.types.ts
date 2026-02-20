export type DashboardActivityItem = {
  id: string;
  type: 'payment' | 'invoice';
  clientName: string;
  label: string;
  dateISO: string;
};

export type DashboardData = {
  totalClients: number;
  activeClients: number;
  suspendedClients: number;
  inactiveClients: number;

  monthlyRevenuePaid: number;

  pendingInvoicesCount: number;
  overdueInvoicesCount: number;

  revenueBreakdownMonth: {
    baseSubscriptions: number;
    extraDevices: number;
    overcharges: number;
  };

  recentActivity: DashboardActivityItem[];
};
