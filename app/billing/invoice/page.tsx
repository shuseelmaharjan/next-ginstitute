"use client";

import { useSearchParams } from "next/navigation";
import { decryptNumber } from "@/utils/numberCrypto";
import { useState, useMemo, useEffect } from "react";
import apiHandler from "@/app/api/apiHandler";
import { Button } from "@/components/ui/button";
import { toSentenceCase } from "@/utils/textUtils";

interface BillingUser {
    id: number;
    fullName: string;
    username: string;
    role: string;
    guardianName: string;
    guardianContact: string;
    status: string;
}

interface Department {
    id: number;
    name: string;
}
interface Course {
    id: number;
    name: string;
}
interface Class {
    id: number;
    name: string;
}
interface Section {
    id: number;
    name: string;
}

interface Enrollment {
    id: number;
    department: Department;
    course: Course;
    class: Class;
    section: Section;
    enrollmentDate: string;
    totalFees: string;
    discount: string;
    netFees: string;
    isActive: boolean;
}

interface BillingRecord {
    id: number;
    billId: string;
    amount: string;
    amountInWords: string;
    currency: string;
    paymentType: "cash_on_hand" | "fonepay" | "esewa" | "khalti";
    billingType: "regular" | "advance";
    remark: string;
    createdBy: { id: number; fullName: string };
    updatedBy: { id: number; fullName: string } | null;
    updatedRemark: string | null;
    createdAtBs: string;
    createdAt: string;
    updatedAt: string;
    user: BillingUser;
    enrollments: Enrollment[];
}

export default function InvoicePage() {
    const searchParams = useSearchParams();
    const slug = (searchParams.get("record") ?? "") as string;

    const [billingRecord, setBillingRecord] = useState<BillingRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    // Org info from .env mapped to the org object expected by your template
    const org = {
        logo: process.env.NEXT_PUBLIC_ORG_LOGO || "",
        name: process.env.NEXT_PUBLIC_ORG_NAME || "Your School Name",
        address: process.env.NEXT_PUBLIC_ORG_ADDRESS || "Your Address, Nepal",
        phone: process.env.NEXT_PUBLIC_ORG_PHONE || "01-0000000",
        email: process.env.NEXT_PUBLIC_ORG_EMAIL || "info@example.com",
        registrationNumber: process.env.NEXT_PUBLIC_ORG_REG_NO || "Reg. No: 0000/0000/00",
        panNumber: process.env.NEXT_PUBLIC_ORG_PAN || "PAN: 000000000",
    };

    // Decrypt ID
    const { recordId, decryptError } = useMemo(() => {
        if (!slug) return { recordId: null as number | null, decryptError: "Missing invoice identifier." };
        try {
            const id = decryptNumber(slug);
            return Number.isNaN(id) ? { recordId: null, decryptError: "Invalid invoice identifier." } : { recordId: id, decryptError: null };
        } catch {
            return { recordId: null, decryptError: "Failed to decode invoice identifier." };
        }
    }, [slug]);

    // Fetch data
    useEffect(() => {
        const fetchBillingRecord = async () => {
            if (!recordId) return;
            setLoading(true);
            const response = await apiHandler<BillingRecord>({ url: `/api/v1/billing/${recordId}`, method: "GET", onError: setError });
            if (response.success) setBillingRecord(response.data);
            else setError(response.message);
            setLoading(false);
        };
        if (!decryptError) fetchBillingRecord();
    }, [recordId, decryptError]);

    // PRINT
    const handlePrint = () => window.print();

    // DOWNLOAD PDF — using apiHandler with blob response type
    const handleDownloadPdf = async () => {
        if (!billingRecord) return;
        setDownloading(true);
        setError(null);
        const response = await apiHandler<Blob>({ url: `/api/v1/billing/${billingRecord.id}/pdf`, method: "GET", responseType: 'blob', onError: (message: string) => { setError(message); console.error('Error downloading PDF:', message); } });
        if (response.success && response.data) {
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${billingRecord.billId || billingRecord.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } else {
            setError('Failed to download PDF from server');
        }
        setDownloading(false);
    };

    const enrollment = billingRecord?.enrollments?.[0];

    // formatted amount as in template (thousand separators)
    const amountFixed = billingRecord ? new Intl.NumberFormat('en-US').format(Number(billingRecord.amount)) : "-";

    if (decryptError) return <p className="text-red-500 p-6">{decryptError}</p>;

    return (
        <div className="space-y-2">
            {/* CONTROLS (print/download only) */}
            <div className="max-w-4xl mx-auto p-6 print:hidden relative">
                <div className="flex justify-end items-center gap-2">
                    <Button onClick={handlePrint}>Print</Button>
                    <Button disabled={downloading || !billingRecord} onClick={handleDownloadPdf}>{downloading ? 'Downloading...' : 'Download PDF'}</Button>
                </div>
            </div>

            {/* show loading or error (keeps state used) */}
            {loading && (
                <div className="max-w-4xl mx-auto p-4">
                    <div className="text-center text-sm text-gray-600">Loading invoice...</div>
                </div>
            )}
            {error && (
                <div className="max-w-4xl mx-auto p-4">
                    <div className="text-center text-sm text-red-600">{error}</div>
                </div>
            )}

            {/* INVOICE CONTENT - match provided HTML/CSS exactly */}
            {billingRecord && (
                <div id="invoice-content" className="invoice-container">
                    <style jsx global>{`
                        @page { size: A4; margin: 0.5in; }
                        @media print {
                            /* Hide everything except the invoice content when printing */
                            body * { visibility: hidden; }
                            #invoice-content, #invoice-content * { visibility: visible; }
                            #invoice-content { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
                        }
                    `}</style>

                    <style jsx>{`
                        /* Scoped invoice styles - only affect elements inside #invoice-content */
                        /* On-screen (non-print) the invoice should be responsive and not affect parent layout */
                        #invoice-content { width: 100%; max-width: 800px; background: white; padding: 24px; margin: 0 auto; box-sizing: border-box; }
                         #invoice-content .header { margin-bottom: 20px; border-bottom: 2px solid #000000; padding-bottom: 15px; }
                         #invoice-content .header-main { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
                         #invoice-content .logo-area { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 8pt; text-align: center; }
                         #invoice-content .logo-area img { max-width: 100%; max-height: 100%; object-fit: contain; }
                         #invoice-content .school-text { flex: 1; text-align: center; }
                         #invoice-content .school-name { font-size: 20pt; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; }
                         #invoice-content .school-details { font-size: 11pt; margin-bottom: 5px; line-height: 1.4; }
                         #invoice-content .invoice-box { text-align: right; }
                         #invoice-content .invoice-title { font-size: 18pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                         #invoice-content .invoice-meta { margin-top: 4px; font-size: 10pt; }
                         #invoice-content .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 30px; margin-bottom: 20px; font-size: 11pt; }
                         #invoice-content .info-item { display: flex; align-items: center; gap: 6px; }
                         #invoice-content .label { font-weight: bold; min-width: 120px; }
                         #invoice-content .value { }
                         #invoice-content .payment-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11pt; }
                         #invoice-content .payment-table th, #invoice-content .payment-table td { border: 1px solid #000000; padding: 8px 12px; }
                         #invoice-content .payment-table td { height: 28px; }
                         #invoice-content .payment-table th { background-color: #f5f5f5; font-weight: bold; text-align: left; }
                         #invoice-content .amount-column { text-align: right; width: 120px; }
                         #invoice-content .billing-item-row{ height: 30px; }
                         #invoice-content .total-row { font-weight: bold; }
                         #invoice-content .payment-details { margin-bottom: 15px; font-size: 11pt; }
                         #invoice-content .payment-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 30px; margin-bottom: 10px; }
                         #invoice-content .payment-info .info-item { display: flex; align-items: center; gap: 6px; }
                         #invoice-content .amount-in-words { font-style: italic; margin-top: 10px; padding: 8px 0; border-top: 1px dashed #000000; border-bottom: 1px dashed #000000; }
                         #invoice-content .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 20px; }
                         #invoice-content .signature-area { text-align: center; margin-top: 20px; }
                         #invoice-content .signature-line { border-top: 1px solid #000000; width: 200px; margin: 40px auto 5px auto; }
                         #invoice-content .stamp-area { text-align: center; }
                         #invoice-content .print-footer { text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px solid #cccccc; }
                         #invoice-content .print-footer p { font-size: 9pt; color: #666666; }

                         /* Ensure printable sizes are correctly applied inside the invoice container */
                         @media print {
                            /* During print, set fixed A4 dimensions and proper padding */
                            #invoice-content { width: 210mm !important; min-height: 297mm !important; padding: 15mm !important; margin: 0 !important; }
                            /* Make sure invoice content prints at full width */
                            #invoice-content { box-sizing: border-box; }
                         }
                     `}</style>

                    {/* Header */}
                    <div className="header">
                        <div className="header-main">
                            <div className="logo-area">

                                    <img src="/images/main.jpg" alt='School Logo' />

                            </div>

                            <div className="school-text">
                                <div className="school-name">{org.name}</div>
                                <div className="school-details">
                                    {org.address}<br />
                                    Phone: {org.phone} | Email: {org.email}<br />
                                    {org.registrationNumber} | {org.panNumber}
                                </div>
                            </div>

                            <div className="invoice-box">
                                <div className="invoice-title">Invoice</div>
                            </div>
                        </div>
                    </div>

                    {/* Student Information */}
                    <div className="student-info">
                        <div className="info-item"><span className="label">Student Name:</span><span className="value">{billingRecord.user.fullName}</span></div>
                        <div className="info-item"><span className="label">Student Code:</span><span className="value">{billingRecord.user.username}</span></div>

                        <div className="info-item"><span className="label">Class:</span><span className="value">{enrollment?.class?.name || 'N/A'}</span></div>
                        <div className="info-item"><span className="label">Section:</span><span className="value">{enrollment?.section?.name || 'N/A'}</span></div>

                        <div className="info-item"><span className="label">Guardian:</span><span className="value">{billingRecord.user.guardianName}</span></div>
                        <div className="info-item"><span className="label">Contact:</span><span className="value">{billingRecord.user.guardianContact}</span></div>

                        <div className="info-item"><span className="label">Invoice ID:</span><span className="value">{billingRecord.billId}</span></div>
                        <div className="info-item"><span className="label">Date:</span><span className="value">{billingRecord.createdAtBs || new Date(billingRecord.createdAt).toLocaleDateString()}</span></div>
                    </div>

                    {/* Payment Table */}
                    <table className="payment-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>S.N.</th>
                                <th>Description</th>
                                <th className="amount-column">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="billing-item-row">
                                <td>1</td>
                                <td>{billingRecord.remark || 'Payment'}</td>
                                <td className="amount-column">{amountFixed}</td>
                            </tr>
                            <tr className="total-row">
                                <td colSpan={2} style={{ textAlign: 'right' }}>Received Amount</td>
                                <td className="amount-column">{billingRecord.currency.toUpperCase()} {amountFixed}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Payment Details */}
                    <div className="payment-details">
                        <div className="payment-info">
                            <div className="info-item"><span className="label">Billing Type:</span><span className="value">{toSentenceCase(billingRecord.billingType)}</span></div>
                            <div className="info-item"><span className="label">Payment Type:</span><span className="value">{toSentenceCase(billingRecord.paymentType.replace(/_/g, ' '))}</span></div>
                        </div>

                        <div className="amount-in-words"><strong>In words:</strong> {billingRecord.amountInWords}</div>
                    </div>

                    {/* Footer */}
                    <div className="footer">
                        <div className="signature-area">
                            <div className="signature-line"></div>
                            <div style={{ fontWeight: 'normal', marginBottom: 5 }}>School Stamp</div>
                        </div>

                        <div className="signature-area">
                            <div className="signature-line"></div>
                            <div style={{ fontWeight: 'normal', marginBottom: 5 }}>Received By</div>
                            <div style={{ marginTop: 5, fontWeight: 'normal' }}>{billingRecord.createdBy?.fullName || 'System Administrator'}</div>
                        </div>
                    </div>

                    {/* Print Footer */}
                    <div className="print-footer">
                        <p>Printed Time: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* print styles already included above */}
        </div>
    );
}