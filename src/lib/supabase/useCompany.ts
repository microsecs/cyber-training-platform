"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useCompany() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        setError("Not signed in");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("memberships")
        .select("company_id, role, is_active, companies(name)")
        .eq("user_id", authData.user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error || !data) {
        setError(error?.message || "No active company membership found");
        setLoading(false);
        return;
      }

      const c: any = Array.isArray(data.companies)
        ? data.companies[0]
        : data.companies;

      setCompany({
        companyId: data.company_id,
        companyName: c?.name ?? "Company",
        role: data.role,
        userId: authData.user.id,
        email: authData.user.email ?? "",
      });

      setLoading(false);
    })();
  }, []);

  return { company, loading, error };
}
