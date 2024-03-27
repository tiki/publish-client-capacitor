export interface ReceiptResponse {
    documentMetadata: DocumentMetadata;
    expenseDocuments: ExpenseDocument[];
}

export interface DocumentMetadata {
    pages: number;
}

export interface ExpenseDocument {
    blocks:         Block[];
    expenseIndex:   number;
    lineItemGroups: LineItemGroup[];
    summaryFields:  { [key: string]: SummaryField }[];
}

export interface Block {
    confidence: number;
    text:       string;
}

export interface LineItemGroup {
    lineItemGroupIndex: number;
    lineItems:          LineItem[];
}

export interface LineItem {
    lineItemExpenseFields: LineItemExpenseField[];
}

export interface LineItemExpenseField {
    productCode?: SummaryField;
    item?:        SummaryField;
    price?:       SummaryField;
    expenseRow?:  SummaryField;
}

export interface SummaryField {
    confidenceKey:   number;
    confidenceValue: number;
    value:           string;
}
