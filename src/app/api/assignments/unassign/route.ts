import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

import { getUserCompanySubscriptionAccess } from "@/lib/subscriptionServer";
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: userData, error: userError } =
      await userClient.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const subscriptionAccess = await getUserCompanySubscriptionAccess(userData.user.id);
    if (!subscriptionAccess.allowed) {
      return NextResponse.json(
        { error: "An active MicroSECONDS subscription is required for this company-management action." },
        { status: 402 }
      );
    }

    const { assignmentId } = await request.json();

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Missing assignmentId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: assignment, error: assignmentError } = await admin
      .from("assignments")
      .select("id,user_id,company_id,status,courses(title)")
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const { data: requester } = await admin
      .from("memberships")
      .select("role")
      .eq("company_id", assignment.company_id)
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .in("role", ["owner", "admin"])
      .maybeSingle();

    if (!requester) {
      return NextResponse.json(
        { error: "Company admin access required" },
        { status: 403 }
      );
    }

    if (assignment.status === "completed") {
      return NextResponse.json(
        {
          error:
            "Completed training cannot be unassigned because it is part of the employee's training history.",
        },
        { status: 409 }
      );
    }

    // Remove any reminder records for this assignment.
    const { error: reminderError } = await admin
      .from("training_reminders")
      .delete()
      .eq("assignment_id", assignment.id);

    if (reminderError) {
      return NextResponse.json(
        { error: reminderError.message },
        { status: 500 }
      );
    }

    // Normally incomplete assignments should not have completion rows,
    // but remove any partial/accidental records defensively.
    const { error: completionError } = await admin
      .from("completions")
      .delete()
      .eq("assignment_id", assignment.id);

    if (completionError) {
      return NextResponse.json(
        { error: completionError.message },
        { status: 500 }
      );
    }

    const { error: deleteError } = await admin
      .from("assignments")
      .delete()
      .eq("id", assignment.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not unassign training",
      },
      { status: 500 }
    );
  }
}
