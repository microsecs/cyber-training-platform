import Link from "next/link";

export const metadata = {
  title: "IT Consulting | MicroSECONDS",
  description: "San Diego IT consulting, computer support, networking, cybersecurity, backup, cloud, Microsoft 365, Google Workspace, and data recovery services.",
};

const services = [
  ["IT Support & Troubleshooting", ["On-site and remote help for home and office","Workstation setup, repair, and maintenance","Software installation and configuration","Mobile device setup and configuration","Windows and Apple computers"]],
  ["Network Setup & Management", ["Router, switch, and Wi-Fi setup","Office network installation","VPN and remote access configuration"]],
  ["Cybersecurity Essentials", ["Antivirus and endpoint protection","Firewall setup and basic security hardening","Email security and anti-phishing protection","Security monitoring","Breach mitigation"]],
  ["Backup & Data Protection", ["PC and server backup solutions","Cloud-to-cloud and offline backups","Data recovery"]],
  ["Server & Storage Solutions", ["Small-business server or NAS setup","User and permission management","Local and cloud hybrid backups"]],
  ["Business Technology Setup", ["VoIP phone system setup","Office technology setup — printers, cameras, and conferencing devices","Support for office moves and new installations","Copier setup"]],
  ["IT Consulting & Planning", ["Technology assessments","Upgrade and migration planning","Vendor and internet service coordination"]],
  ["Cloud & Email Services", ["Microsoft 365 and Google Workspace setup, management, and troubleshooting","Email migrations","Cloud file storage setup","Website development and troubleshooting"]],
];

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
          {services.map(([title, items]) => (
            <article key={title as string} className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h3 className="text-xl font-semibold text-white">{title}</h3>
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
