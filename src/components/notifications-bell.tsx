'use client';
import * as React from 'react';
import { Bell, RefreshCw, ExternalLink, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClientComment {
  id: number;
  workPlanId: number;
  atmCode: string;
  imageUrl?: string | null;
  imageType?: string | null;
  commentText: string;
  commentBy: string;
  commentByRole: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationsData {
  unreadCount: number;
  recentComments: ClientComment[];
}

export function NotificationBell({ userRole }: { userRole: 'client' | 'reviewer' }) {
  const { toast } = useToast();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<NotificationsData>({
    unreadCount: 0,
    recentComments: [],
  });
  const [open, setOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastCount, setLastCount] = React.useState(0);
  const [showAll, setShowAll] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastCountRef = React.useRef(0); // Use ref to avoid re-renders
  const showAllRef = React.useRef(showAll); // Use ref to track showAll

  const fetchNotifications = React.useCallback(async (showToast = false, includeRead = false) => {
    try {
      setIsRefreshing(true);
      const url = `/api/notifications?userRole=${userRole}${includeRead ? '&showAll=true' : ''}`;
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        
        // Show toast notification if there are new unread comments
        const currentLastCount = lastCountRef.current;
        if (data.unreadCount > currentLastCount && currentLastCount > 0) {
          const newCommentsCount = data.unreadCount - currentLastCount;
          toast({
            title: '📬 إشعار جديد',
            description: `لديك ${newCommentsCount} تعليق جديد`,
            duration: 5000,
          });
        }
        
        lastCountRef.current = data.unreadCount;
        setLastCount(data.unreadCount);
        
        if (showToast) {
          toast({
            title: 'تم التحديث',
            description: 'تم تحديث الإشعارات بنجاح',
            duration: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (showToast) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'فشل تحديث الإشعارات',
          duration: 3000,
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [userRole, toast]); // Removed lastCount from dependencies

  // Update ref when showAll changes
  React.useEffect(() => {
    showAllRef.current = showAll;
  }, [showAll]);

  React.useEffect(() => {
    // Initial fetch
    fetchNotifications(false, showAllRef.current);
    
    // Poll for new notifications every 10 seconds (more frequent)
    intervalRef.current = setInterval(() => {
      fetchNotifications(false, showAllRef.current);
    }, 10000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll]); // Only depend on showAll to restart interval when it changes

  // Refresh when window gains focus
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleFocus = () => {
      fetchNotifications(false, showAllRef.current);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleMarkAsRead = async (commentId: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentIds: [commentId] }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => ({
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - 1),
          recentComments: prev.recentComments.map(c => 
            c.id === commentId ? { ...c, isRead: true } : c
          ),
        }));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleOpenComment = (comment: ClientComment) => {
    // Mark as read
    if (!comment.isRead) {
      handleMarkAsRead(comment.id);
    }
    
    // Close popover
    setOpen(false);
    
    // Store image info in sessionStorage to avoid URL length issues (HTTP 431)
    // imageUrl can be very long (base64 encoded images)
    if (comment.imageUrl && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('targetImageUrl', comment.imageUrl);
        if (comment.imageType) {
          sessionStorage.setItem('targetImageType', comment.imageType);
        }
      } catch (error) {
        console.warn('Failed to store image info in sessionStorage:', error);
      }
    }
    
    // Build query parameters (only essential info, no imageUrl)
    const params = new URLSearchParams();
    params.set('workPlanId', String(comment.workPlanId));
    params.set('atmCode', comment.atmCode);
    if (comment.id) {
      params.set('commentId', String(comment.id));
    }
    
    // Navigate to client review page with query parameters
    router.push(`/client-review?${params.toString()}`);
    
    // Show toast with instructions
    toast({
      title: 'فتح التقرير',
      description: comment.imageUrl 
        ? `جاري فتح صورة ${comment.imageType === 'before' ? 'قبل' : 'بعد'} للمكينة: ${comment.atmCode}`
        : `جاري فتح التقرير للمكينة: ${comment.atmCode}`,
      duration: 4000,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Refresh when opening
      fetchNotifications(false, showAll);
    }
  };

  const handleManualRefresh = async () => {
    await fetchNotifications(true, showAll);
  };

  const unreadComments = notifications.recentComments.filter(c => !c.isRead);
  const readComments = notifications.recentComments.filter(c => c.isRead);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn(
            "h-5 w-5",
            notifications.unreadCount > 0 && "animate-pulse text-primary"
          )} />
          {notifications.unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-bounce"
            >
              {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">الإشعارات</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-7"
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          </div>
          
          <Tabs defaultValue="unread" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unread" className="relative">
                جديدة
                {unreadComments.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {unreadComments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">
                الكل ({notifications.recentComments.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="unread" className="mt-2">
              <ScrollArea className="h-[350px]">
                {unreadComments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد إشعارات جديدة
                  </p>
                ) : (
                  <div className="space-y-2 pr-4">
                    {unreadComments.map((comment) => (
                      <NotificationCard
                        key={comment.id}
                        comment={comment}
                        onOpen={handleOpenComment}
                        onMarkRead={handleMarkAsRead}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="all" className="mt-2">
              <ScrollArea className="h-[350px]">
                {notifications.recentComments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد إشعارات
                  </p>
                ) : (
                  <div className="space-y-2 pr-4">
                    {notifications.recentComments.map((comment) => (
                      <NotificationCard
                        key={comment.id}
                        comment={comment}
                        onOpen={handleOpenComment}
                        onMarkRead={handleMarkAsRead}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <div className="text-xs text-center text-muted-foreground border-t pt-2">
            آخر تحديث: {typeof window !== 'undefined' ? format(new Date(), 'HH:mm:ss') : '--:--:--'}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationCard({ 
  comment, 
  onOpen, 
  onMarkRead 
}: { 
  comment: ClientComment;
  onOpen: (comment: ClientComment) => void;
  onMarkRead: (id: number) => void;
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer group',
        !comment.isRead && 'bg-primary/5 border-primary/20 shadow-sm'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {comment.commentBy}
          </span>
          <Badge variant="outline" className="text-xs">
            {comment.commentByRole === 'client' ? 'عميل' : 'مراجع'}
          </Badge>
        </div>
        {!comment.isRead && (
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
        {comment.commentText}
      </p>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          كود المكينة: {comment.atmCode}
        </span>
        <span>
          {typeof window !== 'undefined' ? format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm') : comment.createdAt}
        </span>
      </div>
      
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          variant="default"
          className="flex-1 h-8"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(comment);
          }}
        >
          <ExternalLink className="h-3 w-3 ml-1" />
          فتح وعرض
        </Button>
        {!comment.isRead && (
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(comment.id);
            }}
          >
            <Eye className="h-3 w-3 ml-1" />
            تعيين كمقروء
          </Button>
        )}
      </div>
    </div>
  );
}

