"use client";

import * as React from "react";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import apiHandler from "@/app/api/apiHandler";
import {toSentenceCase} from "@/utils/textUtils";
import { toast } from "@/components/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";

type PersonalForm = {
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    dateOfBirth: string; // stored as YYYY-MM-DD
    sex: string;
};

type GuardianForm = {
    fatherName: string;
    motherName: string;
    grandfatherName: string;
    grandmotherName: string;
    guardianName: string;
    guardianContact: string;
    fatherNumber: string;
    motherNumber: string;
    emergencyContact: string;
};

type AddressForm = {
    country: string;
    permanentState: string;
    permanentCity: string;
    permanentLocalGovernment: string;
    permanentWardNumber: string;
    permanentTole: string;
    permanentPostalCode: string;
    tempState: string;
    tempCity: string;
    tempLocalGovernment: string;
    tempWardNumber: string;
    tempTole: string;
    tempPostalCode: string;
};

type DocumentForm = {
    admissionType: "new" | "transferred" | "";
    photo?: File | null;
    birthCertificate?: File | null;
    characterCertificate?: File | null;
    transcript?: File | null;
    application?: File | null;
};

interface AdmissionState {
    personal: PersonalForm;
    guardian: GuardianForm;
    address: AddressForm;
    documents: DocumentForm;
    remark: string;
}

const emptyState: AdmissionState = {
    personal: {
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        dateOfBirth: "",
        sex: "",
    },
    guardian: {
        fatherName: "",
        motherName: "",
        grandfatherName: "",
        grandmotherName: "",
        guardianName: "",
        guardianContact: "",
        fatherNumber: "",
        motherNumber: "",
        emergencyContact: "",
    },
    address: {
        country: "Nepal",
        permanentState: "",
        permanentCity: "",
        permanentLocalGovernment: "",
        permanentWardNumber: "",
        permanentTole: "",
        permanentPostalCode: "",
        tempState: "",
        tempCity: "",
        tempLocalGovernment: "",
        tempWardNumber: "",
        tempTole: "",
        tempPostalCode: "",
    },
    documents: {
        admissionType: "",
        photo: null,
        birthCertificate: null,
        characterCertificate: null,
        transcript: null,
        application: null,
    },
    remark: "",
};

interface Option { label: string; value: string }

export default function AdmissionPage() {
    const [tab, setTab] = React.useState("personal");
    const [data, setData] = React.useState<AdmissionState>(emptyState);
    const [sameAddress, setSameAddress] = React.useState(false);
    const [agree, setAgree] = React.useState(false);
    const [submitStatus, setSubmitStatus] = React.useState<string>("");

    const router = useRouter();

    // Cascading select data
    const [provinces, setProvinces] = React.useState<Option[]>([]);
    const [permDistricts, setPermDistricts] = React.useState<Option[]>([]);
    const [permMunicipals, setPermMunicipals] = React.useState<Option[]>([]);
    const [tempDistricts, setTempDistricts] = React.useState<Option[]>([]);
    const [tempMunicipals, setTempMunicipals] = React.useState<Option[]>([]);

    const loadJSON = React.useCallback(async (path: string) => {
        try {
            const res = await fetch(path);
            if (!res.ok) return [];
            return await res.json();
        } catch {
            return [];
        }
    }, []);

    const slugify = (s: string) =>
        s.toLowerCase().replace(/'/g, "").replace(/\s+/g, "-");

    // Load provinces once
    React.useEffect(() => {
        (async () => {
            const p = await loadJSON("/data/provinces.json");
            setProvinces(p.map((x: string) => ({ label: x, value: x })));
        })();
    }, [loadJSON]);

    // Permanent districts
    React.useEffect(() => {
        if (!data.address.permanentState) return;
        (async () => {
            const ds = await loadJSON(
                `/data/districtsByProvince/${slugify(data.address.permanentState)}.json`
            );
            setPermDistricts(ds.map((x: string) => ({ label: x, value: x })));
        })();
    }, [data.address.permanentState, loadJSON]);

    // Permanent municipals
    React.useEffect(() => {
        if (!data.address.permanentCity) return;
        (async () => {
            const ms = await loadJSON(
                `/data/municipalsByDistrict/${slugify(data.address.permanentCity)}.json`
            );
            setPermMunicipals(ms.map((x: string) => ({ label: x, value: x })));
        })();
    }, [data.address.permanentCity, loadJSON]);

    // Temporary districts
    React.useEffect(() => {
        if (!data.address.tempState) return;
        (async () => {
            const ds = await loadJSON(
                `/data/districtsByProvince/${slugify(data.address.tempState)}.json`
            );
            setTempDistricts(ds.map((x: string) => ({ label: x, value: x })));
        })();
    }, [data.address.tempState, loadJSON]);

    // Temporary municipals
    React.useEffect(() => {
        if (!data.address.tempCity) return;
        (async () => {
            const ms = await loadJSON(
                `/data/municipalsByDistrict/${slugify(data.address.tempCity)}.json`
            );
            setTempMunicipals(ms.map((x: string) => ({ label: x, value: x })));
        })();
    }, [data.address.tempCity, loadJSON]);

    // Copy permanent to temp
    React.useEffect(() => {
        if (sameAddress) {
            setData((prev) => ({
                ...prev,
                address: {
                    ...prev.address,
                    tempState: prev.address.permanentState,
                    tempCity: prev.address.permanentCity,
                    tempLocalGovernment: prev.address.permanentLocalGovernment,
                    tempWardNumber: prev.address.permanentWardNumber,
                    tempTole: prev.address.permanentTole,
                    tempPostalCode: prev.address.permanentPostalCode,
                },
            }));
            // Also fill selects
            setTempDistricts(permDistricts);
            setTempMunicipals(permMunicipals);
        }
    }, [sameAddress, permDistricts, permMunicipals]);

    const updatePersonal = (k: keyof PersonalForm, v: string) =>
        setData((p) => ({ ...p, personal: { ...p.personal, [k]: v } }));
    const updateGuardian = (k: keyof GuardianForm, v: string) =>
        setData((p) => ({ ...p, guardian: { ...p.guardian, [k]: v } }));
    const updateAddress = (k: keyof AddressForm, v: string) =>
        setData((p) => ({ ...p, address: { ...p.address, [k]: v } }));
    const updateDocs = (k: keyof DocumentForm, v: File | string | null) =>
        setData((p) => ({
            ...p,
            documents: { ...p.documents, [k]: v },
        }));
    const updateRemark = (v: string) =>
        setData((p) => ({ ...p, remark: v }));

    // Validation helpers
    const isPersonalFilled = [
        data.personal.firstName,
        data.personal.lastName,
        data.personal.email,
        data.personal.dateOfBirth,
        data.personal.sex,
    ].every(Boolean);

    const isGuardianFilled = [
        data.guardian.fatherName,
        data.guardian.motherName,
        data.guardian.grandfatherName,
        data.guardian.fatherNumber,
        data.guardian.motherNumber,
        data.guardian.guardianName,
        data.guardian.guardianContact,
        data.guardian.emergencyContact,
    ].every(Boolean);

    const isAddressFilled = [
        data.address.permanentState,
        data.address.permanentCity,
        data.address.permanentLocalGovernment,
        data.address.permanentWardNumber,
        data.address.permanentTole,
        data.address.permanentPostalCode,
        data.address.tempState,
        data.address.tempCity,
        data.address.tempLocalGovernment,
        data.address.tempWardNumber,
        data.address.tempTole,
        data.address.tempPostalCode,
    ].every(Boolean);

    const isDocumentsFilled =
        data.documents.admissionType === "new"
            ? !!data.documents.photo && !!data.documents.birthCertificate
            : data.documents.admissionType === "transferred"
                ? !!data.documents.photo &&
                !!data.documents.birthCertificate &&
                !!data.documents.characterCertificate &&
                !!data.documents.transcript &&
                !!data.documents.application
                : false;

    const isPreviewReady =
        isPersonalFilled &&
        isGuardianFilled &&
        isAddressFilled &&
        isDocumentsFilled &&
        data.remark &&
        agree;

    // Tab color fill logic
    const tabStatus = {
        personal: isPersonalFilled,
        guardian: isGuardianFilled,
        address: isAddressFilled,
        documents: isDocumentsFilled,
        preview: isPreviewReady,
    };

    // Tab disabling logic
    const tabDisabled = {
        personal: false,
        guardian: !isPersonalFilled,
        address: !isGuardianFilled,
        documents: !isAddressFilled,
        preview: !isDocumentsFilled,
    };

    // Tab order
    const order = ["personal", "guardian", "address", "documents", "preview"];

    const next = () => {
        const idx = order.indexOf(tab);
        if (tab === "guardian" && !isGuardianFilled) return;
        if (tab === "address" && !isAddressFilled) return;
        if (tab === "documents" && !isDocumentsFilled) return;
        if (idx < order.length - 1) setTab(order[idx + 1]);
    };
    const back = () => {
        const idx = order.indexOf(tab);
        if (idx > 0) setTab(order[idx - 1]);
    };

    function validatePhone(number: string) {
        if (!number) return false;
        return /^(98|97)\d{8}$/.test(number) || /^01\d{7}$/.test(number);
    }

    const validateAllPhones = () => {
        const phoneFields = [
            data.guardian.fatherNumber,
            data.guardian.motherNumber,
            data.guardian.guardianContact,
            data.guardian.emergencyContact,
        ];
        for (const num of phoneFields) {
            if (!validatePhone(num)) return false;
        }
        return true;
    };

    const submit = async () => {
        setSubmitStatus("");
        if (!validateAllPhones()) {
            toast({
                title: "Invalid Phone Number",
                description:
                    "All contact numbers must be valid: 98/97XXXXXXXX (10 digits) or 01XXXXXXX (9 digits)",
                variant: "destructive",
            });
            return;
        }
        try {
            const formData = new FormData();
            // Personal
            Object.entries(data.personal).forEach(([k, v]) => formData.append(k, v));
            // Guardian
            Object.entries(data.guardian).forEach(([k, v]) => formData.append(k, v));
            // Address
            Object.entries(data.address).forEach(([k, v]) => formData.append(k, v));
            // Documents
            formData.append("admissionType", data.documents.admissionType);
            if (data.documents.photo) formData.append("photo", data.documents.photo);
            if (data.documents.birthCertificate) formData.append("birthCertificate", data.documents.birthCertificate);
            if (data.documents.admissionType === "transferred") {
                if (data.documents.characterCertificate) formData.append("characterCertificate", data.documents.characterCertificate);
                if (data.documents.transcript) formData.append("transcript", data.documents.transcript);
                if (data.documents.application) formData.append("application", data.documents.application);
            }
            // Remark
            formData.append("remark", data.remark);
            // Role
            formData.append("role", "teacher");
            await apiHandler({
                url: "/api/v1/users/create-with-documents",
                method: "POST",
                data: formData,
            });
            toast({
                title: "Success",
                description: "Teacher registered successfully!",
                variant: "success",
            });
            router.push("/users/pending-approvals");
        } catch (err: unknown) {
            let description = "Could not register teacher.";
            if (err instanceof Error) description = err.message;
            toast({
                title: "Submission failed",
                description,
                variant: "destructive",
            });
        }
    };

    // Tab trigger with color fill
    function TabTrigger({
                            value,
                            children,
                            disabled,
                        }: {
        value: string;
        children: React.ReactNode;
        disabled?: boolean;
    }) {
        return (
            <TabsTrigger
                value={value}
                disabled={disabled}
                className={
                    tabStatus[value as keyof typeof tabStatus]
                        ? "bg-green-100 border-green-500"
                        : ""
                }
            >
                {children}
            </TabsTrigger>
        );
    }

    // Reusable DatePicker component for Date of Birth
    function DatePicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
        const [open, setOpen] = React.useState(false);
        const date = value ? new Date(value + "T00:00:00") : undefined;

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="dateOfBirth"
                        className="w-full justify-between font-normal"
                    >
                        {date ? date.toLocaleDateString() : "Select date"}
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-2 w-auto">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={(d) => {
                            if (d) {
                                const iso = d.toISOString().split("T")[0];
                                onChange(iso);
                            }
                            setOpen(false);
                        }}
                    />
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster />
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Teacher Enrollment</h2>
                <p className="text-muted-foreground">
                    Please fill all required fields step by step for new enrollment.
                </p>
            </div>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>New Enrollment Form</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={tab} onValueChange={setTab} className="w-full">
                        <TabsList className="w-full overflow-x-auto justify-start gap-2 flex-wrap">
                            <TabTrigger value="personal" disabled={tabDisabled.personal}>
                                Personal
                            </TabTrigger>
                            <TabTrigger value="guardian" disabled={tabDisabled.guardian}>
                                Family
                            </TabTrigger>
                            <TabTrigger value="address" disabled={tabDisabled.address}>
                                Address
                            </TabTrigger>
                            <TabTrigger value="documents" disabled={tabDisabled.documents}>
                                Documents
                            </TabTrigger>
                            <TabTrigger value="preview" disabled={tabDisabled.preview}>
                                Preview
                            </TabTrigger>
                        </TabsList>

                        {/* PERSONAL */}
                        <TabsContent value="personal" className="pt-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <Field label="First Name" required>
                                    <Input
                                        placeholder="Enter your first name"
                                        value={data.personal.firstName}
                                        onChange={(e) => updatePersonal("firstName", e.target.value)}
                                    />
                                </Field>
                                <Field label="Middle Name">
                                    <Input
                                        placeholder="Enter your middle name"
                                        value={data.personal.middleName}
                                        onChange={(e) => updatePersonal("middleName", e.target.value)}
                                    />
                                </Field>
                                <Field label="Last Name" required>
                                    <Input
                                        placeholder="Enter your last name"
                                        value={data.personal.lastName}
                                        onChange={(e) => updatePersonal("lastName", e.target.value)}
                                    />
                                </Field>
                                <Field label="Email" required>
                                    <Input
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={data.personal.email}
                                        onChange={(e) => updatePersonal("email", e.target.value)}
                                    />
                                </Field>
                                <Field label="Date of Birth" required>
                                    {/* Replaced native date input with DatePicker */}
                                    <DatePicker
                                        value={data.personal.dateOfBirth}
                                        onChange={(val) => updatePersonal("dateOfBirth", val)}
                                    />
                                </Field>
                                <Field label="Sex" required>
                                    <Select
                                        value={data.personal.sex}
                                        onValueChange={(val) => updatePersonal("sex", val)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Sex" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button
                                    type="button"
                                    onClick={next}
                                    disabled={!isPersonalFilled}
                                >
                                    Next
                                </Button>
                            </div>
                        </TabsContent>

                        {/* GUARDIAN */}
                        <TabsContent value="guardian" className="pt-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <Field label="Father Name" required>
                                    <Input
                                        placeholder="Enter father's name"
                                        value={data.guardian.fatherName}
                                        onChange={(e) => updateGuardian("fatherName", e.target.value)}
                                    />
                                </Field>
                                <Field label="Mother Name" required>
                                    <Input
                                        placeholder="Enter mother's name"
                                        value={data.guardian.motherName}
                                        onChange={(e) => updateGuardian("motherName", e.target.value)}
                                    />
                                </Field>
                                <Field label="Grandfather Name" required>
                                    <Input
                                        placeholder="Enter grandfather's name"
                                        value={data.guardian.grandfatherName}
                                        onChange={(e) => updateGuardian("grandfatherName", e.target.value)}
                                    />
                                </Field>
                                <Field label="Grandmother Name">
                                    <Input
                                        placeholder="Enter grandmother's name (optional)"
                                        value={data.guardian.grandmotherName}
                                        onChange={(e) => updateGuardian("grandmotherName", e.target.value)}
                                    />
                                </Field>
                                <Field label="Guardian Name" required>
                                    <Input
                                        placeholder="Enter guardian's name"
                                        value={data.guardian.guardianName}
                                        onChange={(e) => updateGuardian("guardianName", e.target.value)}
                                    />
                                </Field>
                                <Field label="Guardian Contact" required>
                                    <Input
                                        placeholder="Enter guardian's contact number"
                                        value={data.guardian.guardianContact}
                                        onChange={(e) => updateGuardian("guardianContact", e.target.value)}
                                    />
                                </Field>
                                <Field label="Father Number" required>
                                    <Input
                                        placeholder="Enter father's contact number"
                                        value={data.guardian.fatherNumber}
                                        onChange={(e) => updateGuardian("fatherNumber", e.target.value)}
                                    />
                                </Field>
                                <Field label="Mother Number" required>
                                    <Input
                                        placeholder="Enter mother's contact number"
                                        value={data.guardian.motherNumber}
                                        onChange={(e) => updateGuardian("motherNumber", e.target.value)}
                                    />
                                </Field>
                                <Field label="Emergency Contact" required>
                                    <Input
                                        placeholder="Enter emergency contact number"
                                        value={data.guardian.emergencyContact}
                                        onChange={(e) => updateGuardian("emergencyContact", e.target.value)}
                                    />
                                </Field>
                            </div>
                            <div className="flex gap-2 justify-between pt-4">
                                <Button variant="outline" type="button" onClick={back}>
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={next}
                                    disabled={!isGuardianFilled}
                                >
                                    Next
                                </Button>
                            </div>
                        </TabsContent>

                        {/* ADDRESS */}
                        <TabsContent value="address" className="pt-4">
                            <div className="space-y-6">
                                <SectionTitle title="Permanent Address" />
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label="Country" required className="md:col-span-3">
                                        <Select
                                            disabled
                                            value={data.address.country}
                                            onValueChange={(val) => updateAddress("country", val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Nepal">Nepal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Province (State)" required>
                                        <Select
                                            value={data.address.permanentState}
                                            onValueChange={(val) => updateAddress("permanentState", val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Province" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {provinces.map((p) => (
                                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="District (City)" required>
                                        <Select
                                            value={data.address.permanentCity}
                                            onValueChange={(val) => updateAddress("permanentCity", val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select District" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {permDistricts.map((d) => (
                                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Local Government (Municipality)" required>
                                        <Select
                                            value={data.address.permanentLocalGovernment}
                                            onValueChange={(val) => updateAddress("permanentLocalGovernment", val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Municipality" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {permMunicipals.map((m) => (
                                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Ward No." required>
                                        <Input
                                            placeholder="Enter ward number"
                                            value={data.address.permanentWardNumber}
                                            onChange={(e) =>
                                                updateAddress("permanentWardNumber", e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field label="Tole" required>
                                        <Input
                                            placeholder="Enter tole"
                                            value={data.address.permanentTole}
                                            onChange={(e) =>
                                                updateAddress("permanentTole", e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field label="Postal Code" required>
                                        <Input
                                            placeholder="Enter postal code"
                                            value={data.address.permanentPostalCode}
                                            onChange={(e) =>
                                                updateAddress("permanentPostalCode", e.target.value)
                                            }
                                        />
                                    </Field>
                                </div>

                                <Separator />

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="sameAddress"
                                        checked={sameAddress}
                                        onCheckedChange={(c) => setSameAddress(Boolean(c))}
                                    />
                                    <Label
                                        htmlFor="sameAddress"
                                        className="cursor-pointer text-sm font-medium"
                                    >
                                        Same as permanent address
                                    </Label>
                                </div>

                                <SectionTitle title="Temporary Address" />
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label="Province (State)" required>
                                        <Select
                                            disabled={sameAddress}
                                            value={data.address.tempState}
                                            onValueChange={(val) => updateAddress("tempState", val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Province" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {provinces.map((p) => (
                                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="District (City)" required>
                                        <Select
                                            disabled={sameAddress}
                                            value={data.address.tempCity}
                                            onValueChange={(val) => updateAddress("tempCity", val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select District" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {tempDistricts.map((d) => (
                                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Local Government (Municipality)" required>
                                        <Select
                                            disabled={sameAddress}
                                            value={data.address.tempLocalGovernment}
                                            onValueChange={(val) => updateAddress("tempLocalGovernment", val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Municipality" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {tempMunicipals.map((m) => (
                                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Ward No." required>
                                        <Input
                                            disabled={sameAddress}
                                            placeholder="Enter ward number"
                                            value={data.address.tempWardNumber}
                                            onChange={(e) =>
                                                updateAddress("tempWardNumber", e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field label="Tole" required>
                                        <Input
                                            disabled={sameAddress}
                                            placeholder="Enter tole"
                                            value={data.address.tempTole}
                                            onChange={(e) =>
                                                updateAddress("tempTole", e.target.value)
                                            }
                                        />
                                    </Field>
                                    <Field label="Postal Code" required>
                                        <Input
                                            disabled={sameAddress}
                                            placeholder="Enter postal code"
                                            value={data.address.tempPostalCode}
                                            onChange={(e) =>
                                                updateAddress("tempPostalCode", e.target.value)
                                            }
                                        />
                                    </Field>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-between pt-4">
                                <Button variant="outline" type="button" onClick={back}>
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={next}
                                    disabled={!isAddressFilled}
                                >
                                    Next
                                </Button>
                            </div>
                        </TabsContent>

                        {/* DOCUMENTS */}
                        <TabsContent value="documents" className="pt-4">
                            <div className="grid gap-6">
                                <Field label="Admission Type" required>
                                    <Select
                                        value={data.documents.admissionType}
                                        onValueChange={(val) =>
                                            updateDocs("admissionType", val as "new" | "transferred")
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Admission Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="new">New</SelectItem>
                                                <SelectItem value="transferred">Transferred</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>
                                {data.documents.admissionType && (
                                    <>
                                        <Field label="Photo" required>
                                            <Input
                                                type="file"
                                                accept=".jpg,.jpeg,.png"
                                                onChange={(e) =>
                                                    updateDocs("photo", e.target.files?.[0] || null)
                                                }
                                            />
                                            {data.documents.photo && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={URL.createObjectURL(data.documents.photo)}
                                                    alt="Photo Preview"
                                                    className="mt-2 h-20 w-20 object-cover border"
                                                />
                                            )}
                                        </Field>
                                        <Field label="Birth Certificate" required>
                                            <Input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                onChange={(e) =>
                                                    updateDocs("birthCertificate", e.target.files?.[0] || null)
                                                }
                                            />
                                            {data.documents.birthCertificate && (
                                                <div className="mt-2">
                                                    {data.documents.birthCertificate.type.startsWith("image") ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={URL.createObjectURL(data.documents.birthCertificate)}
                                                            alt="Birth Certificate Preview"
                                                            className="h-20 w-20 object-cover border"
                                                        />
                                                    ) : (
                                                        <span className="text-xs">{data.documents.birthCertificate.name}</span>
                                                    )}
                                                </div>
                                            )}
                                        </Field>
                                    </>
                                )}
                                {data.documents.admissionType === "transferred" && (
                                    <>
                                        <Field label="Character Certificate" required>
                                            <Input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                onChange={(e) =>
                                                    updateDocs("characterCertificate", e.target.files?.[0] || null)
                                                }
                                            />
                                            {data.documents.characterCertificate && (
                                                <div className="mt-2">
                                                    {data.documents.characterCertificate.type.startsWith("image") ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={URL.createObjectURL(data.documents.characterCertificate)}
                                                            alt="Character Certificate Preview"
                                                            className="h-20 w-20 object-cover border"
                                                        />
                                                    ) : (
                                                        <span className="text-xs">{data.documents.characterCertificate.name}</span>
                                                    )}
                                                </div>
                                            )}
                                        </Field>
                                        <Field label="Transcript" required>
                                            <Input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                onChange={(e) =>
                                                    updateDocs("transcript", e.target.files?.[0] || null)
                                                }
                                            />
                                            {data.documents.transcript && (
                                                <div className="mt-2">
                                                    {data.documents.transcript.type.startsWith("image") ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={URL.createObjectURL(data.documents.transcript)}
                                                            alt="Transcript Preview"
                                                            className="h-20 w-20 object-cover border"
                                                        />
                                                    ) : (
                                                        <span className="text-xs">{data.documents.transcript.name}</span>
                                                    )}
                                                </div>
                                            )}
                                        </Field>
                                        <Field label="Application" required>
                                            <Input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                onChange={(e) =>
                                                    updateDocs("application", e.target.files?.[0] || null)
                                                }
                                            />
                                            {data.documents.application && (
                                                <div className="mt-2">
                                                    {data.documents.application.type.startsWith("image") ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={URL.createObjectURL(data.documents.application)}
                                                            alt="Application Preview"
                                                            className="h-20 w-20 object-cover border"
                                                        />
                                                    ) : (
                                                        <span className="text-xs">{data.documents.application.name}</span>
                                                    )}
                                                </div>
                                            )}
                                        </Field>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2 justify-between pt-4">
                                <Button variant="outline" type="button" onClick={back}>
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={next}
                                    disabled={!isDocumentsFilled}
                                >
                                    Next
                                </Button>
                            </div>
                        </TabsContent>

                        {/* PREVIEW */}
                        <TabsContent value="preview" className="pt-4">
                            <div>
                                <PreviewBlock title="Personal">
                                    <GridPair label="First Name" value={data.personal.firstName} />
                                    <GridPair label="Middle Name" value={data.personal.middleName} />
                                    <GridPair label="Last Name" value={data.personal.lastName} />
                                    <GridPair label="Email" value={data.personal.email} />
                                    <GridPair label="Date of Birth" value={data.personal.dateOfBirth} />
                                    <GridPair label="Sex" value={toSentenceCase(data.personal.sex)} />
                                </PreviewBlock>
                                <PreviewBlock title="Guardian">
                                    <GridPair label="Father Name" value={data.guardian.fatherName} />
                                    <GridPair label="Mother Name" value={data.guardian.motherName} />
                                    <GridPair label="Grandfather Name" value={data.guardian.grandfatherName} />
                                    <GridPair label="Grandmother Name" value={data.guardian.grandmotherName} />
                                    <GridPair label="Guardian Name" value={data.guardian.guardianName} />
                                    <GridPair label="Guardian Contact" value={data.guardian.guardianContact} />
                                    <GridPair label="Father Number" value={data.guardian.fatherNumber} />
                                    <GridPair label="Mother Number" value={data.guardian.motherNumber} />
                                    <GridPair label="Emergency Contact" value={data.guardian.emergencyContact} />
                                </PreviewBlock>
                                <PreviewBlock title="Permanent Address">
                                    <GridPair label="Province" value={data.address.permanentState} />
                                    <GridPair label="District" value={data.address.permanentCity} />
                                    <GridPair label="Municipality" value={data.address.permanentLocalGovernment} />
                                    <GridPair label="Ward" value={data.address.permanentWardNumber} />
                                    <GridPair label="Tole" value={data.address.permanentTole} />
                                    <GridPair label="Postal Code" value={data.address.permanentPostalCode} />
                                </PreviewBlock>
                                <PreviewBlock title="Temporary Address">
                                    <GridPair label="Province" value={data.address.tempState} />
                                    <GridPair label="District" value={data.address.tempCity} />
                                    <GridPair label="Municipality" value={data.address.tempLocalGovernment} />
                                    <GridPair label="Ward" value={data.address.tempWardNumber} />
                                    <GridPair label="Tole" value={data.address.tempTole} />
                                    <GridPair label="Postal Code" value={data.address.tempPostalCode} />
                                </PreviewBlock>
                                <PreviewBlock title="Documents">
                                    <div>
                                        <GridPair
                                            label="Admission Type"
                                            value={data.documents.admissionType}
                                        />
                                        <div className="flex flex-col gap-2 mt-2">
                                            <div>
                                                <span className="font-semibold text-xs">Photo:</span>
                                                <div className="flex items-center gap-2">
                                                    {data.documents.photo ? (
                                                        <>
                                                            <span className="text-xs">{data.documents.photo.name}</span>
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={URL.createObjectURL(data.documents.photo)}
                                                                alt="Photo Preview"
                                                                className="h-12 w-12 object-cover border"
                                                            />
                                                        </>
                                                    ) : (
                                                        <span className="text-xs">-</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-xs">Birth Certificate:</span>
                                                <div className="flex items-center gap-2">
                                                    {data.documents.birthCertificate ? (
                                                        <>
                                                            <span className="text-xs">{data.documents.birthCertificate.name}</span>
                                                            {data.documents.birthCertificate.type.startsWith("image") ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={URL.createObjectURL(data.documents.birthCertificate)}
                                                                    alt="Birth Certificate Preview"
                                                                    className="h-12 w-12 object-cover border"
                                                                />
                                                            ) : (
                                                                <span className="text-xs">PDF</span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-xs">-</span>
                                                    )}
                                                </div>
                                            </div>
                                            {data.documents.admissionType === "transferred" && (
                                                <>
                                                    <div>
                                                        <span className="font-semibold text-xs">Character Certificate:</span>
                                                        <div className="flex items-center gap-2">
                                                            {data.documents.characterCertificate ? (
                                                                <>
                                                                    <span className="text-xs">{data.documents.characterCertificate.name}</span>
                                                                    {data.documents.characterCertificate.type.startsWith("image") ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img
                                                                            src={URL.createObjectURL(data.documents.characterCertificate)}
                                                                            alt="Character Certificate Preview"
                                                                            className="h-12 w-12 object-cover border"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-xs">PDF</span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-xs">-</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-xs">Transcript:</span>
                                                        <div className="flex items-center gap-2">
                                                            {data.documents.transcript ? (
                                                                <>
                                                                    <span className="text-xs">{data.documents.transcript.name}</span>
                                                                    {data.documents.transcript.type.startsWith("image") ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img
                                                                            src={URL.createObjectURL(data.documents.transcript)}
                                                                            alt="Transcript Preview"
                                                                            className="h-12 w-12 object-cover border"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-xs">PDF</span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-xs">-</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-xs">Application:</span>
                                                        <div className="flex items-center gap-2">
                                                            {data.documents.application ? (
                                                                <>
                                                                    <span className="text-xs">{data.documents.application.name}</span>
                                                                    {data.documents.application.type.startsWith("image") ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img
                                                                            src={URL.createObjectURL(data.documents.application)}
                                                                            alt="Application Preview"
                                                                            className="h-12 w-12 object-cover border"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-xs">PDF</span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-xs">-</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </PreviewBlock>
                                <PreviewBlock title="Remark">
                                    <GridPair label="Remark" value={data.remark} />
                                </PreviewBlock>
                            </div>
                            <div className="mt-4">
                                <Field label="Remark" required>
                                    <Input
                                        placeholder="Enter any remarks"
                                        value={data.remark}
                                        onChange={(e) => updateRemark(e.target.value)}
                                    />
                                </Field>
                                <div className="flex items-center gap-2 mt-4">
                                    <Checkbox
                                        id="agree"
                                        checked={agree}
                                        onCheckedChange={(c) => setAgree(Boolean(c))}
                                    />
                                    <Label htmlFor="agree" className="cursor-pointer text-sm font-medium">
                                        I agree that the above information is correct.
                                    </Label>
                                </div>
                                <div className="flex gap-2 justify-between pt-4">
                                    <Button variant="outline" type="button" onClick={back}>
                                        Back
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={submit}
                                        disabled={!isPreviewReady}
                                    >
                                        Submit
                                    </Button>
                                </div>
                            </div>
                            {tab === "preview" && submitStatus && (
                                <div className="mt-4 text-center text-red-500">{submitStatus}</div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

/* Reusable small components */

function Field(
    props: React.PropsWithChildren<{
        label: string;
        required?: boolean;
        className?: string;
    }>
) {
    return (
        <div className={props.className}>
            <Label className="text-xs font-medium">
                {props.label} {props.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="mt-1">{props.children}</div>
        </div>
    );
}

function SectionTitle({ title }: { title: string }) {
    return <h4 className="text-sm font-semibold">{title}</h4>;
}

function PreviewBlock(props: React.PropsWithChildren<{ title: string }>) {
    return (
        <div className="mb-6">
            <h5 className="text-sm font-semibold mb-2">{props.title}</h5>
            <div className="grid gap-2 text-xs md:grid-cols-3">{props.children}</div>
        </div>
    );
}

function GridPair({ label, value }: { label: string; value?: string }) {
    return (
        <div className="rounded border p-2">
            <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
            <div className="text-xs font-medium break-words">{value || "-"}</div>
        </div>
    );
}
