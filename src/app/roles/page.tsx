'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function RolesPage() {
    const roles = [
        { id: 1, name: 'Admin', permissions: ['create', 'read', 'update', 'delete'] },
        { id: 2, name: 'Editor', permissions: ['create', 'read', 'update'] },
        { id: 3, name: 'Viewer', permissions: ['read'] },
    ];
    const allPermissions = ['create', 'read', 'update', 'delete'];
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline">
                الأدوار والصلاحيات
            </h2>
            <Dialog>
                <DialogTrigger asChild>
                     <Button><PlusCircle className="ml-2 h-4 w-4"/> إضافة دور</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إضافة دور جديد</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">اسم الدور</Label>
                            <Input id="name" placeholder="اسم الدور" />
                        </div>
                         <div className="grid gap-4">
                            <Label>الصلاحيات</Label>
                            {allPermissions.map(permission => (
                                <div key={permission} className="flex items-center space-x-2">
                                    <Checkbox id={permission} />
                                    <Label htmlFor={permission} className="capitalize">{permission}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">إضافة</Button>
                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      <div className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الدور</TableHead>
                <TableHead>الصلاحيات</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.permissions.join(', ')}</TableCell>
                    <TableCell>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-blue-600"/></Button>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
    </div>
  );
}
