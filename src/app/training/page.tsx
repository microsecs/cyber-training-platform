const courses = [
  {
    title: "Phishing Awareness",
    desc: "Recognize suspicious messages, fake login pages, and social engineering tactics.",
    length: "6 min",
    quiz: "5 questions",
  },
  {
    title: "Password Security",
    desc: "Create stronger passwords and understand why password reuse creates risk.",
    length: "5 min",
    quiz: "4 questions",
  },
  {
    title: "Business Email Compromise",
    desc: "Spot payment fraud, executive impersonation, and vendor account takeover attempts.",
    length: "8 min",
    quiz: "6 questions",
  },
  {
    title: "Safe Web Browsing",
    desc: "Avoid malicious downloads, unsafe links, fake updates, and compromised websites.",
    length: "7 min",
    quiz: "5 questions",
  },
  {
    title: "MFA & Account Protection",
    desc: "Understand multi-factor authentication, push fatigue, and secure account recovery.",
    length: "6 min",
    quiz: "5 questions",
  },
  {
    title: "Protecting Company Data",
    desc: "Handle sensitive company and customer data responsibly in everyday work.",
    length: "7 min",
    quiz: "5 questions",
  },
];

export default function TrainingPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div>
        <div className="text-sm text-cyan-300">Training Library</div>
        <h1 className="mt-1 text-4xl font-bold">Security Awareness Courses</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Assign short, focused training modules to employees and track completion.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <article key={course.title} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            <div className="flex h-44 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
              <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-300">
                ▶ Preview Video
              </div>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-semibold">{course.title}</h2>
              <p className="mt-3 min-h-16 text-sm leading-6 text-slate-400">{course.desc}</p>
              <div className="mt-4 flex gap-4 text-xs text-slate-500">
                <span>{course.length}</span>
                <span>{course.quiz}</span>
              </div>
              <div className="mt-5 flex gap-3">
                <button className="flex-1 rounded-lg bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950">
                  Assign
                </button>
                <button className="rounded-lg border border-white/10 px-4 py-2.5 font-medium">
                  Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
