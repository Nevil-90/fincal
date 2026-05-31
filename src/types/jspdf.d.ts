declare module 'jspdf-autotable' {
  interface AutoTableOptions {
    head?: (string | number)[][];
    body?: (string | number)[][];
    startY?: number;
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: {
      fillColor?: number[];
      textColor?: number | number[];
      fontSize?: number;
    };
    bodyStyles?: {
      fontSize?: number;
      textColor?: number | number[];
    };
    columnStyles?: Record<number, {
      textColor?: number[];
      fillColor?: number[];
      fontSize?: number;
    }>;
    margin?: { top?: number; left?: number; right?: number; bottom?: number };
    didDrawPage?: (data: { pageNumber: number }) => void;
  }

  function autoTable(doc: import('jspdf').jsPDF, options: AutoTableOptions): void;
  export default autoTable;
}
