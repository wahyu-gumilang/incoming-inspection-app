export interface Vendor {
  vendaccount: string;
  name: string;
  inspectionCount?: number;
}

export interface VendorLookup {
  vendaccount: string;
  name: string;
}

export interface VendorImportResult {
  created: number;
  skipped: string[];
}
