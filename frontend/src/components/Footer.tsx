import Link from "next/link";
import { Flame, Mail, FileText } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-50/70 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          {/* Brand and Description */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="group inline-flex items-center gap-2.5 transition-opacity hover:opacity-95">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FE5803] to-[#FF8C44] shadow-sm shadow-orange-500/20 ring-1 ring-orange-600/20 transition-transform group-hover:scale-105">
                <Flame className="h-4 w-4 text-white" strokeWidth={2.2} />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-[#FE5803] transition-colors">
                FPL Hauls
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              Data science prediction models and squad optimization engine for Fantasy Premier League managers. 
              Evaluate variance, fixture difficulty, and expected points distributions to target optimal hauls.
            </p>
          </div>

          {/* Core Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Squad & Transfers
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/player-search"
                  className="transition-colors hover:text-[#FE5803]"
                >
                  Player search
                </Link>
              </li>
              <li>
                <Link
                  href="/team-selections"
                  className="transition-colors hover:text-[#FE5803]"
                >
                  Team selections
                </Link>
              </li>
              <li>
                <Link
                  href="/transfer-recommendations"
                  className="transition-colors hover:text-[#FE5803]"
                >
                  Transfer recommendations
                </Link>
              </li>
              <li>
                <Link
                  href="/budget-optimizer"
                  className="transition-colors hover:text-[#FE5803]"
                >
                  Budget squad optimizer
                </Link>
              </li>
            </ul>
          </div>

          {/* Projections & Fixtures */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Projections
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/match-odds"
                  className="transition-colors hover:text-[#FE5803]"
                >
                  Match projections
                </Link>
              </li>
              <li>
                <Link
                  href="/fixture-ticker"
                  className="transition-colors hover:text-[#FE5803]"
                >
                  Fixture xG ticker
                </Link>
              </li>
              <li>
                <Link
                  href="/fixture-xgc-ticker"
                  className="transition-colors hover:text-[#FE5803]"
                >
                  Fixture xGC ticker
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
                  className="transition-colors hover:text-[#FE5803]"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-1.5 transition-colors hover:text-[#FE5803]"
                >
                  <Mail className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#FE5803] transition-colors" />
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="group inline-flex items-center gap-1.5 transition-colors hover:text-[#FE5803]"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#FE5803] transition-colors" />
                  <span>Terms</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} FPL Hauls. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link
              href="/contact"
              className="hover:text-[#FE5803] hover:underline underline-offset-4 transition-colors"
            >
              Contact
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              href="/terms"
              className="hover:text-[#FE5803] hover:underline underline-offset-4 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center sm:text-left">
          <p className="text-[11px] text-slate-400">
            FPL Hauls is an independent analytics project and is not affiliated with, endorsed by, or sponsored by the Premier League or Fantasy Premier League.
          </p>
        </div>
      </div>
    </footer>
  );
}
