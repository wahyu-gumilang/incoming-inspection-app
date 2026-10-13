export interface Vendor {
  vendaccount: string;
  name: string;
  inspectionCount?: number;
}

export interface VendorLookup {
  vendaccount: string;
  name: string;
}

export interface VendorListResponse {
  success: boolean;
  data: Vendor[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VendorResponse {
  success: boolean;
  data: Vendor;
}
