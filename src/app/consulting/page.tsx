import Link from "next/link";

export const metadata = {
  title: "IT Consulting | MicroSECONDS",
  description: "San Diego IT consulting, computer support, networking, cybersecurity, backup, cloud, Microsoft 365, Google Workspace, and data recovery services.",
};

const services = [
  ["support", "IT Support & Troubleshooting", ["On-site and remote help for home and office","Workstation setup, repair, and maintenance","Software installation and configuration","Mobile device setup and configuration","Windows and Apple computers"]],
  ["network", "Network Setup & Management", ["Router, switch, and Wi-Fi setup","Office network installation","VPN and remote access configuration"]],
  ["security", "Cybersecurity Essentials", ["Antivirus and endpoint protection","Firewall setup and basic security hardening","Email security and anti-phishing protection","Security monitoring","Breach mitigation"]],
  ["backup", "Backup & Data Protection", ["PC and server backup solutions","Cloud-to-cloud and offline backups","Data recovery"]],
  ["server", "Server & Storage Solutions", ["Small-business server or NAS setup","User and permission management","Local and cloud hybrid backups"]],
  ["office", "Business Technology Setup", ["VoIP phone system setup","Office technology setup — printers, cameras, and conferencing devices","Support for office moves and new installations","Copier setup"]],
  ["planning", "IT Consulting & Planning", ["Technology assessments","Upgrade and migration planning","Vendor and internet service coordination"]],
  ["cloud", "Cloud & Email Services", ["Microsoft 365 and Google Workspace setup, management, and troubleshooting","Email migrations","Cloud file storage setup","Website development and troubleshooting"]],
];

function ServiceIcon({ type }: { type: string }) {
  const paths: Record<string, React.ReactNode> = {
    support: <><path d="M8 3h8v3H8z"/><path d="M5 7h14v10H5z"/><path d="M9 21h6M12 17v4"/></>,
    network: <><circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 7v4M5 16v-3h14v3M12 11H5v5M12 11h7v5"/></>,
    security: <><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    backup: <><path d="M7 18a5 5 0 0 1 .7-9.95A6 6 0 0 1 19 10a4 4 0 0 1-1 7.87"/><path d="M12 11v9M9 14l3-3 3 3"/></>,
    server: <><rect x="4" y="4" width="16" height="6" rx="1"/><rect x="4" y="14" width="16" height="6" rx="1"/><path d="M8 7h.01M8 17h.01M12 7h5M12 17h5"/></>,
    office: <><path d="M4 21V8h10v13M14 12h6v9M7 11h2M7 15h2M7 19h2M17 15h1M17 18h1"/></>,
    planning: <><path d="M4 20h16M6 17l4-5 3 2 5-7"/><path d="M15 7h3v3"/></>,
    cloud: <><path d="M7 18a5 5 0 0 1 .7-9.95A6 6 0 0 1 19 10a4 4 0 0 1-1 8H7Z"/><path d="M9 13h6M9 16h4"/></>,
  };

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {paths[type]}
      </svg>
    </div>
  );
}

export default function ConsultingPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-7 md:p-10">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">MicroSECONDS Computer Consulting</div>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Technology moves fast. We help you stay headed in the right direction.</h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">With <strong className="text-white">nearly 40 years of experience</strong> in computer repair, data recovery, networking, and all things geek, MicroSECONDS is here to be your go-to solution for your technology needs.</p>
            <p className="mt-4 max-w-4xl leading-7 text-slate-400">From home and small-business networking to computer repairs, backups, cybersecurity, cloud services, and data recovery, we provide practical help without making technology more complicated than it needs to be.</p>
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-6">
            <div className="text-sm font-semibold text-cyan-300">San Diego Area IT Support</div>
            <div className="mt-2 text-2xl font-bold text-white">Need help with your technology?</div>
            <p className="mt-3 text-sm leading-6 text-slate-400">On-site and remote support for businesses and home users throughout the San Diego area.</p>
            <Link href="/support" className="mt-5 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Contact MicroSECONDS</Link>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-7 md:p-10">
        <h2 className="text-3xl font-bold text-white">IT without the headaches.</h2>
        <div className="mt-5 grid gap-5 text-slate-300 md:grid-cols-2">
          <p className="leading-7">When you&apos;re running a business, the last thing you need is an IT problem slowing you down. Whether you&apos;re troubleshooting a system or service, dealing with a computer that simply won&apos;t cooperate, or planning your next upgrade, we&apos;ll help you find the right solution with confidence.</p>
          <p className="leading-7">Computers can be intimidating, but you don&apos;t have to face them alone. Instead of spending your day wrestling with technology, let MicroSECONDS handle the hard stuff and get you back online so you can focus on what matters most.</p>
        </div>
      </section>

      <section className="mt-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">What We Do</div>
        <h2 className="mt-2 text-3xl font-bold text-white">Complete technology support for home and business</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {services.map(([icon, title, items]) => (
            <article key={title as string} className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <div className="flex items-center gap-4">
                <ServiceIcon type={icon as string} />
                <h3 className="text-xl font-semibold text-white">{title}</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-400">
                {(items as string[]).map((item) => <li key={item} className="flex gap-3"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" /><span>{item}</span></li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 px-7 py-8 text-center">
        <h2 className="text-3xl font-bold text-white">Let us handle the hard stuff.</h2>
        <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-400">If you&apos;re in the San Diego area and need computer support, networking, cybersecurity, cloud services, or help planning your next technology project, contact MicroSECONDS.</p>
        <Link href="/support" className="mt-6 inline-flex rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Get IT Support</Link>
      </section>
    </main>
  );
}
