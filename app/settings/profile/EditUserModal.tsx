"use client";
import { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { updateUser, fetchFullUser } from '@/app/services/userService';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthenticate } from '@/app/context/AuthenticateContext';
import { toast } from "@/components/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface EditUserModalProps {
    onUpdated?: (data: Record<string, unknown>) => void;
}

// Define a narrow form shape (fields are strings or undefined)
type UserForm = {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    dateOfBirth?: string;
    sex?: string;
    fatherName?: string;
    motherName?: string;
    grandfatherName?: string;
    grandmotherName?: string;
    guardianName?: string;
    guardianContact?: string;
    fatherNumber?: string;
    motherNumber?: string;
    emergencyContact?: string;
    country?: string;
    permanentState?: string;
    permanentCity?: string;
    permanentLocalGovernment?: string;
    permanentWardNumber?: string;
    permanentTole?: string;
    permanentPostalCode?: string;
    tempState?: string;
    tempCity?: string;
    tempLocalGovernment?: string;
    tempWardNumber?: string;
    tempTole?: string;
    tempPostalCode?: string;
    [key: string]: string | undefined;
};

// Simple date input fallback; integrate shadcn calendar later if installed
export function EditUserModal({ onUpdated }: EditUserModalProps) {
    const { user } = useAuthenticate();
    const userId = user?.id;
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState<Record<string, unknown> | null>(null);
    const [form, setForm] = useState<UserForm>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    // Dedicated state for date selection to avoid race conditions with popover open/close.
    const [selectedDob, setSelectedDob] = useState<Date | undefined>(undefined);
    // Controlled open state for DOB popover to stop it from closing on internal clicks
    const [dobOpen, setDobOpen] = useState(false);

    const role = user?.role;
    const canAdminEdit = role === 'admin' || role === 'superadmin';

    // Fields allowed for everyone (temp address + basic personal subset), full set limited by role.
    const baseEditable = new Set([
        'firstName', 'middleName', 'lastName', 'email', 'dateOfBirth', 'sex',
        'tempState', 'tempCity', 'tempLocalGovernment', 'tempWardNumber', 'tempTole', 'tempPostalCode',
        'country'
    ]);
    const adminExtra = [
        'fatherName', 'motherName', 'grandfatherName', 'grandmotherName', 'guardianName', 'guardianContact', 'fatherNumber', 'motherNumber', 'emergencyContact',
        'permanentState', 'permanentCity', 'permanentLocalGovernment', 'permanentWardNumber', 'permanentTole', 'permanentPostalCode'
    ];
    if (canAdminEdit) adminExtra.forEach(f => baseEditable.add(f));

    const isFieldEditable = (f: string) => baseEditable.has(f);

    // Address option lists
    const [provinces, setProvinces] = useState<string[]>([]);
    const [permDistricts, setPermDistricts] = useState<string[]>([]);
    const [permMunicipals, setPermMunicipals] = useState<string[]>([]);
    const [tempDistricts, setTempDistricts] = useState<string[]>([]);
    const [tempMunicipals, setTempMunicipals] = useState<string[]>([]);

    // Simple cache to avoid refetching static JSON
    const globalWithCache = globalThis as unknown as { __npDataCache?: Map<string, unknown> };
    const dataCache = globalWithCache.__npDataCache ?? new Map<string, unknown>();
    globalWithCache.__npDataCache = dataCache;

    const slugify = (s: string) =>
        s
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-');

    const loadJSON = async (path: string): Promise<unknown | null> => {
         if (dataCache.has(path)) return dataCache.get(path) ?? null;
         try {
             const res = await fetch(path, { cache: 'force-cache' });
             if (!res.ok) return null;
             const json = await res.json();
             dataCache.set(path, json as unknown);
             return json as unknown;
         } catch {
             return null;
         }
     };

    useEffect(() => {
        if (open && userId) {
            (async () => {
                setLoading(true);
                setError(null);
                try {
                    const res = await fetchFullUser(userId);
                    if (res.success) {
                        setInitialData(res.data as Record<string, unknown>);
                        setForm({
                            firstName: res.data.firstName || '',
                            middleName: res.data.middleName || '',
                            lastName: res.data.lastName || '',
                            email: res.data.email || '',
                            dateOfBirth: res.data.dateOfBirth || '',
                            sex: res.data.sex || 'male',
                            fatherName: res.data.fatherName || '',
                            motherName: res.data.motherName || '',
                            grandfatherName: res.data.grandfatherName || '',
                            grandmotherName: res.data.grandmotherName || '',
                            guardianName: res.data.guardianName || '',
                            guardianContact: res.data.guardianContact || '',
                            fatherNumber: res.data.fatherNumber || '',
                            motherNumber: res.data.motherNumber || '',
                            emergencyContact: res.data.emergencyContact || '',
                            country: res.data.country || 'Nepal',
                            permanentState: res.data.permanentState || '',
                            permanentCity: res.data.permanentCity || '',
                            permanentLocalGovernment: res.data.permanentLocalGovernment || '',
                            permanentWardNumber: res.data.permanentWardNumber || '',
                            permanentTole: res.data.permanentTole || '',
                            permanentPostalCode: res.data.permanentPostalCode || '',
                            tempState: res.data.tempState || '',
                            tempCity: res.data.tempCity || '',
                            tempLocalGovernment: res.data.tempLocalGovernment || '',
                            tempWardNumber: res.data.tempWardNumber || '',
                            tempTole: res.data.tempTole || '',
                            tempPostalCode: res.data.tempPostalCode || ''
                        } as UserForm);
                    } else {
                        const msg = (res.message as string) || 'Failed to load user';
                        setError(msg);
                        toast({ title: 'Load Failed', description: msg, variant: 'destructive' });
                    }
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    setError(msg);
                    toast({ title: 'Load Error', description: msg, variant: 'destructive' });
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [open, userId]);

    const handleChange = (field: string, value: string) => {
        if (!isFieldEditable(field)) return; // ignore disallowed edits
        setForm((prev: UserForm) => {
            const next: UserForm = { ...prev, [field]: value };
            // Clear dependent fields only on explicit user changes
            if (field === 'permanentState') {
                next.permanentCity = '';
                next.permanentLocalGovernment = '';
            }
            if (field === 'permanentCity') {
                next.permanentLocalGovernment = '';
            }
            if (field === 'tempState') {
                next.tempCity = '';
                next.tempLocalGovernment = '';
            }
            if (field === 'tempCity') {
                next.tempLocalGovernment = '';
            }
            return next;
        });
        setFieldErrors(prev => ({ ...prev, [field]: '' }));
    };

    // Load provinces when modal opens
    useEffect(() => {
        if (!open) return;
        (async () => {
            const prov = await loadJSON('/data/provinces.json');
            if (Array.isArray(prov)) setProvinces(prov as string[]);
            // Preload dependent lists when initial values exist
            const pState = form.permanentState;
            const tState = form.tempState;
            if (pState) {
                const districts = await loadJSON(`/data/districtsByProvince/${slugify(pState)}.json`);
                if (Array.isArray(districts)) setPermDistricts(districts as string[]);
                if (form.permanentCity) {
                    const mun = await loadJSON(`/data/municipalsByDistrict/${slugify(form.permanentCity)}.json`);
                    if (Array.isArray(mun)) setPermMunicipals(mun as string[]);
                }
            }
            if (tState) {
                const districts = await loadJSON(`/data/districtsByProvince/${slugify(tState)}.json`);
                if (Array.isArray(districts)) setTempDistricts(districts as string[]);
                if (form.tempCity) {
                    const mun = await loadJSON(`/data/municipalsByDistrict/${slugify(form.tempCity)}.json`);
                    if (Array.isArray(mun)) setTempMunicipals(mun as string[]);
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // When permanent province changes -> load districts (do not reset if initial hydration handled elsewhere)
    useEffect(() => {
        if (!form.permanentState) { setPermDistricts([]); setPermMunicipals([]); return; }
        (async () => {
            const state = form.permanentState; if (!state) return;
            const districts = await loadJSON(`/data/districtsByProvince/${slugify(state)}.json`);
            setPermDistricts(Array.isArray(districts) ? districts : []);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.permanentState]);

    // When permanent district changes -> load municipals (do not reset if initial hydration)
    useEffect(() => {
        if (!form.permanentCity) { setPermMunicipals([]); return; }
        (async () => {
            const city = form.permanentCity; if (!city) return;
            const mun = await loadJSON(`/data/municipalsByDistrict/${slugify(city)}.json`);
            setPermMunicipals(Array.isArray(mun) ? mun : []);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.permanentCity]);

    // Temp address: province change
    useEffect(() => {
        if (!form.tempState) { setTempDistricts([]); setTempMunicipals([]); return; }
        (async () => {
            const state = form.tempState; if (!state) return;
            const districts = await loadJSON(`/data/districtsByProvince/${slugify(state)}.json`);
            setTempDistricts(Array.isArray(districts) ? districts : []);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.tempState]);

    // Temp address: district change
    useEffect(() => {
        if (!form.tempCity) { setTempMunicipals([]); return; }
        (async () => {
            const city = form.tempCity; if (!city) return;
            const mun = await loadJSON(`/data/municipalsByDistrict/${slugify(city)}.json`);
            setTempMunicipals(Array.isArray(mun) ? mun : []);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.tempCity]);

    // Hydration effect: after initial user data arrives, ensure dependent lists are loaded once
    useEffect(() => {
        if (!open || !initialData) return;
        (async () => {
            if (form.permanentState && permDistricts.length === 0) {
                const districts = await loadJSON(`/data/districtsByProvince/${slugify(form.permanentState)}.json`);
                if (Array.isArray(districts)) setPermDistricts(districts);
            }
            if (form.permanentCity && permMunicipals.length === 0) {
                const mun = await loadJSON(`/data/municipalsByDistrict/${slugify(form.permanentCity)}.json`);
                if (Array.isArray(mun)) setPermMunicipals(mun);
            }
            if (form.tempState && tempDistricts.length === 0) {
                const districts = await loadJSON(`/data/districtsByProvince/${slugify(form.tempState)}.json`);
                if (Array.isArray(districts)) setTempDistricts(districts);
            }
            if (form.tempCity && tempMunicipals.length === 0) {
                const mun = await loadJSON(`/data/municipalsByDistrict/${slugify(form.tempCity)}.json`);
                if (Array.isArray(mun)) setTempMunicipals(mun);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, open]);

    const validate = () => {
        const errs: Record<string, string> = {};
        // Required (cannot be empty) except middleName & optional guardian fields if not editing? Provided spec: none null except middleName.
        const requiredAlways = ['firstName', 'lastName', 'email', 'sex'];
        requiredAlways.forEach(f => { if (!form[f] || !String(form[f]).trim()) errs[f] = 'Required'; });

        if (canAdminEdit) {
            const permReq = ['permanentState', 'permanentCity', 'permanentLocalGovernment'];
            permReq.forEach(f => { if (!form[f] || !String(form[f]).trim()) errs[f] = 'Required'; });
        }
        // Email format
        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            errs.email = 'Invalid email format';
        }
        // Phone related numbers length 10 if provided
        const phoneFields = ['guardianContact', 'fatherNumber', 'motherNumber', 'emergencyContact'];
        phoneFields.forEach(f => {
            if (form[f]) {
                const digits = String(form[f]).replace(/[^0-9]/g, '');
                if (digits.length !== 10) errs[f] = 'Must be 10 digits';
            }
        });
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!userId) return;
        if (!validate()) {
            toast({ title: 'Validation failed', description: 'Please fix highlighted fields', variant: 'destructive' });
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            // Filter payload to allowed fields only
            const payload: Record<string, string | undefined> = {};
            Object.keys(form).forEach(k => { if (isFieldEditable(k)) payload[k] = form[k]; });
            const res = await updateUser(userId, payload);
            if (res.success) {
                setSuccess('Profile updated');
                setInitialData(res.data);
                onUpdated?.(res.data);
                setOpen(false);
                toast({ title: 'Profile updated', description: 'Your profile has been successfully updated.', variant: 'success' });
            } else {
                setError(res.message || 'Update failed');
                toast({ title: 'Update failed', description: res.message || 'Server rejected update', variant: 'destructive' });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            toast({ title: 'Error', description: msg, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const sectionClass = "grid gap-4 sm:grid-cols-3";

    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className='cursor-pointer'>Edit Personal Information</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto w-full sm:max-w-[900px] lg:max-w-[1200px] xl:max-w-[1400px]">
                <DialogHeader>
                    <DialogTitle>Edit User Details</DialogTitle>
                </DialogHeader>
                {loading && !initialData && <p className="text-sm text-muted-foreground">Loading...</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}
                {initialData && (
                    <div className="space-y-8">
                        <div>
                            <h4 className="font-medium mb-2">Personal Information</h4>
                            <div className={sectionClass}>
                                <div className='space-y-2'>
                                    <Label>First Name</Label>
                                    <Input value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} />
                                    {fieldErrors.firstName && <p className="text-xs text-red-500 mt-1">{fieldErrors.firstName}</p>}
                                </div>
                                <div className='space-y-2'>

                                    <Label>Middle Name</Label>
                                    <Input value={form.middleName} onChange={e => handleChange('middleName', e.target.value)} />
                                </div>
                                <div className='space-y-2'>

                                    <Label>Last Name</Label>
                                    <Input value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} />
                                    {fieldErrors.lastName && <p className="text-xs text-red-500 mt-1">{fieldErrors.lastName}</p>}
                                </div>
                                <div className='space-y-2'>

                                    <Label>Email</Label>
                                    <Input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} />
                                    {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                                </div>
                                <div className='space-y-2'>

                                    <Label>Date of Birth</Label>
                                    <div className="relative mt-1">
                                        {/* Controlled popover: stays open on date selection; closes only on outside click or trigger toggle */}
                                        <Popover open={dobOpen} onOpenChange={setDobOpen}>
                                            <PopoverTrigger asChild>
                                                <div className="relative">
                                                    <Input
                                                        readOnly
                                                        value={selectedDob ? selectedDob.toISOString().slice(0, 10) : ''}
                                                        placeholder="Select date"
                                                        className="pr-10 cursor-pointer"
                                                    />
                                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent side="bottom" align="start" className="mt-2 z-50 p-0" onEscapeKeyDown={() => setDobOpen(false)}>
                                                <Calendar
                                                    mode="single"
                                                    selected={selectedDob}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            setSelectedDob(date);
                                                            const iso = date.toISOString().slice(0, 10);
                                                            handleChange('dateOfBirth', iso);
                                                            // Keep popover open; user can click outside or trigger to close
                                                        }
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className='space-y-2'>

                                    <Label>Sex</Label>
                                    <Select value={form.sex || ''} onValueChange={(v) => handleChange('sex', v)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select sex" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldErrors.sex && <p className="text-xs text-red-500 mt-1">{fieldErrors.sex}</p>}
                                </div>
                            </div>
                        </div>
                        {canAdminEdit && (
                            <>
                                <Separator />
                                <div className='space-y-2'>

                                    <h4 className="font-medium mb-4">Guardian Details</h4>
                                    <div className={sectionClass}>
                                        <div className='space-y-2'>
                                            <Label>Father Name</Label><Input value={form.fatherName} onChange={e => handleChange('fatherName', e.target.value)} /></div>
                                        <div className='space-y-2'>
                                            <Label>Mother Name</Label><Input value={form.motherName} onChange={e => handleChange('motherName', e.target.value)} /></div>

                                        <div className='space-y-2'>
                                            <Label>Grandfather Name</Label><Input value={form.grandfatherName} onChange={e => handleChange('grandfatherName', e.target.value)} /></div>
                                        <div className='space-y-2'>
                                            <Label>Grandmother Name</Label><Input value={form.grandmotherName} onChange={e => handleChange('grandmotherName', e.target.value)} /></div>
                                        <div className='space-y-2'>

                                            <Label>Father Number</Label>
                                            <Input value={form.fatherNumber} onChange={e => handleChange('fatherNumber', e.target.value)} />
                                            {fieldErrors.fatherNumber && <p className="text-xs text-red-500 mt-1">{fieldErrors.fatherNumber}</p>}
                                        </div>
                                        <div className='space-y-2'>

                                            <Label>Mother Number</Label>
                                            <Input value={form.motherNumber} onChange={e => handleChange('motherNumber', e.target.value)} />
                                            {fieldErrors.motherNumber && <p className="text-xs text-red-500 mt-1">{fieldErrors.motherNumber}</p>}
                                        </div>
                                        <div className='space-y-2'>
                                            <Label>Guardian Name</Label><Input value={form.guardianName} onChange={e => handleChange('guardianName', e.target.value)} /></div>
                                        <div className='space-y-2'>

                                            <Label>Guardian Contact</Label>
                                            <Input value={form.guardianContact} onChange={e => handleChange('guardianContact', e.target.value)} />
                                            {fieldErrors.guardianContact && <p className="text-xs text-red-500 mt-1">{fieldErrors.guardianContact}</p>}
                                        </div>
                                        <div className='space-y-2'>

                                            <Label>Emergency Contact</Label>
                                            <Input value={form.emergencyContact} onChange={e => handleChange('emergencyContact', e.target.value)} />
                                            {fieldErrors.emergencyContact && <p className="text-xs text-red-500 mt-1">{fieldErrors.emergencyContact}</p>}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        <Separator />
                        <div className='space-y-2'>

                            <h4 className="font-medium mb-2">Address Information</h4>
                            <div className={sectionClass}>
                                <div className="sm:col-span-3 hidden">
                                    <Label>Country</Label>
                                    <select className="w-full border rounded-md h-9 px-2 text-sm" value={form.country} onChange={e => handleChange('country', e.target.value)}>
                                        <option value="Nepal">Nepal</option>
                                    </select>
                                </div>
                            </div>
                            {canAdminEdit && (
                                <>
                                    <h5 className="mt-4 mb-2 text-sm font-medium">Permanent Address</h5>
                                    <div className={sectionClass}>
                                        <div className='space-y-2'>

                                            <Label>Province</Label>
                                            <Select value={form.permanentState || ''} onValueChange={(v) => handleChange('permanentState', v)}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Province" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map(p => (
                                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {fieldErrors.permanentState && <p className="text-xs text-red-500 mt-1">{fieldErrors.permanentState}</p>}
                                        </div>
                                        <div className='space-y-2'>

                                            <Label>District</Label>
                                            <Select value={form.permanentCity || ''} onValueChange={(v) => handleChange('permanentCity', v)}>
                                                <SelectTrigger className="w-full" disabled={!form.permanentState}>
                                                    <SelectValue placeholder="Select District" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {permDistricts.map(d => (
                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {fieldErrors.permanentCity && <p className="text-xs text-red-500 mt-1">{fieldErrors.permanentCity}</p>}
                                        </div>
                                        <div className='space-y-2'>

                                            <Label>Metropolitician City / Municipality / Rural Municipality</Label>
                                            <Select value={form.permanentLocalGovernment || ''} onValueChange={(v) => handleChange('permanentLocalGovernment', v)}>
                                                <SelectTrigger className="w-full" disabled={!form.permanentCity}>
                                                    <SelectValue placeholder="Select Municipality" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {permMunicipals.map(m => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {fieldErrors.permanentLocalGovernment && <p className="text-xs text-red-500 mt-1">{fieldErrors.permanentLocalGovernment}</p>}
                                        </div>
                                        <div className='space-y-2'>
                                            <Label>Ward Number</Label><Input value={form.permanentWardNumber} onChange={e => handleChange('permanentWardNumber', e.target.value)} /></div>
                                        <div className='space-y-2'>
                                            <Label>Tole</Label><Input value={form.permanentTole} onChange={e => handleChange('permanentTole', e.target.value)} /></div>
                                        <div className='space-y-2'>
                                            <Label>Postal Code</Label><Input value={form.permanentPostalCode} onChange={e => handleChange('permanentPostalCode', e.target.value)} /></div>
                                    </div>
                                </>
                            )}
                            <h5 className="mt-4 mb-2 text-sm font-medium">Temporary Address</h5>
                            <div className={sectionClass}>
                                <div className='space-y-2'>

                                    <Label>Province</Label>
                                    <Select value={form.tempState || ''} onValueChange={(v) => handleChange('tempState', v)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Province" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provinces.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className='space-y-2'>

                                    <Label>District</Label>
                                    <Select value={form.tempCity || ''} onValueChange={(v) => handleChange('tempCity', v)}>
                                        <SelectTrigger className="w-full" disabled={!form.tempState}>
                                            <SelectValue placeholder="Select District" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tempDistricts.map(d => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className='space-y-2'>

                                    <Label>Metropolitician City / Municipality / Rural Municipality</Label>
                                    <Select value={form.tempLocalGovernment || ''} onValueChange={(v) => handleChange('tempLocalGovernment', v)}>
                                        <SelectTrigger className="w-full" disabled={!form.tempCity}>
                                            <SelectValue placeholder="Select Municipality" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tempMunicipals.map(m => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className='space-y-2'>
                                    <Label>Ward Number</Label><Input value={form.tempWardNumber} onChange={e => handleChange('tempWardNumber', e.target.value)} /></div>
                                <div className='space-y-2'>
                                    <Label>Tole</Label><Input value={form.tempTole} onChange={e => handleChange('tempTole', e.target.value)} /></div>
                                <div className='space-y-2'>
                                    <Label>Postal Code</Label><Input value={form.tempPostalCode} onChange={e => handleChange('tempPostalCode', e.target.value)} /></div>
                            </div>
                        </div>
                    </div>
                )}
                <DialogFooter className="mt-6 flex gap-2 justify-end">
                    <DialogClose asChild>
                        <Button variant="outline" className='cursor-pointer'>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={loading} className='cursor-pointer'>{loading ? 'Saving...' : 'Save Changes'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <Toaster />
        </>
    );
}
