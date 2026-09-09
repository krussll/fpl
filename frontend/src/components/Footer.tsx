import Link from "next/link";
import { TrendingUp, Mail, FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-50/70 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand and Description */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-600/20">
                <TrendingUp className="h-4 w-4 text-white" strokeWidth={2.2} />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                FPL Monte Carlo
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              Probabilistic simulations and squad optimization engine for Fantasy Premier League managers. 
              Evaluate variance, fixture difficulty, and expected points distributions.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Tools
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/player-search"
                  className="transition-colors hover:text-slate-900"
                >
                  Player search
                </Link>
              </li>
              <li>
                <Link
                  href="/team-selections"
                  className="transition-colors hover:text-slate-900"
                >
                  Team selections
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Information
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-slate-900"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-900"
                >
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-900"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Terms</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} FPL Monte Carlo. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link
              href="/contact"
              className="hover:text-slate-900 hover:underline underline-offset-4"
            >
              Contact
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/terms"
              className="hover:text-slate-900 hover:underline underline-offset-4"
            >
              Terms
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center sm:text-left">
          <p className="text-[11px] text-slate-400">
            FPL Monte Carlo is an independent analytics project and is not affiliated with, endorsed by, or sponsored by the Premier League or Fantasy Premier League.
          </p>
        </div>
      </div>
    </footer>
  );
}
