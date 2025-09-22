import { Department } from "@/app/services/departmentService";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Edit, MoreVertical, Power, PowerOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

interface DepartmentListProps {
  departments: Department[];
  onEdit: (department: Department) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  isLoading?: boolean;
}

export function DepartmentList({
  departments,
  onEdit,
  onToggleStatus,
  isLoading = false,
}: DepartmentListProps) {
  if (departments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          {isLoading ? "Loading departments..." : "No departments found"}
        </div>
        {!isLoading && (
          <p className="text-sm text-muted-foreground mt-2">
            Create your first department to get started.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department Name</TableHead>
            <TableHead>Faculty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((department) => (
            <TableRow key={department.id}>
              <TableCell className="font-medium">
                {department.departmentName}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {department.faculty?.facultyName || `Faculty ID: ${department.facultyId}`}
                  </span>
                  {department.faculty && (
                    <Badge
                      variant={department.faculty.isActive ? "default" : "secondary"}
                      className="w-fit text-xs mt-1"
                    >
                      {department.faculty.isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={department.isActive ? "default" : "secondary"}
                  className="w-fit"
                >
                  {department.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(department.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      disabled={isLoading}
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onEdit(department)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Name
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(department.id, department.isActive)}
                      className="cursor-pointer"
                    >
                      {department.isActive ? (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="text-muted-foreground">Loading departments...</div>
        </div>
      )}
    </div>
  );
}