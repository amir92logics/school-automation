export interface PaymentLinkParams {
    baseUrl: string;
    amount: number;
    studentName: string;
    feeRecordId: string;
    schoolName: string;
}

export const buildPaymentLink = (params: PaymentLinkParams): string => {
    if (!params.baseUrl) return '';

    const url = new URL(params.baseUrl);
    url.searchParams.append('amount', params.amount.toString());
    url.searchParams.append('student', params.studentName);
    url.searchParams.append('ref', params.feeRecordId);
    url.searchParams.append('school', params.schoolName);

    return url.toString();
};
