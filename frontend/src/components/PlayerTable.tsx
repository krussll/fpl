"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Player, PlayerFixture } from "@/types/player";
import PlayerModal from "./PlayerModal";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

type SortField =
  | "name"
  | "position"
  | "price"
  | "selected_by_percent"
  | "xp"
  | "ppm"
  | "floor"
  | "ceiling"
  | "haul_prob"
  | "defcon_prob";

const GAMEWEEK_OPTIONS = [
  { value: 1, label: "Current GW", sub: "Next 1 Fixture" },
  { value: 3, label: "3 GWs", sub: "Next 3 Fixtures" },
  { value: 5, label: "5 GWs", sub: "Next 5 Fixtures" },
] as const;

type OwnershipFilterValue = "5" | "10" | "25" | "50" | "75" | ">75" | null;

interface OwnershipOption {
  value: OwnershipFilterValue;
  label: string;
}

const OWNERSHIP_OPTIONS: OwnershipOption[] = [
  { value: "5", label: "≤ 5%" },
  { value: "10", label: "≤ 10%" },
  { value: "25", label: "≤ 25%" },
  { value: "50", label: "≤ 50%" },
  { value: "75", label: "≤ 75%" },
  { value: ">75", label: "> 75%" },
];

function matchOwnership(
  playerOwnPercent: number,
  filter: OwnershipFilterValue
): boolean {
  if (filter === null) return true;
  if (filter === ">75") return playerOwnPercent > 75.0;
  const num = parseFloat(filter);
  return playerOwnPercent <= num;
}

function normalizeSearchText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae");
}

function getFdrClasses(fdr: number) {
  switch (fdr) {
    case 1:
    case 2:
      return "bg-emerald-50 text-emerald-700 border-emerald-200/90";
    case 3:
      return "bg-slate-100 text-slate-700 border-slate-200";
    case 4:
      return "bg-rose-50 text-rose-700 border-rose-200/90";
    case 5:
      return "bg-red-950/10 text-red-900 border-red-300 font-bold";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getPosBadgeClasses(position: string) {
  switch (position) {
    case "GKP":
      return "bg-amber-50 text-amber-700 border-amber-200/80";
    case "DEF":
      return "bg-sky-50 text-sky-700 border-sky-200/80";
    case "MID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    case "FWD":
      return "bg-rose-50 text-rose-700 border-rose-200/80";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getPosChipClasses(position: string) {
  switch (position) {
    case "GKP":
      return "bg-amber-50 text-amber-800 ring-amber-600/20";
    case "DEF":
      return "bg-sky-50 text-sky-800 ring-sky-600/20";
    case "MID":
      return "bg-emerald-50 text-emerald-800 ring-emerald-600/20";
    case "FWD":
      return "bg-rose-50 text-rose-800 ring-rose-600/20";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-400/20";
  }
}

export default function PlayerTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter 0: Free text input to filter by player name
  const [nameSearch, setNameSearch] = useState("");

  // Filter 1: Multi-select positions (empty array means ALL)
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);
  const posDropdownRef = useRef<HTMLDivElement>(null);

  // Filter 2: Multi-select teams (empty array means ALL)
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  // Filter 3: Single-select max price (null means Any Price)
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [priceDropdownOpen, setPriceDropdownOpen] = useState(false);
  const priceDropdownRef = useRef<HTMLDivElement>(null);

  // Filter 4: Single-select gameweeks horizon (1 = current GW, 3 = 3 GWs, 5 = 5 GWs)
  const [gameweeks, setGameweeks] = useState<number>(1);
  const [gwDropdownOpen, setGwDropdownOpen] = useState(false);
  const gwDropdownRef = useRef<HTMLDivElement>(null);
  const [isFetchingGw, setIsFetchingGw] = useState(false);
  const isInitialLoad = useRef(true);

  // Filter 5: Single-select ownership % (null means Any Ownership)
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilterValue>(null);
  const [ownDropdownOpen, setOwnDropdownOpen] = useState(false);
  const ownDropdownRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("xp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Fetch players on mount or when gameweeks changes
  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      try {
        if (isInitialLoad.current) {
          setLoading(true);
        } else {
          setIsFetchingGw(true);
        }
        setError(null);
        const res = await fetch(`/api/players?fixtures=${gameweeks}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch players (status ${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) {
          setPlayers(data.players || []);
          isInitialLoad.current = false;
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message || "An unexpected error occurred while loading player data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsFetchingGw(false);
        }
      }
    }

    loadPlayers();

    return () => {
      cancelled = true;
    };
  }, [gameweeks]);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        posDropdownRef.current &&
        !posDropdownRef.current.contains(event.target as Node)
      ) {
        setPosDropdownOpen(false);
      }
      if (
        teamDropdownRef.current &&
        !teamDropdownRef.current.contains(event.target as Node)
      ) {
        setTeamDropdownOpen(false);
      }
      if (
        priceDropdownRef.current &&
        !priceDropdownRef.current.contains(event.target as Node)
      ) {
        setPriceDropdownOpen(false);
      }
      if (
        gwDropdownRef.current &&
        !gwDropdownRef.current.contains(event.target as Node)
      ) {
        setGwDropdownOpen(false);
      }
      if (
        ownDropdownRef.current &&
        !ownDropdownRef.current.contains(event.target as Node)
      ) {
        setOwnDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPosDropdownOpen(false);
        setTeamDropdownOpen(false);
        setPriceDropdownOpen(false);
        setGwDropdownOpen(false);
        setOwnDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Compute available position options with live counts
  const positionOptions = useMemo(() => {
    const map = new Map<string, number>();
    players.forEach((p) => {
      if (p.position) {
        map.set(p.position, (map.get(p.position) || 0) + 1);
      }
    });

    return [
      {
        key: "GKP",
        label: "GKP",
        fullName: "Goalkeepers",
        count: map.get("GKP") || 0,
        badgeStyle: "bg-amber-100 text-amber-800 border-amber-300",
      },
      {
        key: "DEF",
        label: "DEF",
        fullName: "Defenders",
        count: map.get("DEF") || 0,
        badgeStyle: "bg-sky-100 text-sky-800 border-sky-300",
      },
      {
        key: "MID",
        label: "MID",
        fullName: "Midfielders",
        count: map.get("MID") || 0,
        badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-300",
      },
      {
        key: "FWD",
        label: "FWD",
        fullName: "Forwards",
        count: map.get("FWD") || 0,
        badgeStyle: "bg-rose-100 text-rose-800 border-rose-300",
      },
    ];
  }, [players]);

  // Compute available unique teams with counts
  const teamsData = useMemo(() => {
    const map = new Map<string, number>();
    players.forEach((p) => {
      if (p.team) {
        map.set(p.team, (map.get(p.team) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  // Compute price options every 0.5m from max down to 4.0m
  const priceOptions = useMemo(() => {
    if (!players.length) return [];
    const maxVal = Math.max(...players.map((p) => p.price));
    const options: { value: number; count: number }[] = [];
    for (let val = maxVal; val >= 4.0; val = Math.round((val - 0.5) * 10) / 10) {
      const count = players.filter((p) => p.price <= val).length;
      options.push({ value: val, count });
    }
    return options;
  }, [players]);

  // Compute ownership options with live counts
  const ownershipOptionsWithCounts = useMemo(() => {
    return OWNERSHIP_OPTIONS.map((opt) => {
      const count = players.filter((p) =>
        matchOwnership(p.selected_by_percent || 0, opt.value)
      ).length;
      return { ...opt, count };
    });
  }, [players]);

  // Position multi-select toggle
  const togglePosition = (posKey: string) => {
    setSelectedPositions((prev) => {
      let updated: string[];
      if (prev.includes(posKey)) {
        updated = prev.filter((p) => p !== posKey);
      } else {
        updated = [...prev, posKey];
      }
      if (updated.length === 4) {
        updated = [];
      }
      return updated;
    });
    setCurrentPage(1);
  };

  const selectAllPositions = () => {
    setSelectedPositions([]);
    setCurrentPage(1);
  };

  const clearPositionFilter = () => {
    setSelectedPositions([]);
    setCurrentPage(1);
  };

  // Team multi-select toggle
  const toggleTeam = (teamName: string) => {
    setSelectedTeams((prev) => {
      let updated: string[];
      if (prev.includes(teamName)) {
        updated = prev.filter((t) => t !== teamName);
      } else {
        updated = [...prev, teamName];
      }
      if (updated.length === teamsData.length) {
        updated = [];
      }
      return updated;
    });
    setCurrentPage(1);
  };

  const clearTeamFilter = () => {
    setSelectedTeams([]);
    setCurrentPage(1);
  };

  const selectAllTeams = () => {
    setSelectedTeams([]);
    setCurrentPage(1);
  };

  // Price single-select handler
  const selectPrice = (val: number | null) => {
    setMaxPrice(val);
    setPriceDropdownOpen(false);
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setNameSearch("");
    setSelectedPositions([]);
    setSelectedTeams([]);
    setMaxPrice(null);
    setGameweeks(1);
    setOwnershipFilter(null);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // Filter players by name, positions, teams, max price, and ownership
  const filteredPlayers = useMemo(() => {
    const trimmed = nameSearch.trim();
    const query = trimmed ? normalizeSearchText(trimmed) : "";

    return players.filter((p) => {
      // Player name filter
      if (query) {
        const nameMatch = p.name && normalizeSearchText(p.name).includes(query);
        const fullNameMatch =
          p.full_name && normalizeSearchText(p.full_name).includes(query);
        if (!nameMatch && !fullNameMatch) {
          return false;
        }
      }
      // Position filter
      if (selectedPositions.length > 0 && !selectedPositions.includes(p.position)) {
        return false;
      }
      // Team filter
      if (selectedTeams.length > 0 && !selectedTeams.includes(p.team)) {
        return false;
      }
      // Max price filter
      if (maxPrice !== null && p.price > maxPrice) {
        return false;
      }
      // Ownership filter
      if (
        ownershipFilter !== null &&
        !matchOwnership(p.selected_by_percent || 0, ownershipFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [players, nameSearch, selectedPositions, selectedTeams, maxPrice, ownershipFilter]);

  // Sort filtered players
  const sortedPlayers = useMemo(() => {
    const list = [...filteredPlayers];
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      }

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredPlayers, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedPlayers.length / pageSize) || 1;
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPlayers.slice(start, start + pageSize);
  }, [sortedPlayers, currentPage, pageSize]);

  const isNameFilterActive = nameSearch.trim().length > 0;
  const isAllPositionsActive = selectedPositions.length === 0;
  const isAllTeamsActive = selectedTeams.length === 0;
  const isPriceFilterActive = maxPrice !== null;
  const isGwFilterActive = gameweeks !== 1;
  const isOwnFilterActive = ownershipFilter !== null;
  const hasActiveFilters =
    isNameFilterActive ||
    !isAllPositionsActive ||
    !isAllTeamsActive ||
    isPriceFilterActive ||
    isGwFilterActive ||
    isOwnFilterActive;

  // Filtered teams in team dropdown search
  const visibleTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return teamsData;
    const q = teamSearchQuery.toLowerCase();
    return teamsData.filter((t) => t.name.toLowerCase().includes(q));
  }, [teamsData, teamSearchQuery]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-slate-400 opacity-60" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-emerald-600 font-bold" />
    ) : (
      <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-emerald-600 font-bold" />
    );
  };

  // Position trigger button label
  const positionTriggerLabel = useMemo(() => {
    if (isAllPositionsActive) return "All Positions";
    if (selectedPositions.length === 1) {
      const match = positionOptions.find((p) => p.key === selectedPositions[0]);
      return match ? match.fullName : selectedPositions[0];
    }
    return `${selectedPositions.length} Positions`;
  }, [isAllPositionsActive, selectedPositions, positionOptions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="mt-4 text-sm font-semibold text-slate-700">
          Loading player simulation models...
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Fetching 10,000-iteration Monte Carlo projections
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center">
        <p className="text-sm font-semibold text-rose-800">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Filter: Free text input by player name */}
            <div className="relative flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Player:
              </span>
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={nameSearch}
                  onChange={(e) => {
                    setNameSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  onFocus={() => {
                    setPosDropdownOpen(false);
                    setTeamDropdownOpen(false);
                    setPriceDropdownOpen(false);
                    setGwDropdownOpen(false);
                    setOwnDropdownOpen(false);
                  }}
                  placeholder="Filter by name..."
                  className={`w-36 sm:w-44 rounded-xl border py-1.5 pr-7 pl-8 text-xs transition-all placeholder:text-slate-400 focus:outline-none focus:ring-1 ${
                    isNameFilterActive
                      ? "border-emerald-300 bg-emerald-50/80 text-emerald-900 font-semibold ring-1 ring-emerald-600/20 focus:border-emerald-500 focus:ring-emerald-500"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:border-emerald-500 focus:ring-emerald-500 focus:bg-white"
                  }`}
                />
                {isNameFilterActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setNameSearch("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label="Clear player name search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            {/* Filter 1: Position Multi-Select Dropdown */}
            <div className="relative flex items-center gap-1.5" ref={posDropdownRef}>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Position:
              </span>

              <button
                type="button"
                onClick={() => {
                  setPosDropdownOpen((prev) => !prev);
                  setTeamDropdownOpen(false);
                  setPriceDropdownOpen(false);
                  setGwDropdownOpen(false);
                  setOwnDropdownOpen(false);
                }}
                aria-expanded={posDropdownOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  !isAllPositionsActive
                    ? "border-emerald-300 bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-600/20 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span>{positionTriggerLabel}</span>
                {!isAllPositionsActive && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
                    {selectedPositions.length}
                  </span>
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                    posDropdownOpen ? "rotate-180 text-slate-700" : ""
                  }`}
                />
              </button>

              {/* Position Popover Menu */}
              {posDropdownOpen && (
                <div className="absolute left-0 top-full z-40 mt-2 w-64 origin-top-left rounded-2xl border border-slate-200 bg-white p-3 shadow-xl backdrop-blur-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-1 pb-2 text-[11px]">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">
                      Select Positions
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllPositions}
                        className="text-emerald-700 hover:text-emerald-800 font-medium"
                      >
                        All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={clearPositionFilter}
                        className="text-slate-500 hover:text-slate-800"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs">
                    {positionOptions.map((pos) => {
                      const isSelected = selectedPositions.includes(pos.key);

                      return (
                        <button
                          key={pos.key}
                          type="button"
                          onClick={() => togglePosition(pos.key)}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-950 font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>

                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold border ${pos.badgeStyle}`}
                            >
                              {pos.label}
                            </span>
                            <span>{pos.fullName}</span>
                          </div>

                          <span className="text-[11px] text-slate-400 font-normal">
                            {pos.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            {/* Filter 2: Team Multi-Select Dropdown */}
            <div className="relative flex items-center gap-1.5" ref={teamDropdownRef}>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Team:
              </span>

              <button
                type="button"
                onClick={() => {
                  setTeamDropdownOpen((prev) => !prev);
                  setPosDropdownOpen(false);
                  setPriceDropdownOpen(false);
                  setGwDropdownOpen(false);
                  setOwnDropdownOpen(false);
                }}
                aria-expanded={teamDropdownOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  !isAllTeamsActive
                    ? "border-emerald-300 bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-600/20 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span>
                  {isAllTeamsActive
                    ? "All Teams"
                    : selectedTeams.length === 1
                    ? selectedTeams[0]
                    : `${selectedTeams.length} Teams`}
                </span>
                {!isAllTeamsActive && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
                    {selectedTeams.length}
                  </span>
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                    teamDropdownOpen ? "rotate-180 text-slate-700" : ""
                  }`}
                />
              </button>

              {/* Team Popover Menu */}
              {teamDropdownOpen && (
                <div className="absolute left-0 top-full z-40 mt-2 w-72 origin-top-left rounded-2xl border border-slate-200 bg-white p-3 shadow-xl backdrop-blur-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="relative mb-2">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      placeholder="Search club..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pr-2.5 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>

                  <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-1 pb-2 text-[11px]">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">
                      Select Clubs
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllTeams}
                        className="text-emerald-700 hover:text-emerald-800 font-medium"
                      >
                        All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={clearTeamFilter}
                        className="text-slate-500 hover:text-slate-800"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 text-xs">
                    {visibleTeams.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No clubs matching &quot;{teamSearchQuery}&quot;
                      </div>
                    ) : (
                      visibleTeams.map((team) => {
                        const isSelected = selectedTeams.includes(team.name);

                        return (
                          <button
                            key={team.name}
                            type="button"
                            onClick={() => toggleTeam(team.name)}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                              isSelected
                                ? "bg-emerald-50 text-emerald-950 font-semibold"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                  isSelected
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                              <span>{team.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {team.count}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            {/* Filter 3: Max Price Single Dropdown */}
            <div className="relative flex items-center gap-1.5" ref={priceDropdownRef}>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Max Price:
              </span>

              <button
                type="button"
                onClick={() => {
                  setPriceDropdownOpen((prev) => !prev);
                  setPosDropdownOpen(false);
                  setTeamDropdownOpen(false);
                  setGwDropdownOpen(false);
                  setOwnDropdownOpen(false);
                }}
                aria-expanded={priceDropdownOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isPriceFilterActive
                    ? "border-emerald-300 bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-600/20 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span>
                  {isPriceFilterActive ? `≤ £${maxPrice.toFixed(1)}m` : "Any Price"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                    priceDropdownOpen ? "rotate-180 text-slate-700" : ""
                  }`}
                />
              </button>

              {/* Price Popover Menu */}
              {priceDropdownOpen && (
                <div className="absolute left-0 top-full z-40 mt-2 w-56 origin-top-left rounded-2xl border border-slate-200 bg-white p-3 shadow-xl backdrop-blur-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-1 pb-2 text-[11px]">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">
                      Budget Cap
                    </span>
                    <button
                      type="button"
                      onClick={() => selectPrice(null)}
                      className="text-slate-500 hover:text-slate-800 text-xs font-medium"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1 text-xs">
                    {/* Any Price Option */}
                    <button
                      type="button"
                      onClick={() => selectPrice(null)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        !isPriceFilterActive
                          ? "bg-emerald-50 text-emerald-900 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>Any Price</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-normal">
                          {players.length}
                        </span>
                        {!isPriceFilterActive && (
                          <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                        )}
                      </div>
                    </button>

                    {/* Every 0.5m step from max down to 4.0m */}
                    {priceOptions.map((opt) => {
                      const isSelected = maxPrice === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => selectPrice(opt.value)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-900 font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>≤ £{opt.value.toFixed(1)}m</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-normal">
                              {opt.count}
                            </span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            {/* Filter 4: Gameweeks Single Dropdown */}
            <div className="relative flex items-center gap-1.5" ref={gwDropdownRef}>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Gameweeks:
              </span>

              <button
                type="button"
                onClick={() => {
                  setGwDropdownOpen((prev) => !prev);
                  setPosDropdownOpen(false);
                  setTeamDropdownOpen(false);
                  setPriceDropdownOpen(false);
                  setOwnDropdownOpen(false);
                }}
                aria-expanded={gwDropdownOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isGwFilterActive
                    ? "border-emerald-300 bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-600/20 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span>
                  {gameweeks === 1 ? "Current GW" : `${gameweeks} GWs`}
                </span>
                {isFetchingGw ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                ) : (
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                      gwDropdownOpen ? "rotate-180 text-slate-700" : ""
                    }`}
                  />
                )}
              </button>

              {/* Gameweek Popover Menu */}
              {gwDropdownOpen && (
                <div className="absolute left-0 top-full z-40 mt-2 w-56 origin-top-left rounded-2xl border border-slate-200 bg-white p-3 shadow-xl backdrop-blur-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-1 pb-2 text-[11px]">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">
                      Gameweek Horizon
                    </span>
                    {isGwFilterActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setGameweeks(1);
                          setGwDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className="text-slate-500 hover:text-slate-800 text-xs font-medium"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    {GAMEWEEK_OPTIONS.map((opt) => {
                      const isSelected = gameweeks === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setGameweeks(opt.value);
                            setGwDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-900 font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <div className="font-medium">{opt.label}</div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {opt.sub}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            {/* Filter 5: Ownership % Single Dropdown */}
            <div className="relative flex items-center gap-1.5" ref={ownDropdownRef}>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Ownership:
              </span>

              <button
                type="button"
                onClick={() => {
                  setOwnDropdownOpen((prev) => !prev);
                  setPosDropdownOpen(false);
                  setTeamDropdownOpen(false);
                  setPriceDropdownOpen(false);
                  setGwDropdownOpen(false);
                }}
                aria-expanded={ownDropdownOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isOwnFilterActive
                    ? "border-emerald-300 bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-600/20 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <span>
                  {isOwnFilterActive
                    ? ownershipFilter === ">75"
                      ? "> 75%"
                      : `≤ ${ownershipFilter}%`
                    : "Any Own %"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                    ownDropdownOpen ? "rotate-180 text-slate-700" : ""
                  }`}
                />
              </button>

              {/* Ownership Popover Menu */}
              {ownDropdownOpen && (
                <div className="absolute left-0 top-full z-40 mt-2 w-56 origin-top-left rounded-2xl border border-slate-200 bg-white p-3 shadow-xl backdrop-blur-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-1 pb-2 text-[11px]">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">
                      Ownership %
                    </span>
                    {isOwnFilterActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setOwnershipFilter(null);
                          setOwnDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className="text-slate-500 hover:text-slate-800 text-xs font-medium"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    {/* Any Ownership Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setOwnershipFilter(null);
                        setOwnDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                        !isOwnFilterActive
                          ? "bg-emerald-50 text-emerald-900 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>Any Ownership</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-normal">
                          {players.length}
                        </span>
                        {!isOwnFilterActive && (
                          <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                        )}
                      </div>
                    </button>

                    {/* 5%, 10%, 25%, 50%, 75%, >75% */}
                    {ownershipOptionsWithCounts.map((opt) => {
                      const isSelected = ownershipFilter === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setOwnershipFilter(opt.value);
                            setOwnDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-900 font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{opt.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-normal">
                              {opt.count}
                            </span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[2.5]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Counter & Reset */}
          <div className="flex items-center gap-3 self-end lg:self-center">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="h-3 w-3 text-slate-400" />
                <span>Reset Filters</span>
              </button>
            )}

            <div className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredPlayers.length}
              </span>{" "}
              {filteredPlayers.length === 1 ? "player" : "players"}
            </div>
          </div>
        </div>

        {/* Selected Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">
              Active Filters:
            </span>

            {/* Player Name Chip */}
            {isNameFilterActive && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                <span>Player: &ldquo;{nameSearch.trim()}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => {
                    setNameSearch("");
                    setCurrentPage(1);
                  }}
                  className="rounded hover:bg-emerald-200/50 p-0.5 text-emerald-600 hover:text-emerald-900"
                  aria-label="Remove player name filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Position Chips */}
            {selectedPositions.map((posKey) => (
              <span
                key={posKey}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getPosChipClasses(
                  posKey
                )}`}
              >
                <span>{posKey}</span>
                <button
                  type="button"
                  onClick={() => togglePosition(posKey)}
                  className="rounded hover:bg-black/10 p-0.5"
                  aria-label={`Remove ${posKey} position filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Team Chips */}
            {selectedTeams.map((team) => (
              <span
                key={team}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20"
              >
                <span>{team}</span>
                <button
                  type="button"
                  onClick={() => toggleTeam(team)}
                  className="rounded hover:bg-emerald-200/50 p-0.5 text-emerald-600 hover:text-emerald-900"
                  aria-label={`Remove ${team} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {/* Price Chip */}
            {isPriceFilterActive && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                <span>≤ £{maxPrice.toFixed(1)}m</span>
                <button
                  type="button"
                  onClick={() => selectPrice(null)}
                  className="rounded hover:bg-emerald-200/50 p-0.5 text-emerald-600 hover:text-emerald-900"
                  aria-label="Remove max price filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Gameweeks Chip */}
            {isGwFilterActive && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                <span>Horizon: {gameweeks} GWs</span>
                <button
                  type="button"
                  onClick={() => setGameweeks(1)}
                  className="rounded hover:bg-emerald-200/50 p-0.5 text-emerald-600 hover:text-emerald-900"
                  aria-label="Reset gameweeks to 1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Ownership Chip */}
            {isOwnFilterActive && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                <span>
                  Own:{" "}
                  {ownershipFilter === ">75"
                    ? "> 75%"
                    : `≤ ${ownershipFilter}%`}
                </span>
                <button
                  type="button"
                  onClick={() => setOwnershipFilter(null)}
                  className="rounded hover:bg-emerald-200/50 p-0.5 text-emerald-600 hover:text-emerald-900"
                  aria-label="Remove ownership filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] text-slate-400 hover:text-slate-700 underline underline-offset-2 ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table Card Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" role="table">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {/* 1. Player */}
                <th
                  onClick={() => handleSort("name")}
                  className="cursor-pointer py-3.5 pl-4 pr-3 hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Player</span>
                    {renderSortIndicator("name")}
                  </div>
                </th>

                {/* 2. Pos */}
                <th
                  onClick={() => handleSort("position")}
                  className="cursor-pointer px-3 py-3.5 hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Pos</span>
                    {renderSortIndicator("position")}
                  </div>
                </th>

                {/* 3. Price */}
                <th
                  onClick={() => handleSort("price")}
                  className="cursor-pointer px-3 py-3.5 hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Price</span>
                    {renderSortIndicator("price")}
                  </div>
                </th>

                {/* 4. Own % */}
                <th
                  onClick={() => handleSort("selected_by_percent")}
                  className="cursor-pointer px-3 py-3.5 hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Own %</span>
                    {renderSortIndicator("selected_by_percent")}
                  </div>
                </th>

                {/* 5. Next Fixtures (FDR) */}
                <th className="px-3 py-3.5 select-none">
                  <span>Next Fixtures (FDR)</span>
                </th>

                {/* 6. Expected Pts (xP) */}
                <th
                  onClick={() => handleSort("xp")}
                  className="cursor-pointer px-3 py-3.5 hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Expected Pts (xP)</span>
                    {renderSortIndicator("xp")}
                  </div>
                </th>

                {/* 7. Value (xP/£m) */}
                <th
                  onClick={() => handleSort("ppm")}
                  className="cursor-pointer px-3 py-3.5 hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Value (xP/£m)</span>
                    {renderSortIndicator("ppm")}
                  </div>
                </th>

                {/* 8. Floor (P10) */}
                <th
                  onClick={() => handleSort("floor")}
                  className="cursor-pointer px-3 py-3.5 hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Floor (P10)</span>
                    {renderSortIndicator("floor")}
                  </div>
                </th>

                {/* 9. Ceiling (P90) */}
                <th
                  onClick={() => handleSort("ceiling")}
                  className="cursor-pointer px-3 py-3.5 hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Ceiling (P90)</span>
                    {renderSortIndicator("ceiling")}
                  </div>
                </th>

                {/* 10. Haul (≥10) */}
                <th
                  onClick={() => handleSort("haul_prob")}
                  className="cursor-pointer px-3 py-3.5 hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>Haul (≥10)</span>
                    {renderSortIndicator("haul_prob")}
                  </div>
                </th>

                {/* 11. DefCon (+2) */}
                <th
                  onClick={() => handleSort("defcon_prob")}
                  className="cursor-pointer py-3.5 pl-3 pr-4 hover:text-slate-900 transition-colors select-none"
                >
                  <div className="flex items-center">
                    <span>DefCon (+2)</span>
                    {renderSortIndicator("defcon_prob")}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody
              className={`divide-y divide-slate-100 transition-opacity duration-150 ${
                isFetchingGw ? "opacity-50 pointer-events-none" : "opacity-100"
              }`}
            >
              {paginatedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-slate-500">
                    No players match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedPlayers.map((player) => {
                  const isDifferential = player.selected_by_percent < 5.0;
                  const isHighOwnership = player.selected_by_percent >= 20.0;
                  const fixtures = player.fixtures || [];

                  return (
                    <tr
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className="group cursor-pointer hover:bg-slate-50/80 transition-colors"
                      title={`Click to view ${player.full_name || player.name} detailed simulations`}
                    >
                      {/* 1. Player Name & Team */}
                      <td className="py-3.5 pl-4 pr-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {player.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {player.team}
                        </div>
                      </td>

                      {/* 2. Pos */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${getPosBadgeClasses(
                            player.position
                          )}`}
                        >
                          {player.position}
                        </span>
                      </td>

                      {/* 3. Price */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-medium text-slate-900">
                        £{player.price.toFixed(1)}m
                      </td>

                      {/* 4. Own % */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-xs">
                        {isDifferential ? (
                          <span
                            className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-700 ring-1 ring-inset ring-violet-600/20"
                            title="Differential asset (<5% ownership)"
                          >
                            {player.selected_by_percent.toFixed(1)}%
                          </span>
                        ) : isHighOwnership ? (
                          <span className="font-bold text-slate-900">
                            {player.selected_by_percent.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-600">
                            {player.selected_by_percent.toFixed(1)}%
                          </span>
                        )}
                      </td>

                      {/* 5. Next Fixtures (FDR) */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {fixtures.length === 0 ? (
                            <span className="text-xs text-slate-400">-</span>
                          ) : (
                            fixtures.map((f: PlayerFixture, idx: number) => (
                              <span
                                key={idx}
                                title={`GW${f.event || ""}: ${f.opponent_name} (FDR ${f.fdr})`}
                                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none ${getFdrClasses(
                                  f.fdr
                                )}`}
                              >
                                {f.opponent}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* 6. Expected Pts (xP) */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                          {player.xp.toFixed(2)}
                        </span>
                      </td>

                      {/* 7. Value (xP/£m) */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-700 font-medium">
                        {player.ppm.toFixed(2)}
                      </td>

                      {/* 8. Floor (P10) */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-500 font-mono text-xs">
                        {player.floor.toFixed(1)}
                      </td>

                      {/* 9. Ceiling (P90) */}
                      <td className="px-3 py-3.5 whitespace-nowrap font-mono text-xs font-semibold text-amber-700">
                        {player.ceiling.toFixed(1)}
                      </td>

                      {/* 10. Haul (≥10) */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-700 text-xs">
                        {player.haul_prob.toFixed(1)}%
                      </td>

                      {/* 11. DefCon (+2) */}
                      <td className="py-3.5 pl-3 pr-4 whitespace-nowrap text-xs">
                        <span
                          className={
                            player.defcon_prob > 25
                              ? "font-semibold text-teal-700"
                              : "text-slate-500"
                          }
                        >
                          {player.defcon_prob.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 px-4 py-3.5 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {sortedPlayers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * pageSize, sortedPlayers.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {sortedPlayers.length}
              </span>{" "}
              players
            </span>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1.5">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-2 text-xs font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          gameweeks={gameweeks}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
