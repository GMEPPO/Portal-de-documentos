"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option = {
  value: string;
  label: string;
};

export function DocumentsFilters({
  initialQuery,
  initialStatus,
  initialCategory,
  initialDepartment,
  initialTags,
  categories,
  departments,
  tags,
  statuses,
  labels,
}: {
  initialQuery: string;
  initialStatus: string;
  initialCategory: string;
  initialDepartment: string;
  initialTags: string[];
  categories: Option[];
  departments: Option[];
  tags: Option[];
  statuses: Option[];
  labels: {
    queryPlaceholder: string;
    status: string;
    category: string;
    department: string;
    tag: string;
    search: string;
    clear: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState(initialCategory);
  const [department, setDepartment] = useState(initialDepartment);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  const targetUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (department) params.set("department", department);
    if (selectedTags.length > 0) params.set("tag", selectedTags.join(","));

    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [category, department, pathname, query, selectedTags, status]);

  useEffect(() => {
    setQuery(initialQuery);
    setStatus(initialStatus);
    setCategory(initialCategory);
    setDepartment(initialDepartment);
    setSelectedTags(initialTags);
  }, [initialCategory, initialDepartment, initialQuery, initialStatus, initialTags]);

  useEffect(() => {
    const currentParams = new URLSearchParams();

    if (initialQuery.trim()) currentParams.set("q", initialQuery.trim());
    if (initialStatus) currentParams.set("status", initialStatus);
    if (initialCategory) currentParams.set("category", initialCategory);
    if (initialDepartment) currentParams.set("department", initialDepartment);
    if (initialTags.length > 0) currentParams.set("tag", initialTags.join(","));

    const currentSearch = currentParams.toString();
    const currentUrl = currentSearch ? `${pathname}?${currentSearch}` : pathname;

    if (targetUrl === currentUrl) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace(targetUrl);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [
    initialCategory,
    initialDepartment,
    initialTags,
    initialQuery,
    initialStatus,
    pathname,
    router,
    targetUrl,
  ]);

  function submitFilters() {
    router.replace(targetUrl);
  }

  function clearFilters() {
    setQuery("");
    setStatus("");
    setCategory("");
    setDepartment("");
    setSelectedTags([]);
    router.replace(pathname);
  }

  function toggleTag(value: string) {
    setSelectedTags((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  }

  const hasActiveFilters =
    !!(initialQuery || initialStatus || initialCategory || initialDepartment || query || status || category || department) ||
    initialTags.length > 0 ||
    selectedTags.length > 0;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.queryPlaceholder}
        />
        <Select value={status || "__all__"} onValueChange={(value) => setStatus(value === "__all__" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder={labels.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{labels.status}</SelectItem>
            {statuses.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category || "__all__"} onValueChange={(value) => setCategory(value === "__all__" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder={labels.category} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{labels.category}</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={department || "__all__"}
          onValueChange={(value) => setDepartment(value === "__all__" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={labels.department} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{labels.department}</SelectItem>
            {departments.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-400">{labels.tag}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => toggleTag(item.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  selectedTags.includes(item.value)
                    ? "border-amber-300/40 bg-amber-300/10 text-amber-100"
                    : "border-slate-700 bg-slate-900/40 text-slate-300 hover:bg-slate-800/40",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row">
        <Button type="button" onClick={submitFilters}>
          {labels.search}
        </Button>
        {hasActiveFilters && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            {labels.clear}
          </Button>
        )}
      </div>
    </div>
  );
}
