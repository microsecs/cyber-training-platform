import Link from "next/link";

export const metadata = {
  title: "EasyDesktop 10 | MicroSECONDS",
  description:
    "EasyDesktop 10 is a powerful Windows 11 desktop organizer with an 18-page customizable menu, drag-and-drop setup, macros, system tools, and more.",
};

const features = [
  "Launch over 1,200 programs, apps, documents, emails, and web links",
  "18 fully customizable menu pages",
  "Drag-and-drop setup for files, shortcuts, and links",
  "Customizable buttons, colors, backgrounds, and fonts",
  "Macro support for automatic post-launch keystrokes",
  "Quick access to Windows 11 settings and system tools",
  "One-click browsing of drives and common folders",
  "One-click shutdown, restart, and workstation lock",
  "Disk-space viewer with visual drive information",
  "Special-character inserter",
  "Hot key and hot corner menu access",
  "Administrator Lock and password protection",
  "Font preview and sample printing",
  "Optimized specifically for Windows 11",
];

const highlights = [
  {
    title: "Your entire desktop, organized",
    text: "Put your most-used programs, documents, web links, email shortcuts, and more on an easy-to-read 18-page menu. EasyDesktop gives you fast access to the things you use every day without cluttering your Windows desktop.",
  },
  {
    title: "Drag-and-drop simplicity",
    text: "Drag an icon, file, shortcut, or link directly onto an EasyDesktop menu button and let EasyDesktop handle the setup. Fine-tune the appearance and launch behavior whenever you want.",
  },
  {
    title: "Customize nearly everything",
    text: "Choose page layouts, button colors, toolbar colors, backgrounds, and fonts. With 18 menu pages to work with, EasyDesktop can be organized around the way you actually use your computer.",
  },
  {
    title: "Windows tools without the digging",
    text: "Open Windows settings, classic control panels, common folders, disk drives, search tools, Recycle Bin functions, and other frequently used Windows features with far fewer clicks.",
  },
  {
    title: "Power-user features built in",
    text: "Use macros to send keystrokes after launching an application, view available disk space, insert special characters into active applications, secure editing functions with Administrator Lock, and more.",
  },
  {
    title: "Built for Windows 11",
    text: "EasyDesktop 10 is designed for computers capable of effectively running Windows 11 and provides a fast, efficient way to organize and control your Windows environment.",
  },
];

export default function EasyDesktopPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
        <div className="grid gap-8 p-7 md:p-10 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Software by MicroSECONDS
            </div>

            <h1 className="mt-3 text-5xl font-bold tracking-tight text-white md:text-6xl">
              EasyDesktop <span className="text-cyan-300">10</span>
            </h1>

            <p className="mt-4 max-w-3xl text-xl leading-8 text-slate-300">
              A powerful Windows 11 desktop organizer that puts your programs,
              files, links, settings, system tools, and more within easy reach.
            </p>

            <p className="mt-4 max-w-3xl leading-7 text-slate-400">
              Launch more than 1,200 items from a customizable 18-page menu,
              organize your desktop with drag-and-drop simplicity, and take
              control of Windows without digging through endless menus.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="https://www.microseconds.com/product-page/easydesktop-10"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Buy EasyDesktop 10
              </a>

              <a
                href="https://github.com/microsecs/EasyDesktop/releases/download/10/ed10trial.zip"
                className="rounded-xl border border-white/15 bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-white/5"
              >
                Download 15-Day Trial
              </a>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              EasyDesktop 10 requires Windows 11.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-7">
            <div className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-300">
              Key Features
            </div>

            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
              {features.slice(0, 8).map((feature) => (
                <li key={feature} className="flex gap-3">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          Why EasyDesktop?
        </div>

        <h2 className="mt-2 max-w-4xl text-3xl font-bold tracking-tight text-white">
          Fast access to the things you use most.
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-slate-900 p-6"
            >
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-7 md:p-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              More Built-In Tools
            </div>

            <h2 className="mt-2 text-3xl font-bold text-white">
              More than just an application launcher.
            </h2>

            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
              {features.slice(8).map((feature) => (
                <li key={feature} className="flex gap-3">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950 p-7">
            <div className="text-3xl font-bold text-white">
              “Managing Windows without cuteness.”
            </div>
            <div className="mt-3 text-sm font-semibold text-cyan-300">
              — PC Magazine
            </div>

            <p className="mt-6 leading-7 text-slate-400">
              EasyDesktop has always focused on practical Windows organization:
              less clutter, fewer clicks, faster access, and powerful tools for
              people who want to get things done.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-900 px-7 py-9 text-center">
        <h2 className="text-3xl font-bold text-white">
          Try EasyDesktop 10 for yourself.
        </h2>

        <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-400">
          Download the 15-day trial and see how much easier Windows can be when
          everything you use is organized and only a click away.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="https://github.com/microsecs/EasyDesktop/releases/download/10/ed10trial.zip"
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Download 15-Day Trial
          </a>

          <Link
            href="/support"
            className="rounded-xl border border-white/15 bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-white/5"
          >
            EasyDesktop Support
          </Link>
        </div>
      </section>
    </main>
  );
}
