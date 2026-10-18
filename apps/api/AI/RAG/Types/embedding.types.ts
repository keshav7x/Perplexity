export interface VectorRecord {
  id: string;
  values: number[];
  metadata: {
    text: string;
    page: number;
    currentSection?: string;
    blockTypes: string[];

    documentId: string;
    userId: string;
  };
}
