import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const FROM_EMAIL =
  "MicroSECONDS Training <training@microseconds.com>";

export async function POST(
  req: NextRequest
) {
  try {
    const token =
      req.headers
        .get("authorization")
        ?.replace(
          "Bearer ",
          ""
        );

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Not authenticated",
        },
        { status: 401 }
      );
    }

    const supabase =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          global: {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
          auth: {
            persistSession:
              false,
            autoRefreshToken:
              false,
          },
        }
      );

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser(
        token
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid session",
        },
        { status: 401 }
      );
    }

    const {
      courseId,
      userIds = [],
      pendingInvitationIds = [],
      dueDate,
      quizRequired,
      remindersEnabled,
    } = await req.json();

    if (
      !courseId ||
      (!Array.isArray(
        userIds
      ) &&
        !Array.isArray(
          pendingInvitationIds
        ))
    ) {
      return NextResponse.json(
        {
          error:
            "Choose a course and at least one employee.",
        },
        { status: 400 }
      );
    }

    if (
      !userIds.length &&
      !pendingInvitationIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "Choose at least one employee or pending invitation.",
        },
        { status: 400 }
      );
    }

    const {
      data: membership,
      error:
        membershipError,
    } = await supabase
      .from("memberships")
      .select(
        "company_id,role,is_active,companies(name)"
      )
      .eq(
        "user_id",
        userData.user.id
      )
      .eq(
        "is_active",
        true
      )
      .in(
        "role",
        ["owner", "admin"]
      )
      .limit(1)
      .single();

    if (
      membershipError ||
      !membership
    ) {
      return NextResponse.json(
        {
          error:
            "Admin access required",
        },
        { status: 403 }
      );
    }

    const {
      data: courseRow,
      error: courseError,
    } = await supabase
      .from("courses")
      .select("id,title")
      .eq(
        "id",
        courseId
      )
      .single();

    if (
      courseError ||
      !courseRow
    ) {
      return NextResponse.json(
        {
          error:
            "Training course not found",
        },
        { status: 404 }
      );
    }

    const effectiveRemindersEnabled =
      Boolean(dueDate) &&
      remindersEnabled !== false;

    let assignableUserIds:
      string[] = [];

    if (
      userIds.length
    ) {
      const {
        data:
          existingActive,
        error:
          existingError,
      } = await supabase
        .from(
          "assignments"
        )
        .select(
          "user_id,status"
        )
        .eq(
          "company_id",
          membership.company_id
        )
        .eq(
          "course_id",
          courseId
        )
        .in(
          "user_id",
          userIds
        )
        .neq(
          "status",
          "completed"
        );

      if (existingError) {
        return NextResponse.json(
          {
            error:
              existingError.message,
          },
          { status: 400 }
        );
      }

      const activeUserIds =
        new Set(
          (
            existingActive ??
            []
          ).map(
            (row) =>
              row.user_id
          )
        );

      assignableUserIds =
        userIds.filter(
          (id: string) =>
            !activeUserIds.has(
              id
            )
        );
    }

    const admin =
      createAdminClient();

    let validInvites:
      any[] = [];

    if (
      pendingInvitationIds.length
    ) {
      const {
        data:
          pendingInviteRows,
        error:
          inviteError,
      } = await admin
        .from(
          "invitations"
        )
        .select(
          "id,email,company_id,role,status"
        )
        .eq(
          "company_id",
          membership.company_id
        )
        .eq(
          "role",
          "employee"
        )
        .eq(
          "status",
          "pending"
        )
        .in(
          "id",
          pendingInvitationIds
        );

      if (inviteError) {
        return NextResponse.json(
          {
            error:
              inviteError.message,
          },
          { status: 400 }
        );
      }

      validInvites =
        pendingInviteRows ??
        [];
    }

    let existingPendingIds =
      new Set<string>();

    if (
      validInvites.length
    ) {
      const {
        data:
          existingPending,
        error:
          pendingLookupError,
      } = await admin
        .from(
          "pending_assignments"
        )
        .select(
          "invitation_id"
        )
        .eq(
          "course_id",
          courseId
        )
        .in(
          "invitation_id",
          validInvites.map(
            (invite) =>
              invite.id
          )
        );

      if (
        pendingLookupError
      ) {
        return NextResponse.json(
          {
            error:
              pendingLookupError.message,
          },
          { status: 400 }
        );
      }

      existingPendingIds =
        new Set(
          (
            existingPending ??
            []
          ).map(
            (row) =>
              row.invitation_id
          )
        );
    }

    const assignableInvites =
      validInvites.filter(
        (invite) =>
          !existingPendingIds.has(
            invite.id
          )
      );

    const activeRows =
      assignableUserIds.map(
        (userId: string) => ({
          company_id:
            membership.company_id,
          course_id:
            courseId,
          user_id:
            userId,
          due_date:
            dueDate ||
            null,
          assigned_by:
            userData.user!.id,
          status:
            "not_started",
          quiz_required:
            quizRequired !==
            false,
          reminders_enabled:
            effectiveRemindersEnabled,
        })
      );

    let insertedActive:
      any[] = [];

    if (
      activeRows.length
    ) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "assignments"
        )
        .insert(
          activeRows
        )
        .select(
          "id,user_id"
        );

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message,
          },
          { status: 400 }
        );
      }

      insertedActive =
        data ?? [];
    }

    const pendingRows =
      assignableInvites.map(
        (invite) => ({
          company_id:
            membership.company_id,
          invitation_id:
            invite.id,
          course_id:
            courseId,
          due_date:
            dueDate ||
            null,
          assigned_by:
            userData.user!.id,
          quiz_required:
            quizRequired !==
            false,
          reminders_enabled:
            effectiveRemindersEnabled,
        })
      );

    let insertedPending:
      any[] = [];

    if (
      pendingRows.length
    ) {
      const {
        data,
        error,
      } = await admin
        .from(
          "pending_assignments"
        )
        .insert(
          pendingRows
        )
        .select(
          "id,invitation_id"
        );

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message,
          },
          { status: 400 }
        );
      }

      insertedPending =
        data ?? [];
    }

    const apiKey =
      process.env
        .RESEND_API_KEY;

    const companyRow: any =
      Array.isArray(
        membership.companies
      )
        ? membership.companies[0]
        : membership.companies;

    let emailsSent = 0;
    let emailFailures = 0;

    if (apiKey) {
      const resend =
        new Resend(apiKey);

      const appUrl =
        process.env
          .NEXT_PUBLIC_APP_URL ||
        "https://cyber-training-platform-seven.vercel.app";

      if (
        assignableUserIds.length
      ) {
        const {
          data: profiles,
        } = await supabase
          .from("profiles")
          .select(
            "id,email,full_name"
          )
          .in(
            "id",
            assignableUserIds
          );

        for (
          const profile of
            profiles ?? []
        ) {
          if (
            !profile.email
          ) {
            emailFailures++;
            continue;
          }

          const {
            error:
              emailError,
          } =
            await resend.emails.send(
              {
                from:
                  FROM_EMAIL,
                to:
                  profile.email,
                subject:
                  `New Training Assigned: ${courseRow.title}`,
                html:
                  assignmentEmail({
                    name:
                      profile.full_name,
                    companyName:
                      companyRow?.name,
                    courseTitle:
                      courseRow.title,
                    dueDate,
                    quizRequired,
                    remindersEnabled:
                      effectiveRemindersEnabled,
                    ctaUrl:
                      `${appUrl}/employee`,
                    pending:
                      false,
                  }),
              }
            );

          if (
            emailError
          ) {
            emailFailures++;
          } else {
            emailsSent++;
          }
        }
      }

      for (
        const invite of
          assignableInvites
      ) {
        const {
          error:
            emailError,
        } =
          await resend.emails.send(
            {
              from:
                FROM_EMAIL,
              to:
                invite.email,
              subject:
                `Training Assigned: ${courseRow.title}`,
              html:
                assignmentEmail({
                  name: null,
                  companyName:
                    companyRow?.name,
                  courseTitle:
                    courseRow.title,
                  dueDate,
                  quizRequired,
                  remindersEnabled:
                    effectiveRemindersEnabled,
                  ctaUrl:
                    appUrl,
                  pending:
                    true,
                }),
            }
          );

        if (emailError) {
          emailFailures++;
        } else {
          emailsSent++;
        }
      }
    }

    const count =
      insertedActive.length +
      insertedPending.length;

    if (!count) {
      return NextResponse.json(
        {
          error:
            "The selected people already have this active or pending training assignment.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        count,
        activeCount:
          insertedActive.length,
        pendingCount:
          insertedPending.length,
        remindersEnabled:
          effectiveRemindersEnabled,
        emailsSent,
        emailFailures,
      }
    );
  } catch (
    error: any
  ) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not assign training",
      },
      { status: 500 }
    );
  }
}

function assignmentEmail({
  name,
  companyName,
  courseTitle,
  dueDate,
  quizRequired,
  remindersEnabled,
  ctaUrl,
  pending,
}: {
  name:
    | string
    | null
    | undefined;
  companyName:
    | string
    | null
    | undefined;
  courseTitle: string;
  dueDate:
    | string
    | null
    | undefined;
  quizRequired: boolean;
  remindersEnabled: boolean;
  ctaUrl: string;
  pending: boolean;
}) {
  const dueText =
    dueDate
      ? new Date(
          dueDate +
            "T00:00:00"
        ).toLocaleDateString(
          "en-US"
        )
      : "No due date";

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#172033">
      <div style="font-size:13px;font-weight:bold;letter-spacing:.08em;color:#0891b2;text-transform:uppercase">
        MicroSECONDS Training
      </div>

      <h1 style="font-size:28px;line-height:1.2;margin:10px 0 18px">
        New training has been assigned
      </h1>

      <p>Hello ${
        name || "there"
      },</p>

      <p>
        ${
          companyName ||
          "Your company"
        } has assigned you <strong>${courseTitle}</strong>.
      </p>

      <p><strong>Due date:</strong> ${dueText}</p>
      <p><strong>Quiz:</strong> ${
        quizRequired
          ? "Required"
          : "Not required"
      }</p>
      <p><strong>Automatic reminders:</strong> ${
        remindersEnabled
          ? "Enabled"
          : "Off"
      }</p>

      ${
        pending
          ? `<p style="font-size:15px;line-height:1.6">
               This training will appear in your account as soon as you accept your MicroSECONDS employee invitation.
             </p>`
          : ""
      }

      <p style="margin:28px 0">
        <a
          href="${ctaUrl}"
          style="display:inline-block;background:#22d3ee;color:#082f49;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:bold"
        >
          ${
            pending
              ? "Open MicroSECONDS"
              : "Start Training"
          }
        </a>
      </p>

      <p style="font-size:13px;color:#64748b">
        MicroSECONDS Training<br />
        Cybersecurity Awareness Training
      </p>
    </div>
  `;
}
