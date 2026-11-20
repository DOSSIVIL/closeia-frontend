export type DashboardUserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export interface DashboardSummary {
  generatedAt: string;
  scope: 'platform' | 'school';
  users: {
    total: number;
    active: number;
    invited: number;
    suspended: number;
    monthlyRegistrations: { month: string; count: number }[];
  };
  schools: {
    total: number;
    active: number;
    inactive: number;
    recent: {
      id: string;
      name: string;
      city: string | null;
      active: boolean;
      createdAt: string;
      userCount: number;
    }[];
  };
}
