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

type Option = {
  value: string;
  label: string;
};

export function DocumentsFilters({
  initialQuery,
  initialStatus,
  initialCategory,
  initialDepartment,
  initialTag,
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
  initialTag: string;
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
  const [tag, setTag] = useState(initialTag);

  const targetUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (department) params.set("department", department);
    if (tag) params.set("tag", tag);

    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [category, department, pathname, query, status, tag]);

  useEffect(() => {
    setQuery(initialQuery);
    setStatus(initialStatus);
    setCategory(initialCategory);
    setDepartment(initialDepartment);
    setTag(initialTag);
  }, [initialCategory, initialDepartment, initialQuery, initialStatus, initialTag]);

  useEffect(() => {
    const currentParams = new URLSearchParams();

    if (initialQuery.trim()) currentParams.set("q", initialQuery.trim());
    if (initialStatus) currentParams.set("status", initialStatus);
    if (initialCategory) currentParams.set("category", initialCategory);
    if (initialDepartment) currentParams.set("department", initialDepartment);
    if (initialTag) currentParams.set("tag", initialTag);

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
    initialTag,
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
    setTag("");
    router.replace(pathname);
  }

  return (
    <div className="grid gap-3 md:grid-cols-5">
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
      <Select value={tag || "__all__"} onValueChange={(value) => setTag(value === "__all__" ? "" : value)}>
        <SelectTrigger>
          <SelectValue placeholder={labels.tag} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{labels.tag}</SelectItem>
          {tags.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="md:col-span-5 flex flex-col gap-3 md:flex-row">
        <Button type="button" onClick={submitFilters}>
          {labels.search}
        </Button>
        {(initialQuery || initialStatus || initialCategory || initialDepartment || initialTag || query || status || category || department || tag) && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            {labels.clear}
          </Button>
        )}
      </div>
    </div>
  );
}
