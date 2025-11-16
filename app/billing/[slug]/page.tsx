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
import { toast } from "@/components/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
type BillingType = "partial" | "advance";

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
    // pagination state for recentBillingHistory
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

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
            if (userId === null) return;

            // Validate all fields are present
            const emptyFields: string[] = [];
            if (!billingForm.amount || billingForm.amount.trim() === "") emptyFields.push("Amount");
            if (!billingForm.paymentType || billingForm.paymentType.trim() === "") emptyFields.push("Payment Type");
            if (!billingForm.billingType || billingForm.billingType.trim() === "") emptyFields.push("Billing Type");
            if (!billingForm.remark || billingForm.remark.trim() === "") emptyFields.push("Remark");

            if (emptyFields.length > 0) {
                toast({
                    title: "Validation error",
                    description: `Please fill the following fields: ${emptyFields.join(", ")}`,
                    variant: "destructive",
                });
                return;
            }

            setSubmitting(true);
            setError(null);

            const amountNumber = parseFloat(billingForm.amount);
            if (Number.isNaN(amountNumber) || amountNumber < 0) {
                toast({ title: "Validation error", description: "Please enter a valid amount", variant: "destructive" });
                setSubmitting(false);
                return;
            }
            // Ensure amount is an integer (no decimals allowed)
            if (!Number.isInteger(amountNumber)) {
                toast({ title: "Validation error", description: "Amount must be an integer (no decimals)", variant: "destructive" });
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
                toast({ title: "Success", description: "Billing record created" });
            } else {
                setError(response.message || "Failed to create billing record");
                toast({ title: "Error", description: response.message || "Failed to create billing record", variant: "destructive" });
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

    // Reset pagination when financialData changes
    useEffect(() => {
        setCurrentPage(1);
    }, [financialData?.recentBillingHistory?.length]);

    // Pagination helpers (computed from current financialData)
    const recentHistory = financialData?.recentBillingHistory ?? [];
    const totalHistory = recentHistory.length;
    const totalPages = Math.max(1, Math.ceil(totalHistory / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedHistory = recentHistory.slice(startIndex, startIndex + itemsPerPage);
    const showingStart = totalHistory === 0 ? 0 : startIndex + 1;
    const showingEnd = Math.min(currentPage * itemsPerPage, totalHistory);

    const getPages = (tp: number, cp: number) => {
        const pages: (number | string)[] = [];
        if (tp <= 7) {
            for (let i = 1; i <= tp; i++) pages.push(i);
        } else {
            pages.push(1);
            if (cp > 4) pages.push("...");
            const startPage = Math.max(2, cp - 2);
            const endPage = Math.min(tp - 1, cp + 2);
            for (let i = startPage; i <= endPage; i++) pages.push(i);
            if (cp + 2 < tp - 1) pages.push("...");
            pages.push(tp);
        }
        return pages;
    };

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
                                    <Input
                                        type="number"
                                        step="1"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={billingForm.amount}
                                        onChange={(e) => {
                                            // allow only digits (integers). strip any non-digit chars
                                            const sanitized = e.target.value.replace(/[^0-9]/g, "");
                                            setBillingForm((prev) => ({
                                                ...prev,
                                                amount: sanitized,
                                            }));
                                        }}
                                        className="w-full"
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
                                            <SelectItem value="partial">Partial</SelectItem>
                                            <SelectItem value="advance">Advance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Remark */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Remark</label>
                                <Textarea
                                    value={billingForm.remark}
                                    onChange={(e) =>
                                        setBillingForm((prev) => ({
                                            ...prev,
                                            remark: e.target.value,
                                        }))
                                    }
                                    className="w-full"
                                    rows={3}
                                    placeholder="Payment note or description"
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    // disabled={submitting || !billingForm.amount}
                                    className="cursor-pointer"
                                >
                                    {submitting ? "Creating..." : "Create Billing Record"}
                                </Button>
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

                        {totalHistory === 0 ? (
                            <p className="text-gray-500 text-sm">No billing history yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">Date</th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">Bill ID</th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">Billing Type</th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">Payment Type</th>
                                        <th className="text-right px-3 py-2 font-medium text-gray-700">Amount</th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">Remark</th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">Created By</th>
                                        <th className="text-left px-3 py-2 font-medium text-gray-700">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedHistory.map((record) => (
                                        <tr key={record.id} className="border-b last:border-0">
                                            <td className="px-3 py-2">{new Date(record.createdAt).toLocaleString()}</td>
                                            <td className="px-3 py-2 font-mono text-xs">{record.billId}</td>
                                            <td className="px-3 py-2 capitalize"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">{record.billingType}</span></td>
                                            <td className="px-3 py-2"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{record.paymentType.replace(/_/g, ' ')}</span></td>
                                            <td className="px-3 py-2 text-right font-medium">{record.currency.toUpperCase()} {record.amount}</td>
                                            <td className="px-3 py-2">{record.remark || <span className="text-gray-400">—</span>}</td>
                                            <td className="px-3 py-2">{record.createdBy?.fullName || '—'}</td>
                                            <td className="px-3 py-2">
                                                <Link href={`/billing/invoice?record=${encryptNumber(record.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700">View Invoice</Link>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>

                                {totalPages > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">Showing {showingStart} to {showingEnd} of {totalHistory}</div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                                            {getPages(totalPages, currentPage).map((p, idx) => typeof p === 'string' ? (
                                                <span key={`dots-${idx}`} className="px-2 text-sm">{p}</span>
                                            ) : (
                                                <Button key={p} size="sm" variant={p === currentPage ? 'default' : 'outline'} onClick={() => setCurrentPage(Number(p))}>{p}</Button>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                     </div>
                 </div>
             )}
         </div>
     );
 }
