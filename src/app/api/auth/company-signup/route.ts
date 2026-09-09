import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

async function findAuthUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) throw error;

    const match = data.users.find(
      (user) => String(user.email || "").trim().toLowerCase() === email
    );

    if (match) return match;
    if (data.users.length < 1000) return null;
    page += 1;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || "");
    const companyName = String(body?.company || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (!companyName) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }

    const admin = createAdminClient();
    const existingUser = await findAuthUserByEmail(admin, email);

    if (existingUser) {
      const { data: memberships, error: membershipError } = await admin
        .from("memberships")
        .select("company_id,is_active,companies(id,name)")
        .eq("user_id", existingUser.id);

      if (membershipError) throw membershipError;

      const hasCompany = (memberships || []).some((membership: any) => {
        const company = Array.isArray(membership.companies)
          ? membership.companies[0]
          : membership.companies;
        return membership.is_active !== false && Boolean(company?.id);
      });

      const { data: platformAdmin } = await admin
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (hasCompany || platformAdmin) {
        return NextResponse.json(
          {
            error:
              "An account already exists for this email. Please use Sign In or Forgot Password.",
          },
          { status: 409 }
        );
      }

      // The Auth user survived a previously deleted company. Remove that orphan
      // before recreating the company account so Supabase sends a normal
      // confirmation email and the signup starts with a fresh user id.
      const { error: deleteUserError } = await admin.auth.admin.deleteUser(existingUser.id);
      if (deleteUserError) throw deleteUserError;
    }

    // Use the normal public signup path on the client after orphan cleanup.
    // This preserves the project's configured email-confirmation behavior.
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Company signup preparation failed", error);
    return NextResponse.json(
      { error: error?.message || "Could not prepare company signup." },
      { status: 500 }
    );
  }
}
