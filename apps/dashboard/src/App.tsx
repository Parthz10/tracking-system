import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardList,
  Eye,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  UserRoundSearch
} from "lucide-react";
import { api, Officer, setAuthToken } from "./services/api";

type Report = {
  id: string;
  type: string;
  description: string;
  district?: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo?: { badgeNumber: string };
};

type MissingPerson = {
  id: string;
  name: string;
  age?: number;
  district?: string;
  lastSeenLocation: string;
  status: string;
};

function App() {
  const [token, setToken] = useState<string>();
  const [officer, setOfficer] = useState<Officer>();

  useEffect(() => setAuthToken(token), [token]);

  if (!token || !officer) {
    return <Login onLogin={(nextToken, nextOfficer) => { setToken(nextToken); setOfficer(nextOfficer); }} />;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-police-red">Nepal Police</p>
            <h1 className="text-lg font-semibold">Community Safety Command</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded bg-slate-100 px-2 py-1">{officer.badgeNumber} · {officer.role}</span>
            <button className="inline-flex items-center gap-2 rounded border px-3 py-2" onClick={() => { setToken(undefined); setOfficer(undefined); }}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-auto lg:block">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavItem to="/reports" icon={<ClipboardList size={18} />} label="Reports" />
          <NavItem to="/missing-persons" icon={<UserRoundSearch size={18} />} label="Missing Persons" />
          {officer.role === "ADMIN" && <NavItem to="/audit" icon={<ShieldCheck size={18} />} label="Audit Trail" />}
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/:id" element={<ReportDetail officer={officer} />} />
            <Route path="/missing-persons" element={<MissingPersons />} />
            <Route path="/audit" element={<AuditTrail />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `mb-2 flex min-w-fit items-center gap-2 rounded px-3 py-2 text-sm font-medium ${isActive ? "bg-police-navy text-white" : "text-slate-700 hover:bg-slate-100"}`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function Login({ onLogin }: { onLogin: (token: string, officer: Officer) => void }) {
  const [badgeNumber, setBadgeNumber] = useState("ADMIN-001");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const response = await api.post("/api/auth/login", { badgeNumber, password });
      onLogin(response.data.token, response.data.officer);
    } catch {
      setError("Login failed. Check badge number and password.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form className="w-full max-w-sm rounded bg-white p-6 shadow-sm" onSubmit={submit}>
        <p className="text-xs font-semibold uppercase tracking-wide text-police-red">Secure officer access</p>
        <h1 className="mt-1 text-2xl font-semibold">Police Dashboard</h1>
        <label className="mt-5 block text-sm font-medium">Badge number</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={badgeNumber} onChange={(event) => setBadgeNumber(event.target.value)} />
        <label className="mt-4 block text-sm font-medium">Password</label>
        <input className="mt-1 w-full rounded border px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="mt-3 text-sm text-police-red">{error}</p>}
        <button className="mt-5 w-full rounded bg-police-navy px-4 py-2 font-semibold text-white">Log in</button>
      </form>
    </main>
  );
}

function DashboardHome() {
  const [summary, setSummary] = useState<any>();

  useEffect(() => {
    api.get("/api/analytics/summary").then((response) => setSummary(response.data)).catch(() => setSummary(undefined));
  }, []);

  const cards = [
    ["Urgent", summary?.urgent ?? "—", AlertTriangle],
    ["Unassigned", summary?.unassigned ?? "—", FileWarning],
    ["Active Missing", summary?.activeMissing ?? "—", UserRoundSearch]
  ];

  return (
    <section>
      <h2 className="text-xl font-semibold">Operational Overview</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {cards.map(([label, value, Icon]) => (
          <div className="rounded border border-slate-200 bg-white p-4" key={String(label)}>
            <Icon className="text-police-red" size={22} />
            <p className="mt-3 text-sm text-slate-600">{String(label)}</p>
            <p className="text-2xl font-semibold">{String(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const params = status ? { status } : {};
    api.get("/api/reports", { params }).then((response) => setReports(response.data.reports));
  }, [status]);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Reports</h2>
        <select className="rounded border bg-white px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option>RECEIVED</option>
          <option>UNDER_REVIEW</option>
          <option>ASSIGNED</option>
          <option>IN_PROGRESS</option>
          <option>RESOLVED</option>
          <option>CLOSED</option>
        </select>
      </div>
      <div className="mt-4 overflow-hidden rounded border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">District</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr className="border-t" key={report.id}>
                <td className="p-3">{report.type}</td>
                <td className="p-3">{report.district ?? "Unknown"}</td>
                <td className="p-3">{report.priority}</td>
                <td className="p-3">{report.status}</td>
                <td className="p-3">
                  <button className="inline-flex items-center gap-2 rounded border px-2 py-1" onClick={() => navigate(`/reports/${report.id}`)}>
                    <Eye size={15} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportDetail({ officer }: { officer: Officer }) {
  const { id } = useParams();
  const [report, setReport] = useState<any>();
  const [note, setNote] = useState("");

  const canSupervise = officer.role === "SUPERVISOR" || officer.role === "ADMIN";

  const refresh = useCallback(async () => {
    const response = await api.get(`/api/reports/${id}`);
    setReport(response.data.report);
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  async function updateStatus(status: string) {
    await api.patch(`/api/reports/${id}/status`, { status, note });
    setNote("");
    await refresh();
  }

  async function updatePriority(priority: string) {
    await api.patch(`/api/reports/${id}/priority`, { priority });
    await refresh();
  }

  if (!report) return <p>Loading report...</p>;

  return (
    <section>
      <h2 className="text-xl font-semibold">{report.type} Report</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Description</p>
          <p className="mt-2 whitespace-pre-wrap">{report.description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Info label="District" value={report.district ?? "Unknown"} />
            <Info label="Status" value={report.status} />
            <Info label="Priority" value={report.priority} />
          </div>
        </div>
        <aside className="rounded border border-slate-200 bg-white p-4">
          <h3 className="font-semibold">Case Controls</h3>
          <textarea className="mt-3 min-h-24 w-full rounded border px-3 py-2" placeholder="Officer note" value={note} onChange={(event) => setNote(event.target.value)} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((status) => (
              <button className="rounded border px-2 py-2 text-sm" key={status} onClick={() => updateStatus(status)}>{status}</button>
            ))}
          </div>
          {canSupervise && (
            <select className="mt-3 w-full rounded border px-3 py-2" value={report.priority} onChange={(event) => updatePriority(event.target.value)}>
              <option>LOW</option>
              <option>NORMAL</option>
              <option>HIGH</option>
              <option>URGENT</option>
            </select>
          )}
        </aside>
      </div>
      <div className="mt-4 rounded border border-slate-200 bg-white p-4">
        <h3 className="font-semibold">Status Timeline</h3>
        <ol className="mt-3 space-y-3">
          {report.updates.map((update: any) => (
            <li className="border-l-2 border-police-gold pl-3" key={update.id}>
              <p className="font-medium">{update.status}</p>
              <p className="text-sm text-slate-600">{update.note ?? "No note"} · {new Date(update.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function MissingPersons() {
  const [items, setItems] = useState<MissingPerson[]>([]);
  const [search, setSearch] = useState("");
  const params = useMemo(() => (search ? { search } : {}), [search]);

  useEffect(() => {
    api.get("/api/missing-persons/admin", { params }).then((response) => setItems(response.data.missingPersons));
  }, [params]);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Missing Persons</h2>
        <label className="flex items-center gap-2 rounded border bg-white px-3 py-2">
          <Search size={16} />
          <input className="outline-none" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((person) => (
          <article className="rounded border border-slate-200 bg-white p-4" key={person.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{person.name}</h3>
                <p className="text-sm text-slate-600">{person.age ? `${person.age} years · ` : ""}{person.district ?? "District unknown"}</p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold">{person.status}</span>
            </div>
            <p className="mt-3 text-sm">{person.lastSeenLocation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AuditTrail() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/audit-logs").then((response) => setLogs(response.data.logs));
  }, []);

  return (
    <section>
      <h2 className="text-xl font-semibold">Immutable Audit Trail</h2>
      <div className="mt-4 overflow-hidden rounded border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Officer</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr className="border-t" key={log.id}>
                <td className="p-3">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-3">{log.officer?.badgeNumber ?? "System"}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.entity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default App;
