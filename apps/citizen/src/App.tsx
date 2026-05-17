import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, ClipboardCheck, MapPin, Search, ShieldCheck, UserRoundSearch } from "lucide-react";
import { api } from "./api";

type Report = {
  id: string;
  type: string;
  status: string;
  priority: string;
  district?: string;
  createdAt: string;
  updates: Array<{ id: string; status: string; note?: string; createdAt: string }>;
};

type MissingPerson = {
  id: string;
  name: string;
  age?: number;
  district?: string;
  lastSeenLocation: string;
  status: string;
};

const tokenKey = "safetyapp.anonymousToken";

function App() {
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<"report" | "track" | "missing">("report");

  useEffect(() => {
    async function ensureToken() {
      const existing = localStorage.getItem(tokenKey);
      if (existing) {
        setToken(existing);
        return;
      }

      const response = await api.post("/api/tokens");
      localStorage.setItem(tokenKey, response.data.token);
      setToken(response.data.token);
    }

    ensureToken().catch(() => setToken("Could not create token. Is the API running?"));
  }, []);

  return (
    <main>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-safety-red">Nepal Police Community Safety</p>
            <h1 className="text-2xl font-bold">Anonymous Citizen Portal</h1>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <p className="font-semibold">Your private tracking token</p>
            <p className="mt-1 max-w-sm break-all font-mono text-slate-600">{token || "Creating token..."}</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <Feature icon={<ShieldCheck />} title="Anonymous" text="No name, phone number, device ID, or citizen account is required." />
          <Feature icon={<ClipboardCheck />} title="Trackable" text="Your private token lets you see report status updates." />
          <Feature icon={<MapPin />} title="Location Ready" text="Add district and GPS details when they help police respond." />
        </div>

        <nav className="mb-5 flex flex-wrap gap-2">
          <TabButton active={tab === "report"} onClick={() => setTab("report")}>Submit Tip</TabButton>
          <TabButton active={tab === "track"} onClick={() => setTab("track")}>Track Report</TabButton>
          <TabButton active={tab === "missing"} onClick={() => setTab("missing")}>Missing Persons</TabButton>
        </nav>

        {tab === "report" && <ReportForm token={token} />}
        {tab === "track" && <TrackReports token={token} />}
        {tab === "missing" && <MissingPersons token={token} />}
      </section>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="rounded border border-slate-200 bg-white p-4">
      <div className="text-safety-green">{icon}</div>
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </article>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button className={`rounded px-4 py-2 font-semibold ${active ? "bg-safety-navy text-white" : "bg-white text-slate-700"}`} onClick={onClick}>
      {children}
    </button>
  );
}

function ReportForm({ token }: { token: string }) {
  const [type, setType] = useState("SUSPICIOUS_ACTIVITY");
  const [district, setDistrict] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await api.post("/api/reports", {
      token,
      type,
      district: district || undefined,
      municipality: municipality || undefined,
      description
    });
    setDescription("");
    setMessage(`Report received. Case ID: ${response.data.reportId}`);
  }

  return (
    <form className="rounded border border-slate-200 bg-white p-5" onSubmit={submit}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-safety-red" />
        <h2 className="text-xl font-semibold">Submit Anonymous Safety Tip</h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Report type
          <select className="mt-1 w-full rounded border px-3 py-2" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="CRIME">Crime</option>
            <option value="SUSPICIOUS_ACTIVITY">Suspicious activity</option>
            <option value="TRAFFICKING">Human trafficking</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          District
          <input className="mt-1 w-full rounded border px-3 py-2" value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="Rupandehi" />
        </label>
        <label className="block text-sm font-semibold">
          Municipality
          <input className="mt-1 w-full rounded border px-3 py-2" value={municipality} onChange={(event) => setMunicipality(event.target.value)} placeholder="Butwal" />
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold">
        Description
        <textarea className="mt-1 min-h-36 w-full rounded border px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} required minLength={20} />
      </label>
      {message && <p className="mt-3 rounded bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{message}</p>}
      <button className="mt-5 rounded bg-safety-navy px-5 py-2 font-semibold text-white">Submit Report</button>
    </form>
  );
}

function TrackReports({ token }: { token: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState("");

  async function refresh() {
    setMessage("");
    const response = await api.get(`/api/reports/track/${token}`);
    setReports(response.data.reports);
    if (response.data.reports.length === 0) setMessage("No reports yet for this token.");
  }

  return (
    <section className="rounded border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Track My Reports</h2>
        <button className="rounded bg-safety-navy px-4 py-2 font-semibold text-white" onClick={refresh}>Refresh Status</button>
      </div>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
      <div className="mt-4 grid gap-3">
        {reports.map((report) => (
          <article className="rounded border border-slate-200 p-4" key={report.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{report.type}</h3>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold">{report.status}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{report.district ?? "District not provided"} · {report.priority}</p>
            <ol className="mt-3 space-y-2">
              {report.updates.map((update) => (
                <li className="border-l-2 border-safety-gold pl-3 text-sm" key={update.id}>
                  <span className="font-semibold">{update.status}</span>
                  <span className="text-slate-600"> · {update.note ?? "No note"}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

function MissingPersons({ token }: { token: string }) {
  const [items, setItems] = useState<MissingPerson[]>([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [district, setDistrict] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");

  async function load() {
    const response = await api.get("/api/missing-persons");
    setItems(response.data.missingPersons);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api.post("/api/missing-persons", {
      token,
      name,
      age: age ? Number(age) : undefined,
      district: district || undefined,
      lastSeenLocation
    });
    setName("");
    setAge("");
    setDistrict("");
    setLastSeenLocation("");
    await load();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="rounded border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <UserRoundSearch className="text-safety-green" />
          <h2 className="text-xl font-semibold">Active Missing Persons</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {items.map((person) => (
            <article className="rounded border border-slate-200 p-4" key={person.id}>
              <h3 className="font-semibold">{person.name}</h3>
              <p className="text-sm text-slate-600">{person.age ? `${person.age} years · ` : ""}{person.district ?? "District unknown"}</p>
              <p className="mt-2 text-sm">{person.lastSeenLocation}</p>
            </article>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-600">No active missing person records yet.</p>}
        </div>
      </section>

      <form className="rounded border border-slate-200 bg-white p-5" onSubmit={submit}>
        <div className="flex items-center gap-2">
          <Search className="text-safety-red" />
          <h2 className="text-xl font-semibold">Report Missing Person</h2>
        </div>
        <input className="mt-4 w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <input className="mt-3 w-full rounded border px-3 py-2" placeholder="Age" value={age} onChange={(event) => setAge(event.target.value)} />
        <input className="mt-3 w-full rounded border px-3 py-2" placeholder="District" value={district} onChange={(event) => setDistrict(event.target.value)} />
        <textarea className="mt-3 min-h-28 w-full rounded border px-3 py-2" placeholder="Last seen location and details" value={lastSeenLocation} onChange={(event) => setLastSeenLocation(event.target.value)} required />
        <button className="mt-4 rounded bg-safety-navy px-5 py-2 font-semibold text-white">Submit Missing Person</button>
      </form>
    </div>
  );
}

export default App;
