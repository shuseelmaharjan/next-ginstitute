"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, User, Users, UserCheck, Calculator } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import apiHandler from "@/app/api/apiHandler";
import { toast } from "@/components/hooks/use-toast";



// Types and Interfaces
interface DraftUser {
    id: number;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    username: string;
    role: string;
    status: string;
    createdAt: string;
    isActive: boolean;
    createdBy: number;
    remark: string;
    dateOfBirth: string;
    sex: string;
    fatherName: string;
    motherName: string;
    guardianName: string;
    emergencyContact: string;
    country: string;
    permanentState: string;
    permanentCity: string;
    profile: string;
    profilePicture: string | null;
    createdByUser: {
        id: number;
        firstName: string;
        middleName: string | null;
        lastName: string;
        fullName: string;
    };
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: {
        users: DraftUser[];
        total: number;
        role: string;
    };
}

interface PaginationState {
    page: number;
    limit: number;
    total: number;
}

const ROLES = [
    { value: "student", label: "Students", icon: User },
    { value: "teacher", label: "Teachers", icon: UserCheck },
    { value: "staff", label: "Staff", icon: Users },
    { value: "accountant", label: "Accountants", icon: Calculator },
] as const;

export default function DraftUserListPage() {
    const router = useRouter();

    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    const searchParams = useSearchParams();

    // State
    const [users, setUsers] = useState<DraftUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 10,
        total: 0,
    });

    // Get current tab from URL params or default to 'student'
    const currentTab = searchParams.get("role") || "student";

    // Update URL when tab changes
    const handleTabChange = useCallback((newRole: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("role", newRole);
        params.set("page", "1"); // Reset to first page when changing roles
        router.push(`?${params.toString()}`);
    }, [router, searchParams]);

    // Update URL when page changes
    const handlePageChange = useCallback((newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    }, [router, searchParams]);

    // Fetch drafted users
    const fetchDraftedUsers = useCallback(async (role: string, page: number = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await apiHandler<ApiResponse>({
                url: `/api/v1/users/drafted/${role}?page=${page}&limit=${pagination.limit}`,
                method: "GET",
                onError: (message) => {
                    setError(message);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: message,
                    });
                },
            });

            if (response.success) {
                setUsers(response.data.users);
                setPagination(prev => ({
                    ...prev,
                    page,
                    total: response.data.total,
                }));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch users";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, toast]);

    // Effect to fetch data when tab or page changes
    useEffect(() => {
        const page = parseInt(searchParams.get("page") || "1");
        setPagination(prev => ({ ...prev, page }));
        fetchDraftedUsers(currentTab, page);
    }, [currentTab, searchParams, fetchDraftedUsers]);

    // Helper functions
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getFullName = (user: DraftUser) => {
        return [user.firstName, user.middleName, user.lastName]
            .filter(Boolean)
            .join(" ");
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
                return "outline";
            case "approved":
                return "default";
            case "rejected":
                return "destructive";
            default:
                return "secondary";
        }
    };

    // Render loading skeleton
    const renderSkeleton = () => (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Render pagination
    const renderPagination = () => {
        const totalPages = Math.ceil(pagination.total / pagination.limit);
        if (totalPages <= 1) return null;

        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center justify-between px-2 mt-6">
                <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} entries
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                    >
                        Previous
                    </Button>
                    {pages.map((page) => (
                        <Button
                            key={page}
                            variant={pagination.page === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                        >
                            {page}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    // Render users table
    const renderUsersTable = () => {
        if (loading) return renderSkeleton();

        if (error) {
            return (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }

        if (users.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="text-muted-foreground">
                        No pending {currentTab} found.
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-black hover:bg-black/90">
                            <TableHead className="w-16">S.N.</TableHead>
                            <TableHead className="font-bold text-white">User</TableHead>
                            <TableHead className="font-bold text-white">Username</TableHead>
                            <TableHead className="font-bold text-white">Email</TableHead>
                            <TableHead className="font-bold text-white">Contact</TableHead>
                            <TableHead className="font-bold text-white">Status</TableHead>
                            <TableHead className="font-bold text-white">Created By</TableHead>
                            <TableHead className="font-bold text-white">Date Created</TableHead>
                            <TableHead className="font-bold text-white">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user, index) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    {(pagination.page - 1) * pagination.limit + index + 1}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-8 w-8">
                                            {user.profile ? (
                                                <AvatarImage src={`${BASE_URL}${user.profile}`} alt={getFullName(user)} className="object-cover" />
                                            ) : (
                                                <AvatarFallback className="text-sm">
                                                    {getInitials(user.firstName, user.lastName)}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>

                                        <div>
                                            <div className="font-medium">{getFullName(user)}</div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {user.sex} • {user.role}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                    {user.username}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.emergencyContact}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(user.status)}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        {user.createdByUser.fullName}
                                    </div>
                                </TableCell>
                                <TableCell>{formatDate(user.createdAt)}</TableCell>
                                <TableCell><Button variant="default" className="cursor-pointer" onClick={() => router.push(`/users/assign-engagements?user=${user.id}`)}>Assign Engagement</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {renderPagination()}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
                <p className="text-muted-foreground mt-2">
                    Review and manage user registrations awaiting approval
                </p>
            </div>

            {/* Tabs */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    {ROLES.map((role) => {
                        const Icon = role.icon;
                        return (
                            <TabsTrigger key={role.value} value={role.value} className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {role.label}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {/* Tab Content */}
                {ROLES.map((role) => (
                    <TabsContent key={role.value} value={role.value} className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <role.icon className="h-5 w-5" />
                                    Pending {role.label}
                                    {!loading && (
                                        <Badge variant="secondary" className="ml-2">
                                            {pagination.total}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderUsersTable()}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}