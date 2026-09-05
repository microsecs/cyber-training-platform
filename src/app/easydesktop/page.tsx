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
              <a
                href="https://www.youtube.com/@easydesktoptutorials"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-white/5"
              >
                Watch Tutorials
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

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Product Overview
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
              See EasyDesktop 10 in action.
            </h2>
            <p className="mt-3 leading-7 text-slate-400">
              Watch a quick introduction to EasyDesktop and see how it can simplify
              your Windows 11 desktop, organize frequently used items, and put useful
              Windows tools within easy reach.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/YWHCpfb37cg"
                title="EasyDesktop 10 Introduction"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>


      <section className="mt-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
          See EasyDesktop in Action
        </div>
        <h2 className="mt-2 max-w-4xl text-3xl font-bold tracking-tight text-white">
          Powerful tools, without the Windows clutter.
        </h2>

        <div className="mt-6 grid gap-5">
          <article className="grid overflow-hidden rounded-2xl border border-white/10 bg-slate-900 lg:grid-cols-2 lg:items-center">
            <img
              src="https://static.wixstatic.com/media/87282c_7b0b63c6263140d699ad25f076dcfbfb~mv2.jpg/v1/fill/w_900,h_610,al_c,q_90/drag.jpg"
              alt="EasyDesktop drag and drop setup"
              className="h-full w-full object-cover"
            />
            <div className="p-7 md:p-9">
              <h3 className="text-2xl font-semibold text-white">Drag-and-drop simplicity</h3>
              <p className="mt-3 leading-7 text-slate-400">
                Drag an icon, file, shortcut, or link directly onto an EasyDesktop menu button
                and let EasyDesktop handle the setup. Fine-tune appearance and launch behavior
                whenever you want.
              </p>
            </div>
          </article>

          <article className="grid overflow-hidden rounded-2xl border border-white/10 bg-slate-900 lg:grid-cols-2 lg:items-center">
            <div className="order-2 p-7 md:p-9 lg:order-1">
              <h3 className="text-2xl font-semibold text-white">Customize nearly everything</h3>
              <p className="mt-3 leading-7 text-slate-400">
                EasyDesktop 10 gives you 18 customizable menu pages. Change toolbar colors,
                buttons, backgrounds, fonts, and layouts so the desktop works the way you do.
              </p>
            </div>
            <img
              src="https://static.wixstatic.com/media/87282c_072730d6f106487ba0862edce9b3b606~mv2.jpg/v1/fill/w_900,h_640,al_c,q_90/custom2.jpg"
              alt="EasyDesktop customization options"
              className="order-1 h-full w-full object-cover lg:order-2"
            />
          </article>

          <article className="grid overflow-hidden rounded-2xl border border-white/10 bg-slate-900 lg:grid-cols-2 lg:items-center">
            <img
              src="https://static.wixstatic.com/media/87282c_fb98f9c19f254ee9b099e692807ba1f0~mv2.jpg/v1/fill/w_900,h_610,al_c,q_90/panels.jpg"
              alt="EasyDesktop Windows settings panels"
              className="h-full w-full object-cover"
            />
            <div className="p-7 md:p-9">
              <h3 className="text-2xl font-semibold text-white">Windows settings in one click</h3>
              <p className="mt-3 leading-7 text-slate-400">
                Open Windows 11 settings, classic control panels, search tools, Recycle Bin
                functions, and other frequently used Windows features without digging through menus.
              </p>
            </div>
          </article>

          <article className="grid overflow-hidden rounded-2xl border border-white/10 bg-slate-900 lg:grid-cols-2 lg:items-center">
            <div className="order-2 p-7 md:p-9 lg:order-1">
              <h3 className="text-2xl font-semibold text-white">Drives and folders</h3>
              <p className="mt-3 leading-7 text-slate-400">
                Instantly browse disk drives and common locations such as Documents,
                Downloads, and Pictures.
              </p>
            </div>
            <img
              src="https://static.wixstatic.com/media/87282c_02859a7ed89a4b5bb9b8e57b2dc3b76c~mv2.jpg/v1/fill/w_900,h_610,al_c,q_90/explore.jpg"
              alt="EasyDesktop drive and folder explorer"
              className="order-1 h-full w-full object-cover lg:order-2"
            />
          </article>

          <article className="grid overflow-hidden rounded-2xl border border-white/10 bg-slate-900 lg:grid-cols-2 lg:items-center">
            <img
              src="https://static.wixstatic.com/media/87282c_c91e0d1382104718b567921750db80eb~mv2.jpg/v1/fill/w_900,h_610,al_c,q_90/power.jpg"
              alt="EasyDesktop shutdown restart and lock controls"
              className="h-full w-full object-cover"
            />
            <div className="p-7 md:p-9">
              <h3 className="text-2xl font-semibold text-white">Power controls</h3>
              <p className="mt-3 leading-7 text-slate-400">
                Shut down, restart, or lock Windows quickly, including a configurable
                shutdown delay in case you change your mind.
              </p>
            </div>
          </article>

          <article className="grid overflow-hidden rounded-2xl border border-white/10 bg-slate-900 lg:grid-cols-2 lg:items-center">
            <div className="order-2 p-7 md:p-9 lg:order-1">
              <h3 className="text-2xl font-semibold text-white">Disk-space at a glance</h3>
              <p className="mt-3 leading-7 text-slate-400">
                View free space and drive information immediately, including an easy visual
                reference for storage usage.
              </p>
            </div>
            <img
              src="https://static.wixstatic.com/media/87282c_a74e58ef24d04e5b9d8f62d818621248~mv2.jpg/v1/fill/w_900,h_582,al_c,q_90/space.jpg"
              alt="EasyDesktop disk space viewer"
              className="order-1 h-full w-full object-cover lg:order-2"
            />
          </article>

          <article className="grid overflow-hidden rounded-2xl border border-white/10 bg-slate-900 lg:grid-cols-2 lg:items-center">
            <img
              src="https://static.wixstatic.com/media/87282c_adb6266c3bae4fb0b31cd0e5d08e2668~mv2.jpg/v1/fill/w_900,h_569,al_c,q_90/fontsamples.jpg"
              alt="EasyDesktop font samples utility"
              className="h-full w-full object-cover"
            />
            <div className="p-7 md:p-9">
              <h3 className="text-2xl font-semibold text-white">Fonts and more</h3>
              <p className="mt-3 leading-7 text-slate-400">
                Preview installed fonts, print sample sheets, secure higher-level editing
                features with Administrator Lock, and use other built-in utilities.
              </p>
            </div>
          </article>
        </div>

        <div className="mt-6 text-center">
          <a
            href="https://www.youtube.com/@easydesktoptutorials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl border border-white/15 bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-white/5"
          >
            Watch EasyDesktop Tutorials on YouTube
          </a>
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
          <a
            href="https://www.youtube.com/@easydesktoptutorials"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/15 bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-white/5"
          >
            Watch Tutorials
          </a>
        </div>
      </section>
    </main>
  );
}
