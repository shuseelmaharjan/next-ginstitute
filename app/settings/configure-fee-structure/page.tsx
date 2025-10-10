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

  // Fetch all fee structures
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

  // Open modal for create
  const openCreateModal = () => {
    setEditMode(false);
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

  // Open modal for update
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

  // Handle form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "amount" ? String(value) : value,
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (name: keyof typeof form, checked: boolean) => {
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  // Create or update fee structure
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

  // Delete fee structure
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
    </div>
  );
}