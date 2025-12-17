'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'

interface Representative {
  id: number
  name: string
  username: string
  email: string
}

export default function Representatives() {
  const [representatives, setRepresentatives] = useState<Representative[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
  })

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchRepresentatives()
    
    // الاستماع لحدث تحديث المندوبين من صفحة الاستيراد
    const handleRepresentativesUpdate = () => {
      console.log('🔄 تحديث بيانات المندوبين...');
      fetchRepresentatives();
    };
    
    // الاستماع لحدث focus لإعادة التحميل
    const handleFocus = () => {
      fetchRepresentatives();
    };
    
    // الاستماع لحدث visibility change (عند العودة للصفحة)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRepresentatives();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('representativesUpdated', handleRepresentativesUpdate);
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchRepresentatives();
      }, 30000);
      
      return () => {
        window.removeEventListener('representativesUpdated', handleRepresentativesUpdate);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(interval);
      };
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/representatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        setIsOpen(false)
        // Refresh representatives list
        fetchRepresentatives()
      }
    } catch (error) {
      console.error('Error adding representative:', error)
    }
  }

  const fetchRepresentatives = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/representatives')
      const data = await response.json()
      setRepresentatives(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching representatives:', error)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">بيانات المندوبين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>إضافة مندوب جديد</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>إضافة مندوب جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">اسم المستخدم</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit">حفظ</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-4">جاري تحميل البيانات...</div>
          ) : representatives.length === 0 ? (
            <div className="text-center py-4">لا يوجد مندوبين</div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>اسم المستخدم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {representatives.map((representative) => (
                <TableRow key={representative.id}>
                  <TableCell>{representative.name}</TableCell>
                  <TableCell>{representative.username}</TableCell>
                  <TableCell>{representative.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}