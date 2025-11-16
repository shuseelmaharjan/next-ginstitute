"use client";

import {
    useState,
    useEffect,
    useCallback,
    FormEvent,
    ChangeEvent,
    DragEvent,
} from "react";
import apiHandler from "@/app/api/apiHandler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Trash2,
    Edit,
    Plus,
    Building2,
    Upload,
    X,
} from "lucide-react";
import { toast } from "@/components/hooks/use-toast";
import {formatDate} from "@/utils/formatDate";

interface Organization {
    id: number;
    organizationName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    registrationNumber: string;
    panNumber: string;
    logo?: string;
    createdAt: string;
    updatedAt: string;
}

interface OrganizationFormData {
    organizationName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    registrationNumber: string;
    panNumber: string;
    logo?: string;
}

const INITIAL_FORM_DATA: OrganizationFormData = {
    organizationName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    registrationNumber: "",
    panNumber: "",
    logo: "",
};

export default function OrganizationPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [formData, setFormData] = useState<OrganizationFormData>(
        INITIAL_FORM_DATA
    );

    const [dragActive, setDragActive] = useState(false);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
    const [logoFile, setLogoFile] = useState<File | null>(null); // Store actual file
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
    const [deleting, setDeleting] = useState(false);

    const canAddNew = organizations.length === 0;

    const resetForm = useCallback(() => {
        if (logoPreviewUrl) {
            URL.revokeObjectURL(logoPreviewUrl);
            setLogoPreviewUrl("");
        }

        setFormData(INITIAL_FORM_DATA);
        setLogoFile(null); // Reset logo file
        setEditingOrg(null);
        setError(null);
    }, [logoPreviewUrl]);

    // ---------- API CALLS ----------

    const fetchOrganizations = useCallback(async () => {
        setLoading(true);
        setError(null);

        const response = await apiHandler<Organization[]>({
            url: "/api/v1/organization",
            method: "GET",
            onError: (message: string) => setError(message),
        });

        if (response.success) {
            setOrganizations(response.data);
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    // Clear error messages after 3s
    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => setError(null), 3000);
        return () => clearTimeout(timer);
    }, [error]);

    // ---------- FORM HANDLERS ----------

    const handleInputChange = (
        field: keyof OrganizationFormData,
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddNew = () => {
        if (!canAddNew) return;
        resetForm();
        setIsDialogOpen(true);
    };

    const handleEdit = (org: Organization) => {
        setEditingOrg(org);
        setFormData({
            organizationName: org.organizationName,
            address: org.address,
            phone: org.phone,
            email: org.email,
            website: org.website,
            registrationNumber: org.registrationNumber,
            panNumber: org.panNumber,
            logo: org.logo || "",
        });

        // Clear any existing preview URL and file when editing
        if (logoPreviewUrl) {
            URL.revokeObjectURL(logoPreviewUrl);
            setLogoPreviewUrl("");
        }
        setLogoFile(null);

        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const url = editingOrg
            ? `/api/v1/organization/${editingOrg.id}`
            : "/api/v1/organization";

        const method = editingOrg ? "PUT" : "POST";

        // Create FormData to handle file upload
        const formDataToSend = new FormData();
        formDataToSend.append("organizationName", formData.organizationName);
        formDataToSend.append("address", formData.address);
        formDataToSend.append("phone", formData.phone);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("website", formData.website);
        formDataToSend.append("registrationNumber", formData.registrationNumber);
        formDataToSend.append("panNumber", formData.panNumber);

        // Add logo file if selected, otherwise include existing logo URL
        if (logoFile) {
            formDataToSend.append("logo", logoFile);
        } else if (formData.logo && !logoFile) {
            // Keep existing logo URL for edit operations
            formDataToSend.append("existingLogo", formData.logo);
        }

        const response = await apiHandler<Organization>({
            url,
            method,
            data: formDataToSend,
            onError: (message: string) => {
                setError(message);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: message,
                });
            },
        });

        if (response.success) {
            toast({
                title: "Success",
                variant: "success",
                description: editingOrg
                    ? "Organization updated successfully!"
                    : "Organization created successfully!"
            });
            setIsDialogOpen(false);
            resetForm();
            await fetchOrganizations();
        }

        setSubmitting(false);
    };

    const confirmDelete = async () => {
        if (!orgToDelete) return;

        setDeleting(true);
        setError(null);

        const response = await apiHandler({
            url: `/api/v1/organization/${orgToDelete.id}`,
            method: "DELETE",
            onError: (message: string) => {
                setError(message);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: message,
                });
            },
        });

        setDeleting(false);

        if (response.success) {
            toast({
                title: "Success",
                variant: "success",
                description: "Organization deleted successfully!"
            });
            await fetchOrganizations();
        }

        setDeleteDialogOpen(false);
        setOrgToDelete(null);
    };

    const handleDeleteClick = (org: Organization) => {
        setOrgToDelete(org);
        setDeleteDialogOpen(true);
    };

    // ---------- LOGO / FILE HANDLING ----------

    const handleFile = (file: File) => {
        // Validate type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError("File size must be less than 2MB");
            return;
        }

        // Create preview URL for immediate display
        const previewUrl = URL.createObjectURL(file);
        setLogoPreviewUrl(previewUrl);

        // Store the actual file object
        setLogoFile(file);

        // Update form data with file name for display purposes
        setFormData((prev) => ({
            ...prev,
            logo: file.name,
        }));
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const removeLogo = () => {
        // Clean up the preview URL to prevent memory leaks
        if (logoPreviewUrl) {
            URL.revokeObjectURL(logoPreviewUrl);
            setLogoPreviewUrl("");
        }

        setLogoFile(null); // Clear the file object
        setFormData((prev) => ({
            ...prev,
            logo: "",
        }));
    };


    return (
        <div className="space-y-6">
            {/* Header + Add button */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Organization Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your organization information. Only one organization record
                        is allowed.
                    </p>
                </div>

                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}
                >
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            onClick={handleAddNew}
                            className={canAddNew ? "flex items-center gap-2" : "hidden"}
                        >
                            <Plus className="h-4 w-4" />
                            Add Organization
                        </Button>
                    </DialogTrigger>


                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingOrg ? "Edit Organization" : "Add New Organization"}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="organizationName">Organization Name *</Label>
                                <Input
                                    id="organizationName"
                                    value={formData.organizationName}
                                    onChange={(e) =>
                                        handleInputChange("organizationName", e.target.value)
                                    }
                                    placeholder="Organization Name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        handleInputChange("email", e.target.value)
                                    }
                                    placeholder="Email"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address *</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) =>
                                        handleInputChange("address", e.target.value)
                                    }
                                    placeholder="Address"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone *</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            handleInputChange("phone", e.target.value)
                                        }
                                        placeholder="Phone"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        value={formData.website}
                                        onChange={(e) =>
                                            handleInputChange("website", e.target.value)
                                        }
                                        placeholder="Website"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="registrationNumber">
                                        Registration Number *
                                    </Label>
                                    <Input
                                        id="registrationNumber"
                                        value={formData.registrationNumber}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "registrationNumber",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Registration Number"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="panNumber">PAN Number *</Label>
                                    <Input
                                        id="panNumber"
                                        value={formData.panNumber}
                                        onChange={(e) =>
                                            handleInputChange("panNumber", e.target.value)
                                        }
                                        placeholder="PAN Number"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="logo">Logo *</Label>
                                    <div
                                        className={`border-dashed border-2 rounded-md p-4 transition-all min-h-[120px] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 ${
                                            dragActive
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-muted-foreground"
                                        }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() =>
                                            document.getElementById("logoUpload")?.click()
                                        }
                                    >
                                        {formData.logo ? (
                                            <div className="flex flex-col items-center gap-3 w-full">
                                                <div className="relative">
                                                    <img
                                                        src={logoPreviewUrl || formData.logo}
                                                        alt="Logo Preview"
                                                        className="h-20 w-20 object-contain rounded-lg border shadow-sm"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = "none";
                                                        }}
                                                    />
                                                </div>

                                                <div className="text-center space-y-2">
                                                    <p className="text-sm font-medium">Logo Preview</p>
                                                    <p className="text-xs text-muted-foreground break-all">
                                                        {formData.logo}
                                                    </p>
                                                    <div className="flex gap-2 justify-center">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                document
                                                                    .getElementById("logoUpload")
                                                                    ?.click();
                                                            }}
                                                            className="whitespace-nowrap"
                                                        >
                                                            <Upload className="h-4 w-4 mr-1" />
                                                            Change
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeLogo();
                                                            }}
                                                            className="whitespace-nowrap text-red-600 hover:text-red-700"
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                <div className="text-center">
                                                    <p className="text-sm font-medium">
                                                        Upload Organization Logo
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Click anywhere here to select an image or drag and drop
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Supports: PNG, JPG, JPEG (Max 2MB)
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <input
                                            id="logoUpload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting
                                        ? "Saving..."
                                        : editingOrg
                                            ? "Update"
                                            : "Create"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Alerts */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Organization List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">
                        Loading organizations...
                    </div>
                </div>
            ) : organizations.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            No Organization Found
                        </h3>
                        <p className="text-muted-foreground text-center mb-4">
                            You haven't added any organization yet. Click the{" "}
                            <span className="font-medium">"Add Organization"</span> button
                            to get started.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {organizations.map((org) => (
                        <Card key={org.id} className="w-full">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        {org.organizationName}
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(org)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteClick(org)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="pb-2 border-b">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Organization Name
                                        </Label>
                                        <p className="text-lg font-semibold">
                                            {org.organizationName}
                                        </p>
                                    </div>

                                    <div className="pb-2 border-b">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Address
                                        </Label>
                                        <p className="text-sm">{org.address}</p>
                                    </div>

                                    <div className="pb-2 border-b">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Email
                                        </Label>
                                        <p className="text-sm">{org.email}</p>
                                    </div>

                                    <div className="pb-2 border-b">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Phone
                                        </Label>
                                        <p className="text-sm">{org.phone}</p>
                                    </div>

                                    <div className="pb-2 border-b">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Website
                                        </Label>
                                        <p className="text-sm">
                                            {org.website || "N/A"}
                                        </p>
                                    </div>

                                    <div className="pb-2 border-b">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Registration Number
                                        </Label>
                                        <p className="text-sm">
                                            {org.registrationNumber}
                                        </p>
                                    </div>

                                    <div className="pb-2 border-b">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            PAN Number
                                        </Label>
                                        <p className="text-sm">{org.panNumber}</p>
                                    </div>

                                    {org.logo && (
                                        <div className="pb-2 border-b">
                                            <Label className="text-xs font-medium text-muted-foreground">
                                                Logo
                                            </Label>
                                            <div className="flex items-center gap-3 mt-2">
                                                <img
                                                    src={org.logo}
                                                    alt="Organization Logo"
                                                    className="h-16 w-16 object-contain rounded-lg border shadow-sm"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Created Date
                                        </Label>
                                        <p className="text-sm">
                                            {formatDate(org.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) setOrgToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Confirm Deletion
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                        {orgToDelete ? (
                            <>
                                Are you sure you want to delete the organization{" "}
                                <span className="font-semibold">
                                    {orgToDelete.organizationName}
                                </span>
                                ? This action cannot be undone.
                            </>
                        ) : (
                            "Are you sure you want to delete this organization? This action cannot be undone."
                        )}
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                if (orgToDelete) confirmDelete();
                            }}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
