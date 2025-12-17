'use client';
import * as React from 'react';
import { Suspense } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';
import type { WorkPlanReport, Note, WorkPlanReportStatus, ClientComment } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, CheckCheck, Image as ImageIcon, ArrowDown, Search, X, Calendar as CalendarIcon, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

const FullImageViewer = ({ 
    src,
    allImages,
    currentIndex
}: { 
    src: string;
    allImages?: string[];
    currentIndex?: number;
}) => {
    // Support both base64 and URL images
    const imageSrc = src.startsWith('data:') || src.startsWith('http') || src.startsWith('/') 
        ? src 
        : src.startsWith('uploads') 
            ? `/${src}` 
            : src;
    
    const images = allImages || [src];
    const initialIndex = currentIndex !== undefined ? currentIndex : (allImages ? allImages.indexOf(src) : 0);
    const [currentImageIndex, setCurrentImageIndex] = React.useState(initialIndex);
    const [zoom, setZoom] = React.useState(1);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const [open, setOpen] = React.useState(false);
    
    // Get current image source
    const currentImageSrc = images[currentImageIndex] || src;
    const normalizedCurrentSrc = currentImageSrc.startsWith('data:') || currentImageSrc.startsWith('http') || currentImageSrc.startsWith('/') 
        ? currentImageSrc 
        : currentImageSrc.startsWith('uploads') 
            ? `/${currentImageSrc}` 
            : currentImageSrc;
    
    const hasMultipleImages = images.length > 1;
    const canGoPrevious = hasMultipleImages && currentImageIndex > 0;
    const canGoNext = hasMultipleImages && currentImageIndex < images.length - 1;
    
    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };
    
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 5));
    };
    
    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    const handlePrevious = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (canGoPrevious) {
            setCurrentImageIndex(prev => prev - 1);
            handleReset();
        }
    };
    
    const handleNext = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (canGoNext) {
            setCurrentImageIndex(prev => prev + 1);
            handleReset();
        }
    };
    
    // Update current image index when dialog opens or src changes
    React.useEffect(() => {
        if (open && allImages && currentIndex !== undefined) {
            setCurrentImageIndex(currentIndex);
            handleReset();
        } else if (!open) {
            handleReset();
        }
    }, [open, allImages, currentIndex]);
    
    // Handle keyboard navigation
    React.useEffect(() => {
        if (!open) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && canGoPrevious) {
                e.preventDefault();
                setCurrentImageIndex(prev => {
                    if (prev > 0) {
                        handleReset();
                        return prev - 1;
                    }
                    return prev;
                });
            } else if (e.key === 'ArrowRight' && canGoNext) {
                e.preventDefault();
                setCurrentImageIndex(prev => {
                    if (prev < images.length - 1) {
                        handleReset();
                        return prev + 1;
                    }
                    return prev;
                });
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, canGoPrevious, canGoNext, images.length]);
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="relative group cursor-pointer">
                    <Image src={imageSrc} alt="Work Image" width={100} height={100} className="rounded-md object-cover aspect-square" unoptimized={imageSrc.startsWith('data:')} />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>
                            صورة بالحجم الكامل
                            {hasMultipleImages && (
                                <span className="text-sm text-muted-foreground mr-2">
                                    ({currentImageIndex + 1} / {images.length})
                                </span>
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                                <span className="text-lg">-</span>
                            </Button>
                            <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 5}>
                                <span className="text-lg">+</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleReset}>
                                إعادة تعيين
                            </Button>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        استخدم عجلة الفأرة للتكبير/التصغير، واسحب الصورة للتحريك
                        {hasMultipleImages && ' | استخدم الأسهم للتنقل بين الصور'}
                    </DialogDescription>
                </DialogHeader>
                <div 
                    className="flex-1 flex justify-center items-center overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-md relative"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
                >
                    {/* Previous button */}
                    {hasMultipleImages && canGoPrevious && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute left-4 z-10 bg-background/80 hover:bg-background shadow-lg"
                            onClick={handlePrevious}
                            aria-label="الصورة السابقة"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    )}
                    
                    {/* Next button */}
                    {hasMultipleImages && canGoNext && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute right-4 z-10 bg-background/80 hover:bg-background shadow-lg"
                            onClick={handleNext}
                            aria-label="الصورة التالية"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    )}
                    
                    <div
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                        }}
                    >
                        <Image 
                            key={currentImageIndex}
                            src={normalizedCurrentSrc} 
                            alt={`Full size image ${currentImageIndex + 1}`} 
                            width={1200} 
                            height={900} 
                            className="rounded-md object-contain max-h-[60vh] w-auto"
                            draggable={false}
                            unoptimized={normalizedCurrentSrc.startsWith('data:')}
                        />
                    </div>
                </div>
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    💡 استخدم عجلة الفأرة للتكبير/التصغير، واسحب الصورة للتحريك
                </div>
            </DialogContent>
        </Dialog>
    );
};

function CommentThread({ 
    comment, 
    userType, 
    onReply,
    onConfirmClose
}: { 
    comment: ClientComment, 
    userType: 'client' | 'reviewer',
    onReply: (parentId: number, text: string) => void,
    onConfirmClose?: (commentId: number) => void
}) {
    const [replyText, setReplyText] = React.useState('');
    const [showReplyBox, setShowReplyBox] = React.useState(false);
    const isOwnComment = 
        (userType === 'client' && comment.commentByRole === 'client') ||
        (userType === 'reviewer' && comment.commentByRole === 'reviewer');
    
    // Check if there's a reviewer reply to this comment
    const hasReviewerReply = comment.replies && comment.replies.some(reply => reply.commentByRole === 'reviewer');
    const canConfirmClose = userType === 'client' && 
                             comment.commentByRole === 'client' && 
                             !comment.parentCommentId && 
                             hasReviewerReply && 
                             comment.status !== 'resolved';

    const handleReply = () => {
        if (replyText.trim()) {
            onReply(comment.id, replyText);
            setReplyText('');
            setShowReplyBox(false);
        }
    };

    return (
        <div className={cn("mb-4", comment.parentCommentId && "mr-8")}>
            <Card className={cn(
                isOwnComment ? "bg-primary/5 border-primary/20" : "bg-muted/50"
            )}>
                <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Badge variant={comment.commentByRole === 'client' ? 'default' : 'secondary'}>
                                {comment.commentByRole === 'client' ? 'عميل' : 'مراجع'}
                            </Badge>
                            <span className="text-sm font-medium">{comment.commentBy}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {comment.isRead && <CheckCheck className="h-4 w-4 text-green-500" />}
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}
                            </span>
                        </div>
                    </div>
                    {comment.imageUrl && (
                        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            <span>ملاحظة على صورة {comment.imageType === 'before' ? 'قبل' : 'بعد'} العمل</span>
                        </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{comment.commentText}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            {comment.status === 'open' ? 'مفتوح' : comment.status === 'resolved' ? 'تم الحل' : 'قيد المعالجة'}
                        </Badge>
                        {!comment.parentCommentId && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowReplyBox(!showReplyBox)}
                                className="h-7 text-xs"
                            >
                                <MessageCircle className="h-3 w-3 ml-1" />
                                رد
                            </Button>
                        )}
                        {canConfirmClose && onConfirmClose && (
                            <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => onConfirmClose(comment.id)}
                                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                            >
                                <CheckCheck className="h-3 w-3 ml-1" />
                                تأكيد وإغلاق
                            </Button>
                        )}
                    </div>
                    {showReplyBox && (
                        <div className="mt-3 flex gap-2">
                            <Textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="اكتب ردك هنا..."
                                className="min-h-[60px]"
                            />
                            <div className="flex flex-col gap-2">
                                <Button size="sm" onClick={handleReply}>
                                    <Send className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowReplyBox(false)}>
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map(reply => (
                        <CommentThread 
                            key={reply.id} 
                            comment={reply} 
                            userType={userType}
                            onReply={onReply}
                            onConfirmClose={onConfirmClose}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ReviewDetailsDialog({ 
    report, 
    open, 
    onOpenChange,
    userType,
    onNoteAdd,
    targetImageUrl,
    targetImageType,
}: { 
    report: WorkPlanReport, 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    userType: 'client' | 'reviewer',
    onNoteAdd: (reportId: string, note: Note) => void,
    targetImageUrl?: string | null,
    targetImageType?: 'before' | 'after' | null,
 }) {
    const { toast } = useToast();
    const [newNote, setNewNote] = React.useState('');
    const [comments, setComments] = React.useState<ClientComment[]>([]);
    const [newComment, setNewComment] = React.useState('');
    const [selectedImage, setSelectedImage] = React.useState<{ url: string, type: 'before' | 'after' } | null>(null);
    const [loading, setLoading] = React.useState(false);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const commentsEndRef = React.useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);

    // Scroll to bottom of comments
    const scrollToBottom = () => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Handle scroll event to show/hide scroll button
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
        setShowScrollButton(!isNearBottom && comments.length > 0);
    };

    // Fetch comments when dialog opens and refresh report data
    React.useEffect(() => {
        if (open) {
            const workPlanId = report.workPlanId || parseInt(report.id.split('-')[0]);
            const atmCode = report.atmCode;
            
            if (workPlanId && atmCode) {
                fetchComments();
                // Trigger parent to refresh data to get latest images
                // This will be handled by the parent component's auto-refresh
            }
        }
    }, [open, report.workPlanId, report.id, report.atmCode]);

    // Scroll to bottom when comments change
    React.useEffect(() => {
        if (comments.length > 0) {
            setTimeout(scrollToBottom, 100);
        }
    }, [comments]);

    // Open target image when dialog opens and target image is specified
    React.useEffect(() => {
        if (open && targetImageUrl) {
            // Wait a bit for images to load
            setTimeout(() => {
                setSelectedImage({ url: targetImageUrl, type: targetImageType || 'before' });
            }, 500);
        }
    }, [open, targetImageUrl, targetImageType]);

    const fetchComments = async () => {
        const workPlanId = report.workPlanId || parseInt(report.id.split('-')[0]);
        const atmCode = report.atmCode;

        if (!workPlanId || !atmCode) {
            console.error('Cannot fetch comments: missing workPlanId or atmCode');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `/api/client-comments?workPlanId=${workPlanId}&atmCode=${atmCode}`
            );
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            } else {
                console.error('Failed to fetch comments:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = () => {
        if (!newNote.trim()) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'لا يمكن إضافة ملاحظة فارغة.'
            });
            return;
        }

        const note: Note = {
            id: `note-${Date.now()}`,
            text: newNote,
            date: new Date().toISOString(),
            user: userType === 'client' ? 'العميل' : 'المراجع',
        };
        
        onNoteAdd(report.id, note);
        setNewNote('');
        toast({
            title: 'تمت الإضافة',
            description: 'تمت إضافة ملاحظتك بنجاح.'
        });
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'لا يمكن إضافة تعليق فارغ.'
            });
            return;
        }

        // Ensure we have workPlanId and atmCode
        const workPlanId = report.workPlanId || parseInt(report.id.split('-')[0]);
        const atmCode = report.atmCode;

        console.log('handleAddComment - Report data:', {
            reportId: report.id,
            workPlanId,
            atmCode,
            hasSelectedImage: !!selectedImage,
            selectedImageUrl: selectedImage?.url,
            selectedImageType: selectedImage?.type,
            commentLength: newComment.length
        });

        if (!workPlanId || !atmCode) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'معلومات التقرير غير مكتملة.'
            });
            console.error('Missing workPlanId or atmCode:', { workPlanId, atmCode, report });
            return;
        }

        // Ensure imageUrl is a string if selectedImage exists
        const imageUrl = selectedImage?.url ? String(selectedImage.url).trim() : null;
        const imageType = selectedImage?.type || null;

        try {
            const requestBody = {
                workPlanId,
                atmCode,
                imageUrl: imageUrl || null, // Explicitly set to null if not provided
                imageType: imageType || null,
                commentText: newComment.trim(),
                commentBy: userType === 'client' ? 'العميل' : 'المراجع',
                commentByRole: userType,
            };

            console.log('Sending comment request:', {
                workPlanId,
                atmCode,
                imageUrl: imageUrl ? (imageUrl.substring(0, 50) + '...') : 'null',
                imageType,
                commentText: requestBody.commentText.length > 50 
                    ? requestBody.commentText.substring(0, 50) + '...' 
                    : requestBody.commentText,
                commentBy: requestBody.commentBy,
                commentByRole: requestBody.commentByRole
            });

            const response = await fetch('/api/client-comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Comment added successfully:', {
                    id: result.id,
                    imageUrl: result.imageUrl ? 'present' : 'null',
                    imageType: result.imageType
                });
                setNewComment('');
                // Don't clear selectedImage if it was set - keep it selected for more comments
                // setSelectedImage(null);
                await fetchComments();
                toast({
                    title: 'تمت الإضافة',
                    description: 'تم إضافة تعليقك بنجاح.'
                });
                setTimeout(scrollToBottom, 200);
            } else {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: 'فشل في قراءة استجابة الخادم' };
                }
                console.error('Server error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });
                throw new Error(errorData.error || errorData.details || `خطأ في الخادم: ${response.status}`);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة التعليق.'
            });
        }
    };

    const handleReply = async (parentId: number, text: string) => {
        // Ensure we have workPlanId and atmCode
        const workPlanId = report.workPlanId || parseInt(report.id.split('-')[0]);
        const atmCode = report.atmCode;

        if (!workPlanId || !atmCode) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: 'معلومات التقرير غير مكتملة.'
            });
            console.error('Missing workPlanId or atmCode:', { workPlanId, atmCode, report });
            return;
        }

        try {
            const response = await fetch('/api/client-comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workPlanId,
                    atmCode,
                    commentText: text,
                    commentBy: userType === 'client' ? 'العميل' : 'المراجع',
                    commentByRole: userType,
                    parentCommentId: parentId,
                }),
            });

            if (response.ok) {
                await fetchComments();
                toast({
                    title: 'تمت الإضافة',
                    description: 'تم إضافة ردك بنجاح.'
                });
                setTimeout(scrollToBottom, 200);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشل إضافة الرد');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة الرد.'
            });
        }
    };

    const handleConfirmClose = async (commentId: number) => {
        try {
            const response = await fetch('/api/client-comments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: String(commentId),
                    status: 'resolved',
                }),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: `HTTP error! status: ${response.status}` };
                }
                throw new Error(errorData.error || errorData.details || 'فشل تحديث حالة الملاحظة');
            }

            const updatedComment = await response.json();
            await fetchComments();
            toast({
                title: 'تم التأكيد',
                description: 'تم إغلاق الملاحظة بنجاح.'
            });
        } catch (error) {
            console.error('Error confirming close:', error);
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: error instanceof Error ? error.message : 'حدث خطأ أثناء تأكيد الإغلاق.'
            });
        }
    };

    const clientNotes = report.notes?.filter(n => n.user === 'العميل') || [];
    const reviewerNotes = report.notes?.filter(n => n.user === 'المراجع') || [];
    
    const canShowImages = report.status === 'Accepted';
    const unreadCount = comments.filter(c => !c.isRead).length;

    // Count comments per image (normalize imageUrl for comparison)
    const getImageCommentCount = (imageUrl: string) => {
        const normalizedUrl = imageUrl ? String(imageUrl).trim() : null;
        return comments.filter(c => {
            const commentImageUrl = c.imageUrl ? String(c.imageUrl).trim() : null;
            return commentImageUrl === normalizedUrl && commentImageUrl !== null;
        }).length;
    };

    // Check if image has unread comments (normalize imageUrl for comparison)
    const hasUnreadComments = (imageUrl: string) => {
        const normalizedUrl = imageUrl ? String(imageUrl).trim() : null;
        return comments.some(c => {
            const commentImageUrl = c.imageUrl ? String(c.imageUrl).trim() : null;
            return commentImageUrl === normalizedUrl && commentImageUrl !== null && !c.isRead;
        });
    };

    // Filter comments by selected image
    // Normalize imageUrl for comparison (trim whitespace and handle null/undefined)
    const filteredComments = selectedImage 
        ? comments.filter(c => {
            const commentImageUrl = c.imageUrl ? String(c.imageUrl).trim() : null;
            const selectedImageUrl = selectedImage.url ? String(selectedImage.url).trim() : null;
            return commentImageUrl === selectedImageUrl && commentImageUrl !== null;
        })
        : comments; // Show all comments when no image is selected

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center justify-between">
                        <span>مراجعة التقرير رقم: {report.orderNumber}</span>
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {unreadCount} تعليق جديد
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 flex-1 overflow-hidden">
                    {/* Images Section */}
                    <div className="flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1">
                            <div className="space-y-4 pr-4">
                        <div className="space-y-4">
                            <h3 className="font-semibold">صور قبل العمل</h3>
                            <div className="mt-2 flex items-center gap-2 flex-wrap p-2 bg-muted rounded-md min-h-[120px]">
                                {canShowImages && report.beforeImages && report.beforeImages.length > 0 ? 
                                            report.beforeImages.map((img, i) => {
                                                const commentCount = getImageCommentCount(img);
                                                const hasUnread = hasUnreadComments(img);
                                                const isSelected = selectedImage?.url === img;
                                                
                                                return (
                                                    <div 
                                                        key={`before-${i}`} 
                                                        className={cn(
                                                            "relative group",
                                                            isSelected && "ring-2 ring-primary rounded-lg",
                                                            commentCount > 0 && "ring-2 ring-orange-500 rounded-lg"
                                                        )}
                                                    >
                                                        <FullImageViewer 
                                                            src={img}
                                                            allImages={report.beforeImages}
                                                            currentIndex={i}
                                                        />
                                                        
                                                        {/* Comment count badge */}
                                                        {commentCount > 0 && (
                                                            <Badge 
                                                                variant={hasUnread ? "destructive" : "secondary"}
                                                                className="absolute top-1 left-1 h-6 w-6 flex items-center justify-center p-0 text-xs rounded-full"
                                                            >
                                                                {commentCount}
                                                            </Badge>
                                                        )}
                                                        
                                                        {/* Unread indicator */}
                                                        {hasUnread && (
                                                            <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                                        )}
                                                        
                                                        {/* Comment button */}
                                                        <Button
                                                            size="sm"
                                                            variant={commentCount > 0 ? "default" : "secondary"}
                                                            className={cn(
                                                                "absolute bottom-1 right-1 h-6 text-xs",
                                                                commentCount > 0 && "bg-orange-500 hover:bg-orange-600"
                                                            )}
                                                            onClick={() => setSelectedImage({ url: img, type: 'before' })}
                                                        >
                                                            <MessageCircle className="h-3 w-3" />
                                                            {commentCount > 0 && (
                                                                <span className="ml-1">{commentCount}</span>
                                                            )}
                                                        </Button>
                                                    </div>
                                                );
                                            }) :
                                    <p className="text-sm text-muted-foreground">{canShowImages ? 'لا توجد صور قبل العمل.' : 'الصور غير متاحة للعرض حالياً.'}</p>
                                }
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold">صور بعد العمل</h3>
                            <div className="mt-2 flex items-center gap-2 flex-wrap p-2 bg-muted rounded-md min-h-[120px]">
                                 {canShowImages && report.afterImages && report.afterImages.length > 0 ? 
                                            report.afterImages.map((img, i) => {
                                                const commentCount = getImageCommentCount(img);
                                                const hasUnread = hasUnreadComments(img);
                                                const isSelected = selectedImage?.url === img;
                                                
                                                return (
                                                    <div 
                                                        key={`after-${i}`} 
                                                        className={cn(
                                                            "relative group",
                                                            isSelected && "ring-2 ring-primary rounded-lg",
                                                            commentCount > 0 && "ring-2 ring-orange-500 rounded-lg"
                                                        )}
                                                    >
                                                        <FullImageViewer 
                                                            src={img}
                                                            allImages={report.afterImages}
                                                            currentIndex={i}
                                                        />
                                                        
                                                        {/* Comment count badge */}
                                                        {commentCount > 0 && (
                                                            <Badge 
                                                                variant={hasUnread ? "destructive" : "secondary"}
                                                                className="absolute top-1 left-1 h-6 w-6 flex items-center justify-center p-0 text-xs rounded-full"
                                                            >
                                                                {commentCount}
                                                            </Badge>
                                                        )}
                                                        
                                                        {/* Unread indicator */}
                                                        {hasUnread && (
                                                            <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                                        )}
                                                        
                                                        {/* Comment button */}
                                                        <Button
                                                            size="sm"
                                                            variant={commentCount > 0 ? "default" : "secondary"}
                                                            className={cn(
                                                                "absolute bottom-1 right-1 h-6 text-xs",
                                                                commentCount > 0 && "bg-orange-500 hover:bg-orange-600"
                                                            )}
                                                            onClick={() => setSelectedImage({ url: img, type: 'after' })}
                                                        >
                                                            <MessageCircle className="h-3 w-3" />
                                                            {commentCount > 0 && (
                                                                <span className="ml-1">{commentCount}</span>
                                                            )}
                                                        </Button>
                                                    </div>
                                                );
                                            }) :
                                    <p className="text-sm text-muted-foreground">{canShowImages ? 'لا توجد صور بعد العمل.' : 'الصور غير متاحة للعرض حالياً.'}</p>
                                 }
                            </div>
                        </div>
                    </div>
                        </ScrollArea>
                                </div>

                    {/* Comments Section */}
                    <div className="flex flex-col overflow-hidden h-full">
                        <Card className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="flex-shrink-0 pb-3">
                                <CardTitle className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="h-5 w-5" />
                                        {selectedImage ? (
                                            <div className="flex items-center gap-2">
                                                <span>التعليقات على الصورة المحددة</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {selectedImage.type === 'before' ? 'قبل العمل' : 'بعد العمل'}
                                                </Badge>
                            </div>
                                        ) : (
                                            <span>جميع الملاحظات والردود</span>
                                        )}
                                 </div>
                                    <div className="flex items-center gap-2">
                                        {selectedImage && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedImage(null)}
                                                className="h-7 text-xs"
                                            >
                                                عرض الكل
                                            </Button>
                                        )}
                                        {filteredComments.length > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                {filteredComments.reduce((count, comment) => count + 1 + (comment.replies?.length || 0), 0)} تعليق
                                            </Badge>
                                        )}
                             </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                                <div className="flex-1 relative overflow-hidden">
                                    <ScrollArea 
                                        className="h-full px-6 pt-4"
                                        onScrollCapture={handleScroll}
                                    >
                                        <div className="space-y-3 pb-4">
                                            {loading ? (
                                                <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
                                            ) : filteredComments.length === 0 ? (
                                                <div className="text-center text-muted-foreground py-8">
                                                    {selectedImage ? (
                                                        <>
                                                            <p>لا توجد تعليقات على هذه الصورة.</p>
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                onClick={() => setSelectedImage(null)}
                                                                className="mt-2"
                                                            >
                                                                عرض جميع التعليقات
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <p>لا توجد تعليقات بعد.</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    {filteredComments.map(comment => (
                                                        <CommentThread 
                                                            key={comment.id} 
                                                            comment={comment} 
                                                            userType={userType}
                                                            onReply={handleReply}
                                                            onConfirmClose={handleConfirmClose}
                                                        />
                                                    ))}
                                                    {/* Element for scrolling to bottom */}
                                                    <div ref={commentsEndRef} className="h-1" />
                                                </>
                                            )}
                                        </div>
                                    </ScrollArea>
                                    
                                    {/* Scroll to bottom button */}
                                    {showScrollButton && (
                                        <Button
                                            onClick={scrollToBottom}
                                            size="icon"
                                            className="absolute left-8 bottom-4 rounded-full shadow-lg z-10"
                                            variant="secondary"
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                
                                {/* Fixed Input Area */}
                                <div className="flex-shrink-0 space-y-2 border-t bg-background pt-4 px-6 pb-4">
                                    {selectedImage && (
                                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                            <ImageIcon className="h-4 w-4" />
                                            <span className="text-sm">
                                                تعليق على صورة {selectedImage.type === 'before' ? 'قبل' : 'بعد'} العمل
                                            </span>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setSelectedImage(null)}
                                                className="ml-auto h-6"
                                            >
                                                إلغاء
                                            </Button>
                            </div>
                        )}
                                    <Textarea 
                                        value={newComment} 
                                        onChange={(e) => setNewComment(e.target.value)} 
                                        placeholder="اكتب تعليقك أو ملاحظتك هنا..."
                                        className="min-h-[70px] max-h-[120px] resize-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && e.ctrlKey) {
                                                handleAddComment();
                                            }
                                        }}
                                    />
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            اضغط Ctrl + Enter للإرسال السريع
                                        </span>
                                        <Button onClick={handleAddComment} disabled={!newComment.trim()} size="default">
                                            <Send className="h-4 w-4 ml-2" />
                                            إضافة تعليق
                                        </Button>
                                 </div>
                             </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function NotesTable({ notes }: { notes: Note[] }) {
    if (notes.length === 0) return <p className="text-sm text-muted-foreground">لا توجد ملاحظات.</p>;

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>الملاحظة</TableHead>
                        <TableHead className="w-[120px]">التاريخ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {notes.map(note => (
                        <TableRow key={note.id}>
                            <TableCell className="break-words">{note.text}</TableCell>
                            <TableCell>{format(parseISO(note.date), 'dd/MM/yy')}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}


function ClientReviewPageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [data, setData] = React.useState<WorkPlanReport[]>([]);
  const [selectedReportId, setSelectedReportId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [targetImageUrl, setTargetImageUrl] = React.useState<string | null>(null);
  const [targetImageType, setTargetImageType] = React.useState<'before' | 'after' | null>(null);
  
  // Determine userType based on actual user role
  // If user is CLIENT, force userType to 'client' and don't allow switching
  const actualUserType: 'client' | 'reviewer' = React.useMemo(() => {
    if (user?.role === 'CLIENT') return 'client';
    return 'reviewer';
  }, [user?.role]);
  
  const [userType, setUserType] = React.useState<'client' | 'reviewer'>(actualUserType);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);
  
  // Update userType when actualUserType changes
  React.useEffect(() => {
    setUserType(actualUserType);
  }, [actualUserType]);

  // Fetch work plans from API
  const fetchWorkPlans = React.useCallback(async () => {
    try {
      setIsLoading(true);
      // Include atmReports to get images (but API will optimize by excluding large images)
      // Limit to 100 records for better performance (images are large)
      const response = await fetch('/api/work-plans?includeReports=true&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch work plans');
      }
      const workPlans = await response.json();
      
      // Transform work plans to work plan reports format
      // Create a separate report entry for each ATM in the work plan
      const reports: WorkPlanReport[] = [];
      
      workPlans.forEach((plan: any) => {
        let atmCodes: string[] = [];
        let atmReports: any = {};
        
        try {
          atmCodes = JSON.parse(plan.atmCodes || '[]');
        } catch (e) {
          console.error('Error parsing atmCodes:', e);
        }
        
        try {
          atmReports = JSON.parse(plan.atmReports || '{}');
        } catch (e) {
          console.error('Error parsing atmReports:', e);
        }

        // If no ATM codes, create one entry with 'N/A'
        if (atmCodes.length === 0) {
          reports.push({
            id: String(plan.id),
            startDate: plan.startDate,
            endDate: plan.endDate,
            orderNumber: String(plan.id).slice(0, 8),
            executionDate: plan.startDate,
            atmCode: 'N/A',
            atmSerial: 'N/A',
            atmAddress: plan.city,
            representative: plan.representativeId?.toString() || 'N/A',
            status: (plan.status === 'completed' ? 'Accepted' : plan.status === 'pending' ? 'Pending' : 'Rejected') as WorkPlanReportStatus,
            beforeImages: [],
            afterImages: [],
            notes: [],
            bankName: plan.bankName,
            governorate: plan.governorate,
            city: plan.city,
            statement: plan.statement,
          });
        } else {
          // Create a separate report entry for each ATM code
          atmCodes.forEach((atmCode: string, index: number) => {
            // Get ATM-specific data
            const atmData = atmReports[atmCode] || {
              beforeImages: [],
              afterImages: [],
              notes: [],
              status: 'pending'
            };
            
            // Get status from ATM-specific data, fallback to plan status
            const atmStatus = atmData.status || plan.status || 'pending';
            const reportStatus = (atmStatus === 'completed' ? 'Accepted' : atmStatus === 'pending' ? 'Pending' : 'Rejected') as WorkPlanReportStatus;
            
            reports.push({
              id: `${plan.id}-${index}`, // Unique ID for each ATM entry
              startDate: plan.startDate,
              endDate: plan.endDate,
              orderNumber: String(plan.id).slice(0, 8),
              executionDate: plan.startDate,
              atmCode: atmCode,
              atmSerial: 'N/A',
              atmAddress: plan.city,
              representative: plan.representativeId?.toString() || 'N/A',
              status: reportStatus,
              beforeImages: atmData.beforeImages || [],
              afterImages: atmData.afterImages || [],
              notes: atmData.notes || [],
              bankName: plan.bankName,
              governorate: plan.governorate,
              city: plan.city,
              statement: plan.statement,
              workPlanId: plan.id, // Keep reference to original work plan
            });
          });
        }
      });
      
      setData(reports);
    } catch (error) {
      console.error('Error fetching work plans:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل خطط العمل",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchWorkPlans();
  }, [fetchWorkPlans]);

  // Auto-refresh data every 30 seconds to get latest images
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchWorkPlans();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchWorkPlans]);

  // Refresh data when dialog opens to ensure latest images are shown
  React.useEffect(() => {
    if (selectedReportId) {
      // Refresh data when opening a report dialog
      fetchWorkPlans();
    }
  }, [selectedReportId, fetchWorkPlans]);

  // Handle query parameters to open specific report and image
  React.useEffect(() => {
    const workPlanId = searchParams.get('workPlanId');
    const atmCode = searchParams.get('atmCode');

    if (workPlanId && atmCode && data.length > 0) {
      // Get image info from sessionStorage (to avoid URL length issues)
      let imageUrl: string | null = null;
      let imageType: 'before' | 'after' | null = null;
      
      if (typeof window !== 'undefined') {
        try {
          imageUrl = sessionStorage.getItem('targetImageUrl');
          const storedImageType = sessionStorage.getItem('targetImageType');
          if (storedImageType === 'before' || storedImageType === 'after') {
            imageType = storedImageType;
          }
          // Clear sessionStorage after reading
          sessionStorage.removeItem('targetImageUrl');
          sessionStorage.removeItem('targetImageType');
        } catch (error) {
          console.warn('Failed to read image info from sessionStorage:', error);
        }
      }

      // Find the report that matches workPlanId and atmCode
      const targetReport = data.find(report => {
        const reportWorkPlanId = report.workPlanId || parseInt(report.id.split('-')[0]);
        return reportWorkPlanId === parseInt(workPlanId) && report.atmCode === atmCode;
      });

      if (targetReport) {
        setSelectedReportId(targetReport.id);
        if (imageUrl) {
          setTargetImageUrl(imageUrl);
          setTargetImageType(imageType);
        }
        
        // Clear URL parameters after opening
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('workPlanId');
          url.searchParams.delete('atmCode');
          url.searchParams.delete('commentId');
          window.history.replaceState({}, '', url.pathname);
        }
      }
    }
  }, [searchParams, data]);

  const selectedReport = React.useMemo(() => data.find(r => r.id === selectedReportId) || null, [data, selectedReportId]);
  
  const handleNoteAdd = async (reportId: string, note: Note) => {
    try {
      // Get current report and notes
      const currentReport = data.find(r => r.id === reportId);
      if (!currentReport) {
        throw new Error('Report not found');
      }
      
      const updatedNotes = [...(currentReport.notes || []), note];
      
      // Use workPlanId if available, otherwise extract from id
      const workPlanId = currentReport.workPlanId || parseInt(reportId.split('-')[0]);
      const atmCode = currentReport.atmCode;
      
      console.log('Saving note for ATM:', atmCode, 'workPlanId:', workPlanId);
      
      const response = await fetch('/api/work-plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: workPlanId,
          atmCode: atmCode,
          notes: updatedNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      // Update local state only for this specific ATM report
      setData(currentData =>
        currentData.map(report =>
          report.id === reportId
            ? { ...report, notes: updatedNotes }
            : report
        )
      );
      
      console.log('Note saved successfully for ATM:', atmCode);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الملاحظة",
        variant: "destructive",
      });
    }
  };

  const statusVariant = {
      Accepted: 'default',
      Pending: 'secondary',
      Rejected: 'destructive',
  } as const;
  
  const columns: ColumnDef<WorkPlanReport>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'رقم الطلب',
    },
    {
      accessorKey: 'executionDate',
      header: 'تاريخ التنفيذ',
      cell: ({ row }) => format(parseISO(row.getValue('executionDate')), 'dd/MM/yyyy'),
    },
    {
      accessorKey: 'atmCode',
      header: 'كود المكينة',
    },
    {
      accessorKey: 'atmAddress',
      header: 'عنوان المكينة',
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
          const status = row.getValue('status') as keyof typeof statusVariant;
          return <Badge variant={statusVariant[status]}>{status}</Badge>;
      }
    },
    {
        id: 'actions',
        header: 'استعراض',
        cell: ({ row }) => (
            <Button variant="outline" onClick={() => setSelectedReportId(row.original.id)}>
                <MessageCircle className="h-4 w-4 ml-2" />
                عرض التفاصيل
            </Button>
        )
    }
  ];

  const tableData = React.useMemo(() => {
    let filteredData = data;
    
    // Filter by user type
    if (userType === 'client') {
      filteredData = filteredData.filter(report => report.status === 'Accepted');
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredData = filteredData.filter(report => 
        report.atmCode?.toLowerCase().includes(query) ||
        report.orderNumber?.toLowerCase().includes(query) ||
        report.atmAddress?.toLowerCase().includes(query) ||
        format(parseISO(report.executionDate), 'dd/MM/yyyy').includes(query)
      );
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      filteredData = filteredData.filter(report => {
        const reportDate = parseISO(report.executionDate);
        const reportDateOnly = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
        
        if (dateFrom && dateTo) {
          const fromDateOnly = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
          const toDateOnly = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
          return reportDateOnly >= fromDateOnly && reportDateOnly <= toDateOnly;
        } else if (dateFrom) {
          const fromDateOnly = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
          return reportDateOnly >= fromDateOnly;
        } else if (dateTo) {
          const toDateOnly = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
          return reportDateOnly <= toDateOnly;
        }
        return true;
      });
    }
    
    return filteredData;
  }, [data, userType, searchQuery, dateFrom, dateTo]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      // The `data` is already memoized, so we pass it directly
    },
  });

  return (
    <div className="w-full p-4 md:p-8">
        <div className="flex items-center justify-between py-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-headline">نظام متابعة ومراجعة أعمال الصيانة</h2>
                <p className="text-muted-foreground">
                    استعرض صور الأعمال، أضف تعليقاتك وردودك على الملاحظات.
                </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Show view switcher only for non-CLIENT users */}
              {user?.role !== 'CLIENT' && (
                <div className="flex items-center gap-2" suppressHydrationWarning>
                  <Label>عرض كـ:</Label>
                  <Button variant={userType === 'client' ? 'default' : 'outline'} onClick={() => setUserType('client')}>عميل</Button>
                  <Button variant={userType === 'reviewer' ? 'default' : 'outline'} onClick={() => setUserType('reviewer')}>مراجع</Button>
                </div>
              )}
              <Button 
                variant="outline"
                onClick={fetchWorkPlans}
                disabled={isLoading}
                suppressHydrationWarning
              >
                <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
                {isLoading ? 'جاري التحديث...' : 'تحديث'}
              </Button>
            </div>
        </div>

        <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-md md:w-2/3 lg:w-1/3 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    type="search"
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-10 appearance-none bg-background shadow-none"
                    suppressHydrationWarning
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "justify-start text-right font-normal",
                                !dateFrom && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "من تاريخ"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "justify-start text-right font-normal",
                                !dateTo && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "dd/MM/yyyy") : "إلى تاريخ"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            disabled={(date) =>
                                dateFrom ? date < dateFrom : false
                            }
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {(dateFrom || dateTo) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setDateFrom(undefined);
                            setDateTo(undefined);
                        }}
                        className="h-9"
                    >
                        <X className="h-4 w-4" />
                        مسح
                    </Button>
                )}
            </div>
            
            <div className="text-sm text-muted-foreground">
                عرض {tableData.length} من {data.length} سجل
            </div>
        </div>

        <div className="rounded-md border mt-4">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                    ))}
                </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {isLoading && data.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span>جاري تحميل البيانات...</span>
                    </div>
                    </TableCell>
                </TableRow>
                ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                    لا توجد تقارير لعرضها.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        {selectedReport && (
             <ReviewDetailsDialog 
                report={selectedReport} 
                open={!!selectedReportId}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedReportId(null);
                        setTargetImageUrl(null);
                        setTargetImageType(null);
                    } else {
                        // Refresh data when opening dialog to get latest images
                        fetchWorkPlans();
                    }
                }}
                userType={userType}
                onNoteAdd={handleNoteAdd}
                targetImageUrl={targetImageUrl}
                targetImageType={targetImageType}
            />
        )}
    </div>
  );
}

export default function ClientReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    }>
      <ClientReviewPageContent />
    </Suspense>
  );
}
