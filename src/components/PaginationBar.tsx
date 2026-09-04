"use client";

import { useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

interface paginatiotProps {
  totalPage: number;
  currentPage: number;
}

export default function PaginationBar({
  totalPage,
  currentPage = 1,
}: paginatiotProps) {
  const searchParams = useSearchParams();

  if (totalPage < 2) return null;

  function getLink(page: number) {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", page.toString());
    return `?${newSearchParams.toString()}`;
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={getLink(currentPage - 1)}
            className={`text-muted-foreground ${currentPage === 1 ? "pointer-events-none" : ""}`}
          />
        </PaginationItem>
        {Array.from({ length: totalPage }).map((_, i) => {
          const page = i + 1;
          const isEdge = page === 1 || page === totalPage;
          const isNearCurrentPage = Math.abs(page - currentPage) <= 2;
          if (!isEdge && !isNearCurrentPage) {
            if (i === 1 || i === totalPage - 2) {
              return (
                <PaginationItem key={page} className="hidden md:block">
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return null;
          }

          return (
            <PaginationItem
              key={page}
              className={
                currentPage === page ? "pointer-events-none" : undefined
              }
            >
              <PaginationLink
                isActive={page === currentPage}
                href={getLink(page)}
                className={`${page === currentPage ? "pointer-events-none" : ""}`}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext
            href={getLink(currentPage + 1)}
            className={`text-muted-foreground ${currentPage === totalPage && "pointer-events-none"}`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
