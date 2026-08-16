"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompany } from "@/lib/supabase/useCompany";

type Membership = { user_id: string; role: string };
type Profile = { id: string; email: string | null; full_name: string | null };

type Assignment = {
  id: string;
  user_id: string;
  status: "not_started" | "in_progress" | "completed";
  due_date: string | null;
  created_at: string;
  quiz_required: boolean;
  courses:
    | { id: string; title: string }
    | { id: string; title: string }[]
    | null;
  completions:
    | { score: number | null; completed_at: string }
    | { score: number | null; completed_at: string }[]
    | null;
};

type ReportRow = {
  assignmentId: string;
  employeeId: string;
  employeeName: string;
  email: string;
  courseTitle: string;
  assignedAt: string;
  status: string;
  dueDate: string | null;
  quizRequired: boolean;
  score: number | null;
  completedAt: string | null;
  overdue: boolean;
};

export default function ReportsPage() {
  const { company, loading } = useCompany();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  useEffect(() => {
    if (!company) return;
    const supabase = createClient();

    async function loadReport() {
      setLoadError("");

      const membershipResult = await supabase
        .from("memberships")
        .select("user_id,role")
        .eq("company_id", company!.companyId)
        .eq("role", "employee");

      if (membershipResult.error) {
        setLoadError(membershipResult.error.message);
        return;
      }

      const memberships = (membershipResult.data as Membership[]) ?? [];
      const userIds = memberships.map((m) => m.user_id);

      if (!userIds.length) {
        setRows([]);
        return;
      }

      const [profileResult, assignmentResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,email,full_name")
          .in("id", userIds),

        supabase
          .from("assignments")
          .select(
            "id,user_id,status,due_date,created_at,quiz_required,courses(id,title),completions(score,completed_at)"
          )
          .eq("company_id", company!.companyId)
          .in("user_id", userIds)
          .order("created_at", { ascending: false }),
      ]);

      if (profileResult.error) {
        setLoadError(profileResult.error.message);
        return;
      }

      if (assignmentResult.error) {
        setLoadError(assignmentResult.error.message);
        return;
      }

      const profiles = (profileResult.data as Profile[]) ?? [];
      const assignments = (assignmentResult.data as Assignment[]) ?? [];

      const profileMap = new Map(
        profiles.map((p) => [
          p.id,
          {
            email: p.email ?? "",
            fullName: p.full_name ?? "",
          },
        ])
      );

      const reportRows: ReportRow[] = assignments.map((assignment) => {
        const course = Array.isArray(assignment.courses)
          ? assignment.courses[0]
          : assignment.courses;

        const completion = Array.isArray(assignment.completions)
          ? assignment.completions[0]
          : assignment.completions;

        const profile = profileMap.get(assignment.user_id);

        const overdue =
          !!assignment.due_date &&
          assignment.status !== "completed" &&
          new Date(assignment.due_date + "T23:59:59") < new Date();

        let displayStatus = "Not Started";
        if (assignment.status === "completed") displayStatus = "Completed";
        else if (overdue) displayStatus = "Overdue";
        else if (assignment.status === "in_progress") displayStatus = "In Progress";

        return {
          assignmentId: assignment.id,
          employeeId: assignment.user_id,
          employeeName:
            profile?.fullName ||
            profile?.email ||
            assignment.user_id,
          email: profile?.email || "",
          courseTitle: course?.title || "Training Course",
          assignedAt: assignment.created_at,
          status: displayStatus,
          dueDate: assignment.due_date,
          quizRequired: assignment.quiz_required,
          score: completion?.score ?? null,
          completedAt: completion?.completed_at ?? null,
          overdue,
        };
      });

      setRows(reportRows);
    }

    loadReport();
  }, [company]);

  const employeeOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => map.set(row.employeeId, row.employeeName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const normalizedStatus = row.status.toLowerCase().replaceAll(" ", "_");

      const statusMatch =
        statusFilter === "all" || normalizedStatus === statusFilter;

      const employeeMatch =
        employeeFilter === "all" || row.employeeId === employeeFilter;

      return statusMatch && employeeMatch;
    });
  }, [rows, statusFilter, employeeFilter]);

  const summary = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => r.status === "Completed").length;
    const overdue = rows.filter((r) => r.status === "Overdue").length;
    const inProgress = rows.filter((r) => r.status === "In Progress").length;
    const notStarted = rows.filter((r) => r.status === "Not Started").length;

    const scores = rows
      .map((r) => r.score)
      .filter((score): score is number => score !== null);

    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      overdue,
      inProgress,
      notStarted,
      averageScore,
      completionRate,
    };
  }, [rows]);

  function csvEscape(value: string | number | null | undefined) {
    const text = value == null ? "" : String(value);
    return /[",\n]/.test(text)
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  }

  function exportCsv() {
    const headers = [
      "Employee Name",
      "Employee Email",
      "Course",
      "Assigned Date",
      "Status",
      "Due Date",
      "Overdue",
      "Quiz Required",
      "Quiz Score",
      "Completed At",
    ];

    const bodyRows = filteredRows.map((row) => [
      row.employeeName,
      row.email,
      row.courseTitle,
      new Date(row.assignedAt).toLocaleString(),
      row.status,
      row.dueDate || "",
      row.overdue ? "Yes" : "No",
      row.quizRequired ? "Yes" : "No",
      row.score != null ? `${row.score}%` : "",
      row.completedAt
        ? new Date(row.completedAt).toLocaleString()
        : "",
    ]);

    const csv = [
      headers.map(csvEscape).join(","),
      ...bodyRows.map((row) =>
        row.map(csvEscape).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const companyPart = (company?.companyName || "company")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

    link.href = url;
    link.download = `${companyPart}-training-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        Loading reports...
      </main>
    );
  }

  if (!company || company.role === "employee") {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        Admin access required.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm text-cyan-300">
            {company.companyName}
          </div>

          <h1 className="mt-1 text-4xl font-bold">
            Training Reports
          </h1>

          <p className="mt-2 text-slate-400">
            Track employee assignments, progress, due dates, quiz results, and completion history.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={filteredRows.length === 0}
          className="rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {loadError && (
        <div className="mt-6 rounded-lg border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
          {loadError}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <div className="text-sm text-slate-400">Assignments</div>
          <div className="mt-2 text-3xl font-bold">{summary.total}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <div className="text-sm text-slate-400">Completion Rate</div>
          <div className="mt-2 text-3xl font-bold">
            {summary.completionRate}%
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <div className="text-sm text-slate-400">Overdue</div>
          <div className="mt-2 text-3xl font-bold">{summary.overdue}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <div className="text-sm text-slate-400">Average Quiz Score</div>
          <div className="mt-2 text-3xl font-bold">
            {summary.averageScore !== null
              ? `${summary.averageScore}%`
              : "—"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <div className="text-xs text-slate-500">Not Started</div>
          <div className="mt-1 text-2xl font-semibold">
            {summary.notStarted}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <div className="text-xs text-slate-500">In Progress</div>
          <div className="mt-1 text-2xl font-semibold">
            {summary.inProgress}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
          <div className="text-xs text-slate-500">Completed</div>
          <div className="mt-1 text-2xl font-semibold">
            {summary.completed}
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <label className="mb-2 block text-sm text-slate-300">
              Employee
            </label>

            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 p-3"
            >
              <option value="all">All Employees</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="mb-2 block text-sm text-slate-300">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 p-3"
            >
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          CSV export uses the currently selected employee and status filters.
        </div>
      </section>

      <section className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900">
        <div className="min-w-[1180px]">
          <div className="grid grid-cols-[1.2fr_1.2fr_.9fr_.75fr_.75fr_.65fr_.65fr_.7fr_1fr] gap-4 border-b border-white/10 bg-white/5 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <div>Employee</div>
            <div>Course</div>
            <div>Assigned</div>
            <div>Status</div>
            <div>Due</div>
            <div>Overdue</div>
            <div>Quiz</div>
            <div>Score</div>
            <div>Completed</div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">
              No report rows match the selected filters.
            </div>
          ) : (
            filteredRows.map((row) => (
              <div
                key={row.assignmentId}
                className="grid grid-cols-[1.2fr_1.2fr_.9fr_.75fr_.75fr_.65fr_.65fr_.7fr_1fr] gap-4 border-b border-white/10 px-5 py-5 text-sm last:border-0"
              >
                <div>
                  <div className="font-medium">
                    {row.employeeName}
                  </div>

                  {row.email &&
                  row.employeeName !== row.email ? (
                    <div className="mt-1 text-xs text-slate-500">
                      {row.email}
                    </div>
                  ) : null}
                </div>

                <div>{row.courseTitle}</div>

                <div className="text-slate-400">
                  {new Date(row.assignedAt).toLocaleDateString()}
                </div>

                <div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      row.status === "Completed"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : row.status === "Overdue"
                        ? "bg-rose-400/10 text-rose-300"
                        : row.status === "In Progress"
                        ? "bg-amber-400/10 text-amber-300"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>

                <div
                  className={
                    row.overdue
                      ? "text-rose-300"
                      : "text-slate-300"
                  }
                >
                  {row.dueDate
                    ? new Date(
                        row.dueDate + "T00:00:00"
                      ).toLocaleDateString()
                    : "—"}
                </div>

                <div>
                  {row.overdue ? (
                    <span className="font-semibold text-rose-300">
                      YES
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      No
                    </span>
                  )}
                </div>

                <div>
                  {row.quizRequired
                    ? "Required"
                    : "No Quiz"}
                </div>

                <div>
                  {row.score !== null
                    ? `${row.score}%`
                    : "—"}
                </div>

                <div className="text-slate-400">
                  {row.completedAt
                    ? new Date(
                        row.completedAt
                      ).toLocaleString()
                    : "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
