"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/hooks/use-toast";
import apiHandler from "@/app/api/apiHandler";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface FeeStructure {
  id: number;
  feeType: string;
  amount: string;
  description: string;
  requireonAdmission: boolean;
  requireonUpgrade: boolean;
  requireonRenewal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FeeRule {
  id: number;
  name: string;
  category: string;
  defaultAmount: string | number;
  currency: string;
  recurrenceType: string; // ONCE | RECURRING (API may return lowercase)
  intervalMonths: number | null;
  section_id: number | null;
  isActive?: boolean;
  section?: {
    id: number;
    sectionName: string;
    class?: {
      id: number;
      className: string;
      department?: {
        id: number;
        departmentName: string;
        faculty?: {
          id: number;
          facultyName: string;
        };
      };
      course?: { id: number; title: string };
    };
  };
}

interface Faculty { id: number; facultyName: string; }
interface Department { id: number; departmentName: string; facultyId?: number; }
interface ClassItem { id: number; className: string; }
interface SectionItem { id: number; sectionName: string; class_id?: number; }

interface FeeRuleForm {
  name: string;
  category: typeof categories[number];
  defaultAmount: string;
  currency: string;
  recurrenceType: "ONCE" | "RECURRING";
  intervalMonths: string; // empty string or number string
  section_id: number | null;
  isActive: boolean;
  selectionMode: "individual" | "group";
}

export default function ConfigureFeeStructurePage() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeStructure | null>(null);
  const [form, setForm] = useState({
    feeType: "",
    amount: "",
    description: "",
    requireonAdmission: false,
    requireonUpgrade: false,
    requireonRenewal: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<FeeStructure | null>(null);

  // Fetch all fee structures (restored)
  useEffect(() => {
    setLoading(true);
    apiHandler({ url: "/api/v1/fee-structures", method: "GET" })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setFeeStructures(res.data);
        } else {
          toast({ title: "Error", description: res.message || "Failed to fetch fee structures.", variant: "destructive" });
        }
      })
      .catch(() => toast({ title: "Error", description: "Failed to fetch fee structures.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  // Open modal for create (restored)
  const openCreateModal = () => {
    setEditMode(false);
    setSelectedFee(null);
    setForm({
      feeType: "",
      amount: "",
      description: "",
      requireonAdmission: false,
      requireonUpgrade: false,
      requireonRenewal: false,
    });
    setModalOpen(true);
  };

  // Open modal for update (restored)
  const openEditModal = (fee: FeeStructure) => {
    setEditMode(true);
    setSelectedFee(fee);
    setForm({
      feeType: fee.feeType,
      amount: fee.amount,
      description: fee.description,
      requireonAdmission: fee.requireonAdmission,
      requireonUpgrade: fee.requireonUpgrade,
      requireonRenewal: fee.requireonRenewal,
    });
    setModalOpen(true);
  };

  // Handle form change (restored)
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "amount" ? String(value) : value,
    }));
  };

  // Handle checkbox change (restored)
  const handleCheckboxChange = (name: keyof typeof form, checked: boolean) => {
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  // Create or update fee structure (restored)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: string[] = [];
    const feeType = String(form.feeType ?? "");
    const description = String(form.description ?? "");
    const amountStr = String(form.amount ?? "");
    if (!feeType.trim()) errors.push("Fee type is required.");
    if (!description.trim()) errors.push("Description is required.");
    const amountInt = Number(amountStr);
    if (!amountStr.trim()) {
      errors.push("Amount is required.");
    } else if (!Number.isInteger(amountInt) || amountInt <= 0) {
      errors.push("Amount must be a positive integer.");
    }
    if (errors.length > 0) {
      toast({ title: "Validation Error", description: errors.join("\n"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (editMode && selectedFee) {
        // Update
        const res = await apiHandler({
          url: `/api/v1/fee-structures/${selectedFee.id}`,
          method: "PATCH",
          data: {
            feeType: form.feeType,
            amount: amountInt,
            description: form.description,
            requireonAdmission: form.requireonAdmission,
            requireonUpgrade: form.requireonUpgrade,
            requireonRenewal: form.requireonRenewal,
          },
        });
        if (res.success && res.data) {
          toast({ title: "Success", description: "Fee structure updated successfully!", variant: "success" });
          setFeeStructures((prev) => prev.map((f) => f.id === selectedFee.id ? res.data : f));
          setModalOpen(false);
        } else {
          toast({ title: "Error", description: res.message || "Failed to update fee structure.", variant: "destructive" });
        }
      } else {
        // Create
        const res = await apiHandler({
          url: "/api/v1/fee-structures",
          method: "POST",
          data: {
            feeType: form.feeType,
            amount: amountInt,
            description: form.description,
            requireonAdmission: form.requireonAdmission,
            requireonUpgrade: form.requireonUpgrade,
            requireonRenewal: form.requireonRenewal,
          },
        });
        if (res.success && res.data) {
          toast({ title: "Success", description: "Fee structure created successfully!", variant: "success" });
            setFeeStructures((prev) => [...prev, res.data]);
          setModalOpen(false);
        } else {
          toast({ title: "Error", description: res.message || "Failed to create fee structure.", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to save fee structure.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Delete fee structure (restored)
  const handleDelete = async () => {
    if (!feeToDelete) return;
    setLoading(true);
    try {
      const res = await apiHandler({
        url: `/api/v1/fee-structures/${feeToDelete.id}`,
        method: "DELETE",
      });
      if (res.success) {
        toast({ title: "Success", description: "Fee structure deleted successfully!", variant: "success" });
        setFeeStructures((prev) => prev.filter((f) => f.id !== feeToDelete.id));
        setDeleteDialogOpen(false);
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete fee structure.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete fee structure.", variant: "destructive" });
    } finally {
      setLoading(false);
      setFeeToDelete(null);
    }
  };

  // ------------------ Fee Rules State (NEW) ------------------
  const [feeRules, setFeeRules] = useState<FeeRule[]>([]);
  const [feeRulesLoading, setFeeRulesLoading] = useState(false);
  const [feeRuleModalOpen, setFeeRuleModalOpen] = useState(false);
  const [feeRuleEditMode, setFeeRuleEditMode] = useState(false);
  const [selectedFeeRule, setSelectedFeeRule] = useState<FeeRule | null>(null);
  const [feeRuleDeleteDialogOpen, setFeeRuleDeleteDialogOpen] = useState(false);
  const [feeRuleToDelete, setFeeRuleToDelete] = useState<FeeRule | null>(null);

  const categories = ["tuition", "lab", "sports", "exam", "bus", "eca", "other"] as const;
  const currencies = ["USD", "NPR", "INR", "EUR", "GBP", "AUD", "CAD", "JPY", "CNY"] as const;

  const [feeRuleForm, setFeeRuleForm] = useState<FeeRuleForm>({
    name: "",
    category: "tuition",
    defaultAmount: "",
    currency: "NPR",
    recurrenceType: "ONCE",
    intervalMonths: "",
    section_id: null,
    isActive: true,
    selectionMode: "individual",
  });

  // Hierarchy selections
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);

  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  // ------------------ Fetch Fee Rules & Faculties ------------------
  useEffect(() => {
    // fetch fee rules
    setFeeRulesLoading(true);
    Promise.all([
      apiHandler({ url: "/api/v1/fee-rules", method: "GET" }),
      apiHandler({ url: "/api/v1/faculty", method: "GET" }),
    ])
      .then(([feeRulesRes, facultiesRes]) => {
        if (feeRulesRes.success && Array.isArray(feeRulesRes.data)) {
          setFeeRules(feeRulesRes.data);
        } else {
          toast({ title: "Error", description: feeRulesRes.message || "Failed to fetch fee rules.", variant: "destructive" });
        }
        if (facultiesRes.success && Array.isArray(facultiesRes.data)) {
          setFaculties(facultiesRes.data);
        }
      })
      .catch(() => toast({ title: "Error", description: "Failed to load fee rules or faculties.", variant: "destructive" }))
      .finally(() => setFeeRulesLoading(false));
  }, []);

  // ------------------ Hierarchy Fetch Helpers ------------------
  const fetchDepartmentsByFaculty = async (facultyId: number) => {
    try {
      const res = await apiHandler({ url: `/api/v1/departmentsfaculty/${facultyId}`, method: "GET" });
      if (res.success && Array.isArray(res.data)) {
        setDepartments(res.data);
      } else {
        setDepartments([]);
      }
    } catch {
      setDepartments([]);
    }
  };

  const fetchClassesByDepartment = async (departmentId: number) => {
    try {
      const res = await apiHandler({ url: `/api/v1/classes/department/${departmentId}`, method: "GET" });
      if (res.success && Array.isArray(res.data)) {
        setClasses(res.data);
      } else {
        setClasses([]);
      }
    } catch {
      setClasses([]);
    }
  };

  const fetchSectionsByClass = async (classId: number) => {
    try {
      const res = await apiHandler({ url: `/api/v1/sections/class/${classId}`, method: "GET" });
      if (res.success && Array.isArray(res.data)) {
        setSections(res.data);
      } else {
        setSections([]);
      }
    } catch {
      setSections([]);
    }
  };

  // ------------------ Fee Rule Modal Handlers ------------------
  const openFeeRuleCreateModal = () => {
    setFeeRuleEditMode(false);
    setSelectedFeeRule(null);
    setFeeRuleForm({
      name: "",
      category: "tuition",
      defaultAmount: "",
      currency: "NPR",
      recurrenceType: "ONCE",
      intervalMonths: "",
      section_id: null,
      isActive: true,
      selectionMode: "individual",
    });
    // reset hierarchy
    setSelectedFacultyId(null);
    setSelectedDepartmentId(null);
    setSelectedClassId(null);
    setSelectedSectionId(null);
    setDepartments([]);
    setClasses([]);
    setSections([]);
    setFeeRuleModalOpen(true);
  };

  const openFeeRuleEditModal = async (rule: FeeRule) => {
    setFeeRuleEditMode(true);
    setSelectedFeeRule(rule);
    setFeeRuleForm({
      name: rule.name,
      category: rule.category as FeeRuleForm["category"],
      defaultAmount: String(rule.defaultAmount),
      currency: rule.currency || "NPR",
      recurrenceType: rule.recurrenceType.toUpperCase() === "RECURRING" ? "RECURRING" : "ONCE",
      intervalMonths: rule.intervalMonths ? String(rule.intervalMonths) : "",
      section_id: rule.section_id,
      isActive: rule.isActive !== false,
      selectionMode: rule.section_id ? "group" : "individual",
    });
    // Populate hierarchy chain if section is present
    if (rule.section && rule.section.class) {
      const cls = rule.section.class;
      const dept = cls.department;
      const fac = dept?.faculty;
      if (fac?.id) {
        setSelectedFacultyId(fac.id);
        await fetchDepartmentsByFaculty(fac.id);
      }
      if (dept?.id) {
        setSelectedDepartmentId(dept.id);
        await fetchClassesByDepartment(dept.id);
      }
      if (cls.id) {
        setSelectedClassId(cls.id);
        await fetchSectionsByClass(cls.id);
      }
      if (rule.section.id) {
        setSelectedSectionId(rule.section.id);
      }
    } else {
      setSelectedFacultyId(null);
      setSelectedDepartmentId(null);
      setSelectedClassId(null);
      setSelectedSectionId(null);
      setDepartments([]);
      setClasses([]);
      setSections([]);
    }
    setFeeRuleModalOpen(true);
  };

  const handleFeeRuleFormChange = <K extends keyof FeeRuleForm>(field: K, value: FeeRuleForm[K]) => {
    setFeeRuleForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectionModeChange = (value: "individual" | "group") => {
    setFeeRuleForm((prev) => ({ ...prev, selectionMode: value, section_id: value === "individual" ? null : prev.section_id }));
    if (value === "individual") {
      setSelectedFacultyId(null);
      setSelectedDepartmentId(null);
      setSelectedClassId(null);
      setSelectedSectionId(null);
      setDepartments([]); setClasses([]); setSections([]);
    }
  };

  const handleSelectFaculty = async (value: string) => {
    const id = Number(value);
    setSelectedFacultyId(id);
    setSelectedDepartmentId(null);
    setSelectedClassId(null);
    setSelectedSectionId(null);
    setDepartments([]); setClasses([]); setSections([]);
    await fetchDepartmentsByFaculty(id);
    handleFeeRuleFormChange("section_id", null);
  };

  const handleSelectDepartment = async (value: string) => {
    const id = Number(value);
    setSelectedDepartmentId(id);
    setSelectedClassId(null);
    setSelectedSectionId(null);
    setClasses([]); setSections([]);
    await fetchClassesByDepartment(id);
    handleFeeRuleFormChange("section_id", null);
  };

  const handleSelectClass = async (value: string) => {
    const id = Number(value);
    setSelectedClassId(id);
    setSelectedSectionId(null);
    setSections([]);
    await fetchSectionsByClass(id);
    handleFeeRuleFormChange("section_id", null);
  };

  const handleSelectSection = (value: string) => {
    const id = Number(value);
    setSelectedSectionId(id);
    handleFeeRuleFormChange("section_id", id);
  };

  // ------------------ Fee Rule Create/Update ------------------
  const handleFeeRuleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: string[] = [];
    const name = feeRuleForm.name.trim();
    if (!name) errors.push("Name is required.");
    if (!categories.includes(feeRuleForm.category as any)) errors.push("Invalid category.");
    if (feeRuleForm.currency !== "NPR") errors.push("Only NPR currency is allowed currently.");
    const amountNum = Number(feeRuleForm.defaultAmount);
    if (isNaN(amountNum) || amountNum <= 0 || !Number.isInteger(amountNum)) errors.push("Default amount must be a positive integer.");

    // Determine recurrence based on interval selection
    const isOnce = feeRuleForm.recurrenceType === "ONCE" || feeRuleForm.intervalMonths === "";
    const intervalStr = feeRuleForm.intervalMonths;
    if (isOnce) {
      // ONCE
      // intervalMonths must be empty
    } else {
      const intervalInt = Number(intervalStr);
      if (!intervalStr || isNaN(intervalInt) || intervalInt <= 0 || !Number.isInteger(intervalInt)) {
        errors.push("Select a valid interval for recurring fees.");
      }
    }

    if (feeRuleForm.selectionMode === "group") {
      if (!selectedSectionId) errors.push("Please select Faculty, Department, Class and Section for group mode.");
    }

    if (errors.length) {
      toast({ title: "Validation Error", description: errors.join("\n"), variant: "destructive" });
      return;
    }

    setFeeRulesLoading(true);
    try {
      const payload = {
        name: feeRuleForm.name,
        category: feeRuleForm.category,
        defaultAmount: Number(feeRuleForm.defaultAmount),
        currency: "NPR",
        recurrenceType: isOnce ? "ONCE" : "RECURRING",
        intervalMonths: isOnce ? null : Number(feeRuleForm.intervalMonths),
        section_id: feeRuleForm.selectionMode === "group" ? selectedSectionId : null,
      };
      const method = feeRuleEditMode && selectedFeeRule ? "PUT" : "POST";
      const url = feeRuleEditMode && selectedFeeRule ? `/api/v1/fee-rules/${selectedFeeRule.id}` : "/api/v1/fee-rules";
      const res = await apiHandler({ url, method, data: payload });
      if (res.success && res.data) {
        if (feeRuleEditMode && selectedFeeRule) {
          toast({ title: "Success", description: "Fee rule updated successfully.", variant: "success" });
          setFeeRules((prev) => prev.map((r) => r.id === selectedFeeRule.id ? res.data : r));
        } else {
          toast({ title: "Success", description: "Fee rule created successfully.", variant: "success" });
          setFeeRules((prev) => [...prev, res.data]);
        }
        setFeeRuleModalOpen(false);
      } else {
        toast({ title: "Error", description: res.message || "Failed to save fee rule.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save fee rule.", variant: "destructive" });
    } finally {
      setFeeRulesLoading(false);
    }
  };

  // ------------------ Fee Rule Delete ------------------
  const handleFeeRuleDelete = async () => {
    if (!feeRuleToDelete) return;
    setFeeRulesLoading(true);
    try {
      const res = await apiHandler({ url: `/api/v1/fee-rules/${feeRuleToDelete.id}`, method: "DELETE" });
      if (res.success) {
        toast({ title: "Success", description: "Fee rule deleted successfully.", variant: "success" });
        setFeeRules((prev) => prev.filter((r) => r.id !== feeRuleToDelete.id));
        setFeeRuleDeleteDialogOpen(false);
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete fee rule.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete fee rule.", variant: "destructive" });
    } finally {
      setFeeRulesLoading(false);
      setFeeRuleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold">Configure Fee Structure</h2>
            <p className="text-muted-foreground">
                Set up and manage fee structures for courses
            </p>
        </div>
        <Button onClick={openCreateModal} className="cursor-pointer">Create Fee Structure</Button>
      </div>
      <Separator />
      <Table>
        <TableHeader>
          <TableRow className="bg-black hover:bg-black/90">
            <TableHead className="font-bold text-white">Fee Type</TableHead>
            <TableHead className="font-bold text-white">Amount</TableHead>
            <TableHead className="font-bold text-white">Description</TableHead>
            <TableHead className="font-bold text-white">Admission</TableHead>
            <TableHead className="font-bold text-white">Upgrade</TableHead>
            <TableHead className="font-bold text-white">Renewal</TableHead>
            <TableHead className="font-bold text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeStructures.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">No record found</TableCell>
            </TableRow>
          ) : (
            feeStructures.map((fee) => (
              <TableRow key={fee.id}>
                <TableCell>{fee.feeType}</TableCell>
                <TableCell>{fee.amount}</TableCell>
                <TableCell>{fee.description}</TableCell>
                <TableCell>
                  {fee.requireonAdmission ? (
                    <Badge variant="default">Required</Badge>
                  ) : (
                    <Badge variant="secondary">Not Required</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {fee.requireonUpgrade ? (
                    <Badge variant="default">Required</Badge>
                  ) : (
                    <Badge variant="secondary">Not Required</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {fee.requireonRenewal ? (
                    <Badge variant="default">Required</Badge>
                  ) : (
                    <Badge variant="secondary">Not Required</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(fee)} className="cursor-pointer">Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => { setFeeToDelete(fee); setDeleteDialogOpen(true); }} className="cursor-pointer">Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {/* Create/Update Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? "Update Fee Structure" : "Create Fee Structure"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Fee Type
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer text-muted-foreground"><Info size={16} /></span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Enter the type of fee (e.g. Admission Fee)</TooltipContent>
                </Tooltip>
              </Label>
              <Input name="feeType" value={form.feeType} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Amount
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer text-muted-foreground"><Info size={16} /></span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Enter a positive integer amount</TooltipContent>
                </Tooltip>
              </Label>
              <Input name="amount" type="number" step="1" min="1" value={form.amount} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Description
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer text-muted-foreground"><Info size={16} /></span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Describe the fee structure</TooltipContent>
                </Tooltip>
              </Label>
              <Input name="description" value={form.description} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Required on
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer text-muted-foreground"><Info size={16} /></span>
                  </TooltipTrigger>
                  <TooltipContent side="right">Select when this fee is required</TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex gap-4 items-center">
                <Label className="flex items-center gap-2">
                  <Checkbox checked={form.requireonAdmission} onCheckedChange={(checked) => handleCheckboxChange("requireonAdmission", !!checked)} /> Admission
                </Label>
                <Label className="flex items-center gap-2">
                  <Checkbox checked={form.requireonUpgrade} onCheckedChange={(checked) => handleCheckboxChange("requireonUpgrade", !!checked)} /> Upgrade
                </Label>
                <Label className="flex items-center gap-2">
                  <Checkbox checked={form.requireonRenewal} onCheckedChange={(checked) => handleCheckboxChange("requireonRenewal", !!checked)} /> Renewal
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="cursor-pointer">
                {editMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee Structure</AlertDialogTitle>
            <AlertDialogDescription>
              {feeToDelete ? `Do you want to delete '${feeToDelete.feeType}'? This action cannot be undone.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700 cursor-pointer">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fee Rules Management Section */}
      <Separator />
      <div className="flex justify-between items-center mt-10">
        <div>
          <h2 className="text-2xl font-bold">Manage Fee Rules</h2>
          <p className="text-muted-foreground">Create and manage fee rules with currency and recurrence</p>
        </div>
        <Button onClick={openFeeRuleCreateModal} className="cursor-pointer" variant="secondary">Create Fee Rule</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-black hover:bg-black/90">
            <TableHead className="font-bold text-white">Name</TableHead>
            <TableHead className="font-bold text-white">Category</TableHead>
            <TableHead className="font-bold text-white">Amount</TableHead>
            <TableHead className="font-bold text-white">Currency</TableHead>
            <TableHead className="font-bold text-white">Recurrence</TableHead>
            <TableHead className="font-bold text-white">Interval (Months)</TableHead>
            <TableHead className="font-bold text-white">Section</TableHead>
            <TableHead className="font-bold text-white">Class</TableHead>
            <TableHead className="font-bold text-white">Department</TableHead>
            <TableHead className="font-bold text-white">Faculty</TableHead>
            <TableHead className="font-bold text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeRules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground">No fee rules found</TableCell>
            </TableRow>
          ) : (
            feeRules.map((rule) => {
              const section = rule.section;
              const cls = section?.class;
              const dept = cls?.department;
              const fac = dept?.faculty;
              return (
                <TableRow key={rule.id}>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell className="capitalize">{rule.category}</TableCell>
                  <TableCell>{rule.defaultAmount}</TableCell>
                  <TableCell>{rule.currency}</TableCell>
                  <TableCell>{rule.recurrenceType?.toUpperCase()}</TableCell>
                  <TableCell>{rule.recurrenceType?.toUpperCase() === "RECURRING" ? rule.intervalMonths : "-"}</TableCell>
                  <TableCell>{rule.section_id ? section?.sectionName : <Badge variant="secondary">Individual</Badge>}</TableCell>
                  <TableCell>{cls?.className || (rule.section_id ? "-" : "-")}</TableCell>
                  <TableCell>{dept?.departmentName || (rule.section_id ? "-" : "-")}</TableCell>
                  <TableCell>{fac?.facultyName || (rule.section_id ? "-" : "-")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openFeeRuleEditModal(rule)} className="cursor-pointer">Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => { setFeeRuleToDelete(rule); setFeeRuleDeleteDialogOpen(true); }} className="cursor-pointer">Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Fee Rule Create/Update Modal */}
      <Dialog open={feeRuleModalOpen} onOpenChange={setFeeRuleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{feeRuleEditMode ? "Update Fee Rule" : "Create Fee Rule"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleFeeRuleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={feeRuleForm.name} onChange={(e) => handleFeeRuleFormChange("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={feeRuleForm.category} onValueChange={(v) => handleFeeRuleFormChange("category", v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Amount</Label>
                <Input type="number" step="1" min="1" value={feeRuleForm.defaultAmount} onChange={(e) => handleFeeRuleFormChange("defaultAmount", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={feeRuleForm.currency} onValueChange={(v) => handleFeeRuleFormChange("currency", v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c} disabled={c !== "NPR"}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Interval</Label>
                <Select
                  value={feeRuleForm.recurrenceType === "ONCE" ? "ONCE" : (feeRuleForm.intervalMonths ? String(feeRuleForm.intervalMonths) : "")}
                  onValueChange={(v) => {
                    if (v === "ONCE") {
                      setFeeRuleForm((prev) => ({ ...prev, recurrenceType: "ONCE", intervalMonths: "" }));
                    } else {
                      setFeeRuleForm((prev) => ({ ...prev, recurrenceType: "RECURRING", intervalMonths: v }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select interval" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONCE">Once</SelectItem>
                    <SelectItem value="1">Monthly</SelectItem>
                    <SelectItem value="2">Bimonthly</SelectItem>
                    <SelectItem value="3">Quarterly</SelectItem>
                    <SelectItem value="4">Four-monthly</SelectItem>
                    <SelectItem value="6">Semiannually</SelectItem>
                    <SelectItem value="12">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Applies To</Label>
                <Select value={feeRuleForm.selectionMode} onValueChange={(v) => handleSelectionModeChange(v as "individual" | "group")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            {feeRuleForm.selectionMode === "group" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Faculty</Label>
                  <Select value={selectedFacultyId ? String(selectedFacultyId) : ""} onValueChange={handleSelectFaculty}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select faculty" /></SelectTrigger>
                    <SelectContent>
                      {faculties.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.facultyName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={selectedDepartmentId ? String(selectedDepartmentId) : ""} onValueChange={handleSelectDepartment} disabled={!selectedFacultyId}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.departmentName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClassId ? String(selectedClassId) : ""} onValueChange={handleSelectClass} disabled={!selectedDepartmentId}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.className}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={selectedSectionId ? String(selectedSectionId) : ""} onValueChange={handleSelectSection} disabled={!selectedClassId}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select section" /></SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.sectionName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={feeRulesLoading} className="cursor-pointer">{feeRuleEditMode ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fee Rule Delete Confirmation */}
      <AlertDialog open={feeRuleDeleteDialogOpen} onOpenChange={setFeeRuleDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee Rule</AlertDialogTitle>
            <AlertDialogDescription>
              {feeRuleToDelete ? `Do you want to delete '${feeRuleToDelete.name}'? This action cannot be undone.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFeeRuleDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFeeRuleDelete} className="bg-red-600 text-white hover:bg-red-700 cursor-pointer">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
