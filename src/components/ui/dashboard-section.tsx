import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { EnhancedTable } from "./enhanced-table";

interface DashboardSectionProps<T> {
  title: string;
  icon: React.ElementType;
  data: T[] | undefined;
  columns: {
    key: keyof T;
    label: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  sortConfig: {
    key: keyof T | null;
    direction: "asc" | "desc";
  };
  requestSort: (key: keyof T) => void;
  onRowClick?: (item: T) => void;
  isLoading: boolean;
  viewAllLink?: string;
}

export function DashboardSection<T extends { id: string }>({
  title,
  icon: Icon,
  data,
  columns,
  sortConfig,
  requestSort,
  onRowClick,
  isLoading,
  viewAllLink,
}: DashboardSectionProps<T>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </div>
        </CardTitle>
        {viewAllLink && (
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href={viewAllLink}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <EnhancedTable
          data={data}
          columns={columns}
          sortConfig={sortConfig}
          onSort={requestSort}
          onRowClick={onRowClick}
          isLoading={isLoading}
          maxHeight="300px"
        />
      </CardContent>
    </Card>
  );
}
