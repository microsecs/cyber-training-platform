import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requirePlatformAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const authClient = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data } = await authClient.auth.getUser(token);
  if (!data.user) return null;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  return row ? data.user : null;
}

function statusLabel(company: any) {
  if (company.billing_exempt === true) {
    return { key: "active", label: "Active · Billing Exempt" };
  }

  const status = String(company.subscription_status || "inactive").toLowerCase();

  if (status === "active") return { key: "active", label: "Active" };
  if (status === "trialing") return { key: "active", label: "Trial" };
  if (status === "past_due") return { key: "past_due", label: "Past Due" };
  if (status === "canceled" || status === "cancelled") {
    return { key: "inactive", label: "Canceled" };
  }

  return { key: "inactive", label: status ? status.replaceAll("_", " ") : "Inactive" };
}

export async function GET(request: NextRequest) {
  const user = await requirePlatformAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Platform Admin required." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: companies, error: companyError } = await admin
    .from("companies")
    .select(
      "id,name,created_at,subscription_status,billing_exempt,subscription_current_period_end,subscription_cancel_at_period_end,stripe_customer_id"
    )
    .order("created_at", { ascending: false });

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  const companyIds = (companies || []).map((company: any) => company.id);

  if (!companyIds.length) {
    return NextResponse.json({ companies: [] });
  }

  const [membershipResult, invitationResult] = await Promise.all([
    admin
      .from("memberships")
      .select("company_id,user_id,role,is_active")
      .in("company_id", companyIds),
    admin
      .from("invitations")
      .select("company_id,id,email,status,role,created_at")
      .in("company_id", companyIds),
  ]);

  if (membershipResult.error) {
    return NextResponse.json({ error: membershipResult.error.message }, { status: 500 });
  }

  if (invitationResult.error) {
    return NextResponse.json({ error: invitationResult.error.message }, { status: 500 });
  }

  const memberships = membershipResult.data || [];
  const invitations = invitationResult.data || [];

  const rows = (companies || []).map((company: any) => {
    const companyMemberships = memberships.filter(
      (row: any) => row.company_id === company.id
    );
    const companyInvitations = invitations.filter(
      (row: any) => row.company_id === company.id
    );

    const employees = companyMemberships.filter(
      (row: any) => row.role === "employee"
    );

    const activeEmployees = employees.filter(
      (row: any) => row.is_active !== false
    ).length;

    const ownerAdmins = companyMemberships.filter(
      (row: any) =>
        (row.role === "owner" || row.role === "admin") &&
        row.is_active !== false
    ).length;

    const employeeInvitations = companyInvitations.filter(
      (row: any) => !row.role || row.role === "employee"
    );

    const pendingInvitations = employeeInvitations.filter(
      (row: any) => String(row.status || "").toLowerCase() === "pending"
    ).length;

    const acceptedInvitations = employeeInvitations.filter(
      (row: any) =>
        ["accepted", "complete", "completed"].includes(
          String(row.status || "").toLowerCase()
        )
    ).length;

    const status = statusLabel(company);

    return {
      id: company.id,
      name: company.name || "Unnamed Company",
      created_at: company.created_at,
      status_key: status.key,
      status_label: status.label,
      subscription_status: company.subscription_status,
      billing_exempt: company.billing_exempt === true,
      subscription_current_period_end: company.subscription_current_period_end,
      subscription_cancel_at_period_end:
        company.subscription_cancel_at_period_end === true,
      stripe_customer_id: company.stripe_customer_id,
      invited_employees: employeeInvitations.length,
      pending_invitations: pendingInvitations,
      accepted_invitations: acceptedInvitations,
      active_employees: activeEmployees,
      employee_memberships: employees.length,
      owners_admins: ownerAdmins,
    };
  });

  return NextResponse.json({ companies: rows });
}

export async function DELETE(request: NextRequest) {
  const user = await requirePlatformAdmin(request);
  if (!user) {
    return NextResponse.json({ error: "Platform Admin required." }, { status: 403 });
  }

  const body = await request.json();
  const companyId = String(body?.companyId || "").trim();
  const confirmation = String(body?.confirmation || "").trim();

  if (!companyId) {
    return NextResponse.json({ error: "Company ID is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id,name")
    .eq("id", companyId)
    .maybeSingle();

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  if (confirmation !== company.name) {
    return NextResponse.json(
      { error: "Type the company name exactly to confirm deletion." },
      { status: 400 }
    );
  }

  const { error: deleteError } = await admin.rpc("platform_delete_company", {
    target_company_id: companyId,
  });

  if (deleteError) {
    console.error("Platform company deletion error", deleteError);
    return NextResponse.json(
      {
        error:
          "Could not delete the company. Make sure the platform-company-management SQL patch has been run.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: `${company.name} was deleted.`,
  });
}
