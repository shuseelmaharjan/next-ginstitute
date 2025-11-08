"use client";

import React, { useEffect, useState } from "react";
import apiHandler from "@/app/api/apiHandler";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/hooks/use-toast";
import { format } from "date-fns";
import CareerForm from "./CareerForm";
import DeleteConfirm from "./DeleteConfirm";

type Career = {
	id: number;
	title: string;
	position: string;
	description: string;
	requirements: string;
	startsFrom: string;
	endsAt: string;
	isActive: boolean;
	isPending: boolean;
	createdBy?: string;
	updatedBy?: string | null;
	createdAt?: string;
	updatedAt?: string;
	createdByUser?: { id: number; fullName: string } | null;
	updatedByUser?: { id: number; fullName?: string } | null;
};

// Helper function to strip HTML tags and truncate text
const stripHtmlAndTruncate = (
	html: string | null | undefined,
	maxLength: number = 100
): string => {
	if (!html) return "";
	const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
	if (text.length > maxLength) {
		return text.substring(0, maxLength) + "...";
	}
	return text;
};

const CareerPage = () => {
	const [activeCareers, setActiveCareers] = useState<Career[]>([]);
	const [pendingCareers, setPendingCareers] = useState<Career[]>([]);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<string>("active");

	const [formOpen, setFormOpen] = useState(false);
	const [formMode, setFormMode] = useState<"create" | "edit" | "view">("create");
	const [selected, setSelected] = useState<Career | null>(null);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [toDeleteId, setToDeleteId] = useState<number | null>(null);
	const [deleting, setDeleting] = useState(false);

	const fetchActiveCareers = async () => {
		setLoading(true);
		try {
			const res = await apiHandler<{
				success: boolean;
				message: string;
				data: Career[];
			}>({
				url: "/api/v1/careers/active",
				method: "GET",
			});
			setActiveCareers(res.data ?? []);
		} catch (err: unknown) {
			console.error(err);
			const msg = err instanceof Error ? err.message : String(err);
			toast({
				title: "Failed to load active careers",
				description: msg || "Could not fetch active careers",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchPendingCareers = async () => {
		setLoading(true);
		try {
			const res = await apiHandler<{
				success: boolean;
				message: string;
				data: Career[];
			}>({
				url: "/api/v1/careers/pending",
				method: "GET",
			});
			setPendingCareers(res.data ?? []);
		} catch (err: unknown) {
			console.error(err);
			const msg = err instanceof Error ? err.message : String(err);
			toast({
				title: "Failed to load pending careers",
				description: msg || "Could not fetch pending careers",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchActiveCareers();
		fetchPendingCareers();
	}, []);

	const openCreate = () => {
		setSelected(null);
		setFormMode("create");
		setFormOpen(true);
	};

	const openView = (item: Career) => {
		setSelected(item);
		setFormMode("view");
		setFormOpen(true);
	};

	const openEdit = (item: Career) => {
		setSelected(item);
		setFormMode("edit");
		setFormOpen(true);
	};

	const openDelete = (id: number) => {
		setToDeleteId(id);
		setDeleteOpen(true);
	};

	const confirmDelete = async () => {
		if (!toDeleteId) return;
		setDeleting(true);
		try {
			await apiHandler<{ success: boolean; message?: string }>({
				url: `/api/v1/careers/${toDeleteId}`,
				method: "DELETE",
			});
			toast({
				title: "Deleted",
				description: "Career deleted successfully",
				variant: "default",
			});
			setDeleteOpen(false);
			fetchActiveCareers();
			fetchPendingCareers();
		} catch (err: unknown) {
			console.error(err);
			const msg = err instanceof Error ? err.message : String(err);
			toast({
				title: "Delete failed",
				description: msg || "Could not delete career",
				variant: "destructive",
			});
		} finally {
			setDeleting(false);
		}
	};

	const handleSaved = () => {
		fetchActiveCareers();
		fetchPendingCareers();
	};

	const renderCareerCard = (career: Career) => (
		<Card key={career.id} className="hover:shadow-md transition-shadow">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-xl">{career.title}</CardTitle>
						<CardDescription className="mt-1">
							<span className="font-medium">{career.position}</span>
						</CardDescription>
						<CardDescription className="mt-2">
							{stripHtmlAndTruncate(career.description)}
						</CardDescription>
					</div>
					<div className="flex gap-2 ml-4">
						<Button
							size="sm"
							variant="outline"
							onClick={() => openView(career)}
                            className="cursor-pointer"
						>
							View
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => openEdit(career)}
                            className="cursor-pointer"
						>
							Edit
						</Button>
						<Button
							size="sm"
							variant="destructive"
							onClick={() => openDelete(career.id)}
                            className="cursor-pointer"
						>
							Delete
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<span>
							{career.startsFrom
								? format(new Date(career.startsFrom), "PPP")
								: "N/A"}{" "}
							-{" "}
							{career.endsAt
								? format(new Date(career.endsAt), "PPP")
								: "N/A"}
						</span>
					</div>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						<span>
							Created by:{" "}
							{career.createdByUser?.fullName || "System"}
						</span>
					</div>
					{career.updatedByUser && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							<span>
								Updated by:{" "}
								{career.updatedByUser.fullName}
							</span>
						</div>
					)}
					<div className="mt-3 pt-3 border-t">
						<p className="text-sm font-medium text-muted-foreground mb-2">
							Requirements:
						</p>
						<p className="text-sm text-muted-foreground">
							{stripHtmlAndTruncate(career.requirements, 150)}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Career Opportunities</h1>
					<p className="text-muted-foreground">
						Manage career opportunities and job postings
					</p>
				</div>
				<Button onClick={openCreate} className="cursor-pointer">
					<svg
						className="w-4 h-4 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Create Career
				</Button>
			</div>
            <div className="border-1 p-4 rounded-md shadow grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full border-none rounded-none shadow-none"
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="active" className="cursor-pointer">
						Active Careers ({activeCareers.length})
					</TabsTrigger>
					<TabsTrigger value="pending" className="cursor-pointer">
						Pending Careers ({pendingCareers.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="active" className="mt-6">
					{loading ? (
						<div className="flex justify-center items-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : activeCareers.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center h-48">
								<svg
									className="w-12 h-12 text-muted-foreground mb-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
									/>
								</svg>
								<p className="text-muted-foreground text-center">
									No active careers found. Create one to get started.
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-4">
							{activeCareers.map(renderCareerCard)}
						</div>
					)}
				</TabsContent>

				<TabsContent value="pending" className="mt-6">
					{loading ? (
						<div className="flex justify-center items-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : pendingCareers.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center h-48">
								<svg
									className="w-12 h-12 text-muted-foreground mb-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p className="text-muted-foreground text-center">
									No pending careers found.
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-4">
							{pendingCareers.map(renderCareerCard)}
						</div>
					)}
				</TabsContent>
			</Tabs>
            </div>

			<CareerForm
				open={formOpen}
				onClose={() => setFormOpen(false)}
				onSaved={handleSaved}
				initialData={selected}
				mode={formMode}
			/>

			<DeleteConfirm
				open={deleteOpen}
				onCancelAction={() => setDeleteOpen(false)}
				onConfirmAction={confirmDelete}
				loading={deleting}
			/>
		</div>
	);
};

export default CareerPage;

