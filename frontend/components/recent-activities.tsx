'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, Code, FileText, GitCommit, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState, memo } from "react"
import { useAuth } from "@/lib/auth-context"
import { getRelativeDate, cn } from "@/lib/utils"
import { unifiedApi } from "@/lib/unified-api"
import { useQuery } from "@tanstack/react-query"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface Activity {
  id: string;
  show_id: string;
  title: string;
  description: string;
  points: number;
  user_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  type: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "task":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
    case "report":
      return <FileText className="h-3.5 w-3.5 text-blue-400" />
    case "discussion":
      return <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
    case "code":
      return <Code className="h-3.5 w-3.5 text-yellow-400" />
    default:
      return <GitCommit className="h-3.5 w-3.5 text-gray-400" />
  }
}

export const RecentActivities = memo(() => {
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10; // 每页显示数量

  const { user } = useAuth();

  // 使用 React Query 来管理 API 调用
  const { data: fetchedData, isLoading: apiLoading, error: apiError } = useQuery({
    queryKey: ['recentActivities', user?.id, currentPage, perPage],
    queryFn: () => unifiedApi.activity.getRecentActivities(user!.id, currentPage, perPage),
    enabled: !!user?.id,
    staleTime: 30000, // 30秒缓存
    refetchOnWindowFocus: false, // 避免窗口聚焦时重复请求
  });

  // 处理数据映射
  const activities: Activity[] = fetchedData?.success && fetchedData.data?.activities
    ? fetchedData.data.activities.map((activity: any) => ({
        id: activity.id,
        show_id: activity.showId || activity.show_id,
        title: activity.title,
        description: activity.description,
        points: activity.points,
        user_id: activity.userId || activity.user_id,
        status: activity.status,
        created_at: activity.createdAt || activity.created_at,
        completed_at: activity.completedAt || activity.completed_at,
        user: {
          name: activity.user ? activity.user.name : "未知用户",
          avatar: activity.user ? activity.user.avatar : "/placeholder-user.jpg",
          initials: activity.user ? (activity.user.name ? activity.user.name[0] : "无") : "无",
        },
        type: activity.status || "default",
      }))
    : [];

  const totalPages = fetchedData?.success && fetchedData.data
    ? Math.max(1, Math.ceil(fetchedData.data.total / fetchedData.data.per_page))
    : 1;

  if (apiLoading) {
    return <div className="text-center text-muted-foreground">加载中...</div>;
  }

  if (apiError) {
    return <div className="text-center text-destructive">错误: {apiError}</div>;
  }

  if (!fetchedData || !fetchedData.success || !fetchedData.data || !fetchedData.data.activities || fetchedData.data.activities.length === 0) {
    return <div className="text-center text-muted-foreground">暂无最新活动。</div>;
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePaginationClick = (page: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handlePageChange(page);
  };

  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <TooltipProvider key={activity.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={activity.show_id ? `/activities/${activity.show_id}` : '#'}>
                <div className="flex items-center p-3 rounded-lg hover:bg-muted/20 transition-colors duration-300">
                  <div className="relative">
                    <Avatar className="h-9 w-9 border transition-colors duration-300 dark:border-white/10 border-black/5 shadow-sm">
                      <AvatarImage src={activity.user.avatar} alt="Avatar" />
                      <AvatarFallback className="bg-primary/10 text-primary">{activity.user.initials}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="ml-4 space-y-1 overflow-hidden flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{activity.user.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {activity.title}
                    </p>
                    <div className="flex items-center">
                      <p className="text-xs text-muted-foreground">
                        {getRelativeDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-auto font-medium">
                    <div className="data-pill bg-primary/10 text-primary shadow-sm">
                      +{activity.points} 积分
                    </div>
                  </div>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{activity.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={handlePaginationClick(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {[...Array(Math.max(1, totalPages))].map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === index + 1}
                  onClick={handlePaginationClick(index + 1)}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={handlePaginationClick(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
});

RecentActivities.displayName = 'RecentActivities';

