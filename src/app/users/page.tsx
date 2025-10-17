'use client';
import * as React from 'react';
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
import { useToast } from '@/hooks/use-toast';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export default function UsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = React.useState<User[]>([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Viewer' },
    ]);
    
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [newUser, setNewUser] = React.useState({ name: '', email: '', password: '', role: '' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewUser(prev => ({ ...prev, [id]: value }));
    };

    const handleAddUser = () => {
        if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'يرجى ملء جميع الحقول.',
            });
            return;
        }

        const userToAdd: User = {
            id: Date.now(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
        };

        setUsers(prev => [userToAdd, ...prev]);
        toast({
            title: 'تمت الإضافة بنجاح',
            description: `تمت إضافة المستخدم "${newUser.name}" بنجاح.`,
        });

        setNewUser({ name: '', email: '', password: '', role: '' });
        setIsAddDialogOpen(false);
    };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline">
                المستخدمون
            </h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                     <Button><PlusCircle className="ml-2 h-4 w-4"/> إضافة مستخدم</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">الاسم</Label>
                            <Input id="name" placeholder="اسم المستخدم" value={newUser.name} onChange={handleInputChange} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input id="email" type="email" placeholder="user@example.com" value={newUser.email} onChange={handleInputChange} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="password">كلمة المرور</Label>
                            <Input id="password" type="password" value={newUser.password} onChange={handleInputChange} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="role">الدور</Label>
                             <Input id="role" placeholder="Admin, Editor, etc." value={newUser.role} onChange={handleInputChange} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddUser}>إضافة</Button>
                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      <div className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
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
