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

type PageSize = "A4" | "A5";

export default function InvoicePage() {
    const searchParams = useSearchParams();
    const slug = (searchParams.get("record") ?? "") as string;

    const [billingRecord, setBillingRecord] = useState<BillingRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState<PageSize>("A4");
    const [downloading, setDownloading] = useState(false);

    // Org info from .env
    const orgName = process.env.NEXT_PUBLIC_ORG_NAME || "Your School Name";
    const orgAddress =
        process.env.NEXT_PUBLIC_ORG_ADDRESS || "Your Address, Nepal";
    const orgPhone = process.env.NEXT_PUBLIC_ORG_PHONE || "01-0000000";
    const orgEmail = process.env.NEXT_PUBLIC_ORG_EMAIL || "info@example.com";
    const orgPan = process.env.NEXT_PUBLIC_ORG_PAN || "PAN: 000000000";
    const orgRegNo = process.env.NEXT_PUBLIC_ORG_REG_NO || "Reg. No: 0000/0000/00";

    // Decrypt ID
    const { recordId, decryptError } = useMemo(() => {
        if (!slug)
            return {
                recordId: null as number | null,
                decryptError: "Missing invoice identifier.",
            };

        try {
            const id = decryptNumber(slug);
            return Number.isNaN(id)
                ? { recordId: null, decryptError: "Invalid invoice identifier." }
                : { recordId: id, decryptError: null };
        } catch {
            return {
                recordId: null,
                decryptError: "Failed to decode invoice identifier.",
            };
        }
    }, [slug]);

    // Fetch data
    useEffect(() => {
        const fetchBillingRecord = async () => {
            if (!recordId) return;

            setLoading(true);

            const response = await apiHandler<BillingRecord>({
                url: `/api/v1/billing/${recordId}`,
                method: "GET",
                onError: setError,
            });

            if (response.success) setBillingRecord(response.data);
            else setError(response.message);

            setLoading(false);
        };

        if (!decryptError) fetchBillingRecord();
    }, [recordId, decryptError]);

    // PRINT
    const handlePrint = (size: PageSize) => {
        setPageSize(size);
        setTimeout(() => window.print(), 100);
    };

    // DOWNLOAD PDF — using apiHandler with blob response type
    const handleDownloadPdf = async () => {
        if (!billingRecord) return;

        setDownloading(true);
        setError(null);

        const response = await apiHandler<Blob>({
            url: `/api/v1/billing/${billingRecord.id}/pdf`,
            method: "GET",
            responseType: 'blob',
            onError: (message: string) => {
                setError(message);
                console.error('Error downloading PDF:', message);
            },
        });

        if (response.success && response.data) {
            // Create a download link
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${billingRecord.billId || billingRecord.id}.pdf`;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            console.log('PDF downloaded successfully');
        } else {
            setError('Failed to download PDF from server');
        }

        setDownloading(false);
    };

    const enrollment = billingRecord?.enrollments?.[0];

    if (decryptError)
        return <p className="text-red-500 p-6">{decryptError}</p>;

    return (
        <div className="space-y-2">
            {/* CONTROLS */}
            <div className="max-w-4xl mx-auto p-6 print:hidden relative z-20">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <Button
                            variant={pageSize === "A4" ? "default" : "outline"}
                            onClick={() => setPageSize("A4")}
                        >
                            A4 (Portrait)
                        </Button>
                        <Button
                            variant={pageSize === "A5" ? "default" : "outline"}
                            onClick={() => setPageSize("A5")}
                        >
                            A5 (Landscape)
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={() => handlePrint(pageSize)}>Print</Button>
                        <Button
                            disabled={downloading || !billingRecord}
                            onClick={handleDownloadPdf}
                        >
                            {downloading ? "Downloading..." : "Download PDF"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* INVOICE CONTENT */}
            {billingRecord && (
                <div
                    id="invoice-content"
                    className="bg-white max-w-4xl mx-auto p-8 print:p-4 shadow relative z-10"
                >
                    {/* HEADER */}
                    <div className="flex justify-between border-b pb-4 mb-4">
                        <img
                            src="/images/main.png"
                            className="h-16 w-16"
                            alt="School Logo"
                        />

                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold uppercase">{orgName}</h1>
                                <p className="text-sm">{orgAddress}</p>
                                <p className="text-xs">
                                    Phone: {orgPhone} | Email: {orgEmail}
                                </p>
                                <p className="text-xs">
                                    {orgRegNo} | {orgPan}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <h2 className="text-xl font-bold">RECEIPT</h2>
                        </div>
                    </div>

                    {/* STUDENT / INVOICE DETAILS */}
                    <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm mb-2">
                        <div className="font-semibold">
                            Student Name:{" "}
                            <span className="font-normal">
                {billingRecord.user.fullName}
              </span>
                        </div>

                        <div className="font-semibold">
                            Student Code:{" "}
                            <span className="font-normal">
                {billingRecord.user.username}
              </span>
                        </div>

                        <div className="font-semibold">
                            Class:{" "}
                            <span className="font-normal">
                {enrollment?.class.name}
              </span>
                        </div>

                        <div className="font-semibold">
                            Section:{" "}
                            <span className="font-normal">
                {enrollment?.section.name}
              </span>
                        </div>

                        <div className="font-semibold">
                            Guardian:{" "}
                            <span className="font-normal">
                {billingRecord.user.guardianName}
              </span>
                        </div>

                        <div className="font-semibold">
                            Contact:{" "}
                            <span className="font-normal">
                {billingRecord.user.guardianContact}
              </span>
                        </div>

                        <div className="font-semibold">
                            Invoice ID:{" "}
                            <span className="font-normal">
                {billingRecord.billId}
              </span>
                        </div>

                        <div className="font-semibold">
                            Date:{" "}
                            <span className="font-normal">
                {billingRecord.createdAtBs}
              </span>
                        </div>
                    </div>

                    {/* MAIN TABLE */}
                    <table className="w-full border text-sm mb-6 border-collapse">
                        <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-2 py-1 w-10 text-left">S.N.</th>
                            <th className="border px-2 py-1 text-left">Description</th>
                            <th className="border px-2 py-1 text-right w-32">Amount</th>
                        </tr>
                        </thead>

                        <tbody>
                        <tr style={{ height: "70px" }}>
                            <td className="border px-2 py-1 align-top">1</td>
                            <td className="border px-2 py-1 align-top">
                                {billingRecord.remark}
                            </td>
                            <td className="border px-2 py-1 text-right align-top">
                                {billingRecord.amount}
                            </td>
                        </tr>

                        <tr>
                            <td
                                className="border px-2 py-1 font-semibold text-right"
                                colSpan={2}
                            >
                                Received Amount
                            </td>
                            <td className="border px-2 py-1 text-right font-semibold">
                                {billingRecord.currency.toUpperCase()}{" "}
                                {billingRecord.amount}
                            </td>
                        </tr>

                        <tr>
                            <td className="border px-2 py-1 text-right" colSpan={2}>
                                Billing Type
                            </td>
                            <td className="border px-2 py-1 text-right">
                                {toSentenceCase(billingRecord.billingType)}
                            </td>
                        </tr>

                        <tr>
                            <td className="border px-2 py-1 text-right" colSpan={2}>
                                Payment Type
                            </td>
                            <td className="border px-2 py-1 text-right">
                                {toSentenceCase(
                                    billingRecord.paymentType.replace(/_/g, " ")
                                )}
                            </td>
                        </tr>

                        <tr>
                            <td className="border px-2 py-1 italic" colSpan={3}>
                                In words: {billingRecord.amountInWords}
                            </td>
                        </tr>
                        </tbody>
                    </table>

                    {/* STAMP + RECEIVER */}
                    <div className="flex justify-between items-end mt-12 min-h-[100px]">
                        <div className="text-sm flex flex-col items-center">
                            <div className="border-t border-gray-400 w-40 mb-2" />
                            <p className="text-xs">School Stamp</p>
                        </div>

                        <div className="text-sm flex flex-col items-center">
                            <div className="border-t border-gray-400 w-40 mb-2" />
                            <p className="text-xs">Received By:</p>
                            <p className="font-semibold text-sm mt-1">
                                {billingRecord.createdBy.fullName}
                            </p>
                        </div>
                    </div>

                    {/* PRINT FOOTER */}
                    <div className="flex flex-col items-center justify-center mt-6 text-center">
                        <p className="text-[10px] text-gray-600">
                            Printed Time: {new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            {/* PRINT STYLES - only invoice content */}
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background: white;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #invoice-content,
                    #invoice-content * {
                        visibility: visible;
                    }
                    #invoice-content {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        margin: 0 !important;
                        padding: 10px !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        max-width: none !important;
                    }
                    @page {
                        margin: 0.5in !important;
                        size: ${pageSize === "A5" ? "A5 landscape" : "A4 portrait"};
                    }
                }
            `}</style>
        </div>
    );
}
