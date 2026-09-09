import Image from "next/image";
import Link from "next/link";

export default function OutlookAddinInstallPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="text-sm font-medium text-cyan-300">MicroSECONDS Email Analyzer</div>
        <h1 className="mt-1 text-4xl font-bold">Install the Outlook Add-in</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-400">
          Install MicroSECONDS Email Analyzer once, then analyze suspicious messages directly from
          Outlook without saving, uploading, copying, or pasting the email.
        </p>
        <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-5">
          <div className="font-semibold text-amber-200">Important: install through Outlook on the web</div>
          <p className="mt-2 text-sm leading-6 text-amber-100/80">
            Sign in to your Microsoft 365 / Office 365 email account in a web browser first.
            Microsoft currently handles custom XML add-in installation through the Add-Ins for Outlook
            dialog on the web. Install the add-in into the same mailbox where you want to use it.
          </p>
        </div>

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

          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950 p-5">
            <h3 className="text-lg font-semibold text-white">1. Sign in to Office 365 email on the web</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Go to <b className="text-white">outlook.office.com</b> and sign in to the Microsoft 365 / Office 365
              mailbox where you want MicroSECONDS Email Analyzer installed.
            </p>
            <a href="https://outlook.office.com" target="_blank" rel="noreferrer"
               className="mt-4 inline-flex rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:border-cyan-400/40">
              Open Outlook on the web
            </a>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white">
              <Image src="/outlook-install/step-1.png" alt="Outlook on the web showing the signed-in mailbox and outlook.office.com address" width={1123} height={417} className="h-auto w-full" />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-5">
            <h3 className="text-lg font-semibold text-white">2. Open Microsoft&apos;s Outlook Add-In Sideloading page</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Keep the correct mailbox signed in, then go to <b className="text-white">aka.ms/olksideload</b>.
              Microsoft will open the Add-Ins for Outlook dialog for that mailbox.
            </p>
            <a href="https://aka.ms/olksideload" target="_blank" rel="noreferrer"
               className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200">
              Open Outlook Add-In Sideloading
            </a>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white">
              <Image src="/outlook-install/step-2.png" alt="Add-Ins for Outlook with My add-ins selected" width={903} height={525} className="h-auto w-full" />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-5">
            <h3 className="text-lg font-semibold text-white">3. Add the MicroSECONDS XML file</h3>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <p>Select <b className="text-white">My add-ins</b>.</p>
              <p>Scroll to <b className="text-white">Custom Addins</b>.</p>
              <p>Select <b className="text-white">Add a custom add-in → Add from File</b>.</p>
              <p>Select the MicroSECONDS XML file you downloaded above.</p>
              <p>Select <b className="text-white">Install</b> and accept Microsoft&apos;s prompts.</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white">
              <Image src="/outlook-install/step-3.png" alt="Custom Addins section showing Add a custom add-in and Add from File" width={1052} height={546} className="h-auto w-full" />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-5">
            <h3 className="text-lg font-semibold text-white">4. Confirm installation and analyze an email</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Close the Add-Ins dialog, refresh Outlook, and open an email.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <div className="font-semibold text-white">Outlook on the web / New Outlook</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Open an email, then select <b className="text-white">Apps</b> or
                  <b className="text-white"> More apps</b>. Choose
                  <b className="text-white"> MicroSECONDS Email Analyzer</b>. You can pin it so the
                  analyzer button stays visible on the main message toolbar.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <div className="font-semibold text-white">Classic Outlook / Outlook for Mac</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Open an email and look for <b className="text-white">Analyze with MicroSECONDS</b>
                  in the message toolbar or add-ins area.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              In every supported Outlook version, use the <b className="text-white">Analyze with MicroSECONDS</b>
              button whenever you want to check the email you currently have open. If you are not already
              signed in, MicroSECONDS will open a secure sign-in window. Outlook may first display a small
              permission prompt; select <b className="text-white">Allow</b> to continue.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white">
              <Image src="/outlook-install/step-4.png" alt="Outlook toolbar showing the Analyze with MicroSECONDS button" width={1157} height={501} className="h-auto w-full" />
            </div>
          </div>
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
