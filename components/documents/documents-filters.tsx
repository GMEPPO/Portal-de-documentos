"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  categories,
  departments,
  statuses,
}: {
  initialQuery: string;
  initialStatus: string;
  initialCategory: string;
  initialDepartment: string;
  categories: Option[];
  departments: Option[];
  statuses: Option[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState(initialCategory);
  const [department, setDepartment] = useState(initialDepartment);

  function submitFilters() {
    const params = new URLSearchParams();

    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (department) params.set("department", department);

    const search = params.toString();
    router.push(search ? `/documents?${search}` : "/documents");
  }

  function clearFilters() {
    setQuery("");
    setStatus("");
    setCategory("");
    setDepartment("");
    router.push("/documents");
  }

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Pesquisar titulo ou palavras dentro de documentos publicados..."
      />
      <Select value={status || "__all__"} onValueChange={(value) => setStatus(value === "__all__" ? "" : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Estado</SelectItem>
          {statuses.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={category || "__all__"} onValueChange={(value) => setCategory(value === "__all__" ? "" : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Categoria</SelectItem>
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
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Departamento</SelectItem>
          {departments.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="md:col-span-4 flex flex-col gap-3 md:flex-row">
        <Button type="button" onClick={submitFilters}>
          Pesquisar
        </Button>
        {(initialQuery || initialStatus || initialCategory || initialDepartment || query || status || category || department) && (
          <Button type="button" variant="outline" onClick={clearFilters}>
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
