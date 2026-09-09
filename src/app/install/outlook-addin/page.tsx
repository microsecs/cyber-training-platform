import Link from "next/link";

export default function OutlookAddinInstallPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="text-sm font-medium text-cyan-300">MicroSECONDS Email Analyzer</div>
        <h1 className="mt-1 text-4xl font-bold">Install the Outlook Add-in</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-400">
          Install MicroSECONDS Email Analyzer in Outlook to analyze the email you are viewing directly
          from your inbox. You do not need to save the message, upload a file, or copy and paste it.
        </p>

        <section className="mt-7 rounded-2xl border border-cyan-400/20 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Download the add-in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Download the MicroSECONDS Outlook manifest file, then add it to Outlook using Outlook&apos;s
            custom add-in installation option.
          </p>
          <a href="/api/outlook-addin/download" download
             className="mt-5 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
            Download Outlook Add-in
          </a>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-2xl font-semibold">Installation instructions</h2>
          <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <li><b className="text-white">1. Download the manifest.</b> Click the button above and save the XML file.</li>
            <li><b className="text-white">2. Open Outlook.</b> Open the add-ins management screen for your Outlook account.</li>
            <li><b className="text-white">3. Add a custom add-in.</b> Choose the option to install an add-in from a file and select the downloaded XML manifest.</li>
            <li><b className="text-white">4. Confirm installation.</b> Accept Outlook&apos;s prompt to install the custom add-in.</li>
            <li><b className="text-white">5. Open an email.</b> Select MicroSECONDS Email Analyzer from Outlook&apos;s add-ins/apps menu.</li>
            <li><b className="text-white">6. Sign in.</b> Use your MicroSECONDS account and complete MFA if your account requires it.</li>
            <li><b className="text-white">7. Analyze.</b> Click <b className="text-white">Analyze with MicroSECONDS</b> to analyze the currently open message.</li>
          </ol>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Microsoft 365 administrators</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Administrators can deploy the same manifest centrally instead of having each user install it.
            Microsoft 365 policies determine whether individual users can install custom add-ins.
          </p>
        </section>

        <div className="mt-7">
          <Link href="/phishing-check" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            ← Back to Email Risk Analyzer
          </Link>
        </div>
      </div>
    </main>
  );
}
