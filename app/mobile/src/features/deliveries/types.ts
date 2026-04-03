export type DeliveryStatus = 'pending' | 'completed';

export type DeliveryStop = {
  id: string;
  stopNumber: number;
  address: string;
  customerName: string;
  packageCount: number;
  notes: string;
  status: DeliveryStatus;
  completedAt?: string;
};

export type DriverRoute = {
  driverName: string;
  routeLabel: string;
  stops: DeliveryStop[];
};

export type OptimizeRequestLike = {
  deliveries?: Array<{
    id: number;
    recipientName?: string;
    address?: string;
    notes?: string;
    demand?: {
      value?: number;
    };
  }>;
  vehicles?: Array<{
    id: number;
    driverName?: string;
  }>;
};
