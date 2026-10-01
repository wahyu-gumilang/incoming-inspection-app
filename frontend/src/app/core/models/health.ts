// GET /api/health
export interface Health {
  status: string;
  service: string;
  db: string;
  timestamp: string;
}
