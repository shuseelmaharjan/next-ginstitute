"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {decryptNumber, encryptNumber} from "@/utils/numberCrypto";
import { useState, useMemo, useEffect, useCallback, FormEvent } from "react";
import apiHandler from "@/app/api/apiHandler";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

interface User {
    id: number;
    fullName: string;
    profilePicture: string | null;
    username: string;
    role: string;
    guardianName: string;
    guardianContact: string;
    remark: string;
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

interface FinancialSummary {
    totalNetFees: string;
    totalPaidAmount: string;
    dueAmount: string;
}

type PaymentType = "cash_on_hand" | "fonepay" | "esewa" | "khalti";
type BillingType = "regular" | "advance";

interface BillingHistoryRecord {
    id: number;
    billId: string;
    amount: string;
    currency: string;           // "npr" from API, we’ll display as uppercase
    paymentType: PaymentType;
    billingType: BillingType;
    remark: string;
    createdBy: {
        id: number;
        fullName: string;
    };
    updatedBy: {
        id: number;
        fullName: string;
    } | null;
    updatedRemark: string | null;
    createdAt: string;
    updatedAt: string;
}

interface FinancialData {
    user: User;
    enrollments: Enrollment[];
    financialSummary: FinancialSummary;
    recentBillingHistory: BillingHistoryRecord[];
}

interface NewBillingRecord {
    userId: number;
    amount: number;
    paymentType: PaymentType;
    billingType: BillingType;
    currency: "NPR";
    remark: string;
}

interface BillingFormState {
    amount: string;
    paymentType: PaymentType;
    billingType: BillingType;
    remark: string;
}

export default function StudentBillingPage() {
    const searchParams = useSearchParams();
    const slug = searchParams.get("student") ?? undefined;

    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [billingForm, setBillingForm] = useState<BillingFormState>({
        amount: "",
        paymentType: "cash_on_hand",
        billingType: "advance",
        remark: "",
    });

    // Decrypt the userId from the query param
    const { userId, decryptError } = useMemo(() => {
        if (!slug) {
            return { userId: null as number | null, decryptError: "Missing billing identifier in URL." };
        }
        try {
            const id = decryptNumber(slug); // assume this returns a number
            if (Number.isNaN(id)) {
                return { userId: null, decryptError: "Invalid billing identifier." };
            }
            return { userId: id, decryptError: null };
        } catch (e) {
            console.error("Failed to decrypt billing slug", e);
            return { userId: null, decryptError: "Failed to decode billing identifier." };
        }
    }, [slug]);

    const fetchFinancialSummary = useCallback(async () => {
        if (userId === null) return;

        setLoading(true);
        setError(null);

        const response = await apiHandler<FinancialData>({
            url: `/api/v1/billing/user-financial-summary/${userId}`,
            method: "GET",
            onError: (message: string) => setError(message),
        });

        if (response.success) {
            setFinancialData(response.data);
        } else {
            setError(response.message || "Failed to fetch financial summary");
        }

        setLoading(false);
    }, [userId]);

    const handleCreateBilling = useCallback(
        async (e: FormEvent) => {
            e.preventDefault();
            if (userId === null || !billingForm.amount) return;

            setSubmitting(true);
            setError(null);

            const amountNumber = parseFloat(billingForm.amount);
            if (Number.isNaN(amountNumber) || amountNumber < 0) {
                setError("Please enter a valid amount.");
                setSubmitting(false);
                return;
            }

            const newBilling: NewBillingRecord = {
                userId,
                amount: amountNumber,
                paymentType: billingForm.paymentType,
                billingType: billingForm.billingType,
                currency: "NPR",
                remark: billingForm.remark,
            };

            const response = await apiHandler({
                url: "/api/v1/billing",
                method: "POST",
                data: newBilling,
                onError: (message: string) => setError(message),
            });

            if (response.success) {
                setBillingForm({
                    amount: "",
                    paymentType: "cash_on_hand",
                    billingType: "advance",
                    remark: "",
                });
                await fetchFinancialSummary();
            } else {
                setError(response.message || "Failed to create billing record");
            }

            setSubmitting(false);
        },
        [userId, billingForm, fetchFinancialSummary]
    );

    useEffect(() => {
        if (userId !== null && !decryptError) {
            fetchFinancialSummary();
        }
    }, [userId, decryptError, fetchFinancialSummary]);

    if (decryptError) {
        return (
            <div className="p-6 max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Student Billing Page</h1>
                <p className="text-red-500">{decryptError}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Student Billing Page</h1>
                {slug && (
                    <span className="text-xs text-gray-500">
                        Billing token: <code className="bg-gray-100 px-2 py-1 rounded">{slug}</code>
                    </span>
                )}
            </div>

            {loading && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                    Loading financial summary...
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {financialData && (
                <div className="space-y-6">
                    {/* Student + Summary row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* User Information */}
                        <div className="bg-white p-6 rounded-lg shadow col-span-1 lg:col-span-2">
                            <h2 className="text-xl font-semibold mb-4">Student Information</h2>
                            <div className="flex gap-4 items-start">
                                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">
                                    {financialData.user.fullName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div className="space-y-1">
                                        <p>
                                            <span className="font-medium">Name:</span> {financialData.user.fullName}
                                        </p>
                                        <p>
                                            <span className="font-medium">Username:</span>{" "}
                                            {financialData.user.username}
                                        </p>
                                        <p>
                                            <span className="font-medium">Role:</span> {financialData.user.role}
                                        </p>
                                        <p>
                                            <span className="font-medium">Status:</span>{" "}
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                                {financialData.user.status}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p>
                                            <span className="font-medium">Guardian:</span>{" "}
                                            {financialData.user.guardianName}
                                        </p>
                                        <p>
                                            <span className="font-medium">Contact:</span>{" "}
                                            {financialData.user.guardianContact}
                                        </p>
                                        <p>
                                            <span className="font-medium">Remark:</span> {financialData.user.remark}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
                            <div className="space-y-3">
                                <div className="text-sm text-gray-600">Total Net Fees</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    NPR {financialData.financialSummary.totalNetFees}
                                </div>

                                <div className="flex justify-between items-center mt-3">
                                    <div>
                                        <div className="text-xs text-gray-500">Total Paid</div>
                                        <div className="text-lg font-semibold text-green-600">
                                            NPR {financialData.financialSummary.totalPaidAmount}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Due Amount</div>
                                        <div className="text-lg font-semibold text-red-600">
                                            NPR {financialData.financialSummary.dueAmount}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enrollments */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Enrollments</h2>
                            <span className="text-xs text-gray-500">
                                {financialData.enrollments.length} record
                                {financialData.enrollments.length !== 1 && "s"}
                            </span>
                        </div>
                        {financialData.enrollments.length === 0 ? (
                            <p className="text-gray-500 text-sm">No enrollment records found.</p>
                        ) : (
                            <div className="space-y-4">
                                {financialData.enrollments.map((enrollment) => (
                                    <div
                                        key={enrollment.id}
                                        className="border border-gray-100 p-4 rounded-lg hover:shadow-sm transition"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p>
                                                    <span className="font-medium">Department:</span>{" "}
                                                    {enrollment.department.name}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Course:</span>{" "}
                                                    {enrollment.course.name}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Class:</span>{" "}
                                                    {enrollment.class.name}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Section:</span>{" "}
                                                    {enrollment.section.name}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p>
                                                    <span className="font-medium">Enrollment Date:</span>{" "}
                                                    {new Date(
                                                        enrollment.enrollmentDate
                                                    ).toLocaleString()}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Total Fees:</span> NPR{" "}
                                                    {enrollment.totalFees}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Discount:</span> NPR{" "}
                                                    {enrollment.discount}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Net Fees:</span> NPR{" "}
                                                    {enrollment.netFees}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Status:</span>{" "}
                                                    {enrollment.isActive ? (
                                                        <span className="text-green-600 font-medium">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500 font-medium">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* New Billing Record Form */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Create New Billing Record</h2>
                        <form onSubmit={handleCreateBilling} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount (NPR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={billingForm.amount}
                                        onChange={(e) =>
                                            setBillingForm((prev) => ({
                                                ...prev,
                                                amount: e.target.value,
                                            }))
                                        }
                                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        min="0"
                                    />
                                </div>

                                {/* Payment Type (shadcn Select) */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Payment Type</label>
                                    <Select
                                        value={billingForm.paymentType}
                                        onValueChange={(value: PaymentType) =>
                                            setBillingForm((prev) => ({
                                                ...prev,
                                                paymentType: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select payment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash_on_hand">Cash on hand</SelectItem>
                                            <SelectItem value="fonepay">Fonepay</SelectItem>
                                            <SelectItem value="esewa">eSewa</SelectItem>
                                            <SelectItem value="khalti">Khalti</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Billing Type (shadcn Select) */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Billing Type</label>
                                    <Select
                                        value={billingForm.billingType}
                                        onValueChange={(value: BillingType) =>
                                            setBillingForm((prev) => ({
                                                ...prev,
                                                billingType: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select billing type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="regular">Regular</SelectItem>
                                            <SelectItem value="advance">Advance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Remark */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Remark</label>
                                <textarea
                                    value={billingForm.remark}
                                    onChange={(e) =>
                                        setBillingForm((prev) => ({
                                            ...prev,
                                            remark: e.target.value,
                                        }))
                                    }
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Payment note or description"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting || !billingForm.amount}
                                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
                                >
                                    {submitting ? "Creating..." : "Create Billing Record"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Recent Billing History */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Recent Billing History</h2>
                            <span className="text-xs text-gray-500">
                                {financialData.recentBillingHistory.length} record
                                {financialData.recentBillingHistory.length !== 1 && "s"}
                            </span>
                        </div>

                        {financialData.recentBillingHistory.length === 0 ? (
                            <p className="text-gray-500 text-sm">No billing history yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">
                                            Date
                                        </th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">
                                            Bill ID
                                        </th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">
                                            Billing Type
                                        </th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">
                                            Payment Type
                                        </th>
                                        <th className="text-right px-3 py-2 font-medium text-gray-700">
                                            Amount
                                        </th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">
                                            Remark
                                        </th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">
                                            Created By
                                        </th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">Actions</th> {/* 👈 NEW */}

                                    </tr>
                                    </thead>
                                    <tbody>
                                    {financialData.recentBillingHistory.map((record) => (
                                        <tr key={record.id} className="border-b last:border-0">
                                            <td className="px-3 py-2">
                                                {new Date(record.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs">
                                                {record.billId}
                                            </td>
                                            <td className="px-3 py-2 capitalize">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                                                        {record.billingType}
                                                    </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                        {record.paymentType.replace(/_/g, " ")}
                                                    </span>
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium">
                                                {record.currency.toUpperCase()} {record.amount}
                                            </td>
                                            <td className="px-3 py-2">
                                                {record.remark || (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {record.createdBy?.fullName || "—"}
                                            </td>
                                            <td className="px-3 py-2">
                                                <Link
                                                    href={`/billing/invoice?record=${encryptNumber(record.id)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                                                >
                                                    View Invoice
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
