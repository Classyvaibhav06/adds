// ✏️ EDIT THIS FILE TO MAKE THE PORTFOLIO YOURS
// All the copy / data on the site lives here so you can customize it in one place.

export const profile = {
  handle: "BlockSmith",
  role: "Backend Developer",
  tagline:
    "I craft scalable backends — APIs, databases and real-time systems — one block at a time.",
  location: "Spawned: Planet Earth",
  level: 32,
  xpCommits: "12,400+",
  yearsActive: "8+",
  stats: [
    { label: "APIs shipped", value: "120+" },
    { label: "Years mining code", value: "8+" },
    { label: "Uptime maintained", value: "99.99%" },
  ],
  achievements: [
    {
      title: "Getting an Upgrade",
      detail: "Migrated a monolith to microservices with zero downtime.",
    },
    {
      title: "Overpowered",
      detail: "Kept 99.99% uptime for 3 straight years on a 50k RPS platform.",
    },
    {
      title: "Bee Our Guest",
      detail: "Built queue systems that have never dropped a single message.",
    },
    {
      title: "The Librarian",
      detail: "Wrote documentation so good that people actually read it.",
    },
  ],
};

export interface Skill {
  name: string;
  enchant: string;
  level: string;
  /** tailwind color for the icon glow */
  glow: string;
}

export const skills: Skill[] = [
  { name: "Java", enchant: "Sharpness", level: "X", glow: "#ff7b4f" },
  { name: "Go", enchant: "Efficiency", level: "VIII", glow: "#7be0ff" },
  { name: "Node.js", enchant: "Unbreaking", level: "VII", glow: "#9dff6e" },
  { name: "PostgreSQL", enchant: "Mending", level: "IX", glow: "#7bd4ff" },
  { name: "Redis", enchant: "Swift Sneak", level: "VII", glow: "#ff6e6e" },
  { name: "Kafka", enchant: "Looting", level: "VI", glow: "#ffd76e" },
  { name: "Docker", enchant: "Silk Touch", level: "VIII", glow: "#7bd4ff" },
  { name: "Kubernetes", enchant: "Protection", level: "VII", glow: "#c48bff" },
  { name: "AWS", enchant: "Flame", level: "IX", glow: "#ffb84f" },
];

export interface Project {
  name: string;
  icon: string;
  description: string;
  stack: string[];
  loot: string;
}

export const projects: Project[] = [
  {
    name: "CraftCommerce",
    icon: "⚒",
    description:
      "Order-processing engine that survived flash sales without sweating. Idempotent pipelines, saga-based checkout, zero double charges.",
    stack: ["Go", "PostgreSQL", "Redis", "Kafka"],
    loot: "12,000 RPS · p99 45ms",
  },
  {
    name: "NetherLink",
    icon: "🔥",
    description:
      "Realtime WebSocket gateway routing millions of multiplayer game events with backpressure and presence tracking.",
    stack: ["Node.js", "Redis Streams", "Docker"],
    loot: "50k concurrent sockets",
  },
  {
    name: "VaultKeeper",
    icon: "🛡",
    description:
      "Secrets and configuration service with full audit trails, dynamic credentials and automatic rotation.",
    stack: ["Java", "HashiCorp Vault", "PostgreSQL"],
    loot: "SOC2-ready · 0 leaked secrets",
  },
  {
    name: "ChunkLoader",
    icon: "📦",
    description:
      "ETL pipeline chunking 2TB of game telemetry per day into the analytics lake with exactly-once semantics.",
    stack: ["Python", "Kafka", "S3", "Airflow"],
    loot: "2TB/day · exactly-once",
  },
];

export const serverStats = [
  { label: "Uptime", value: "99.99%", icon: "▲" },
  { label: "TPS", value: "20.0", icon: "◆" },
  { label: "p99 latency", value: "45ms", icon: "⚡" },
  { label: "Deploys / week", value: "14", icon: "⬢" },
];

export const consoleLog = [
  "[12:00:01] [Server thread/INFO]: Starting backend server v8.1",
  "[12:00:02] [Server thread/INFO]: Loading properties… 342 modules found",
  "[12:00:03] [Server thread/INFO]: Preparing spawn region: 96 containers",
  "[12:00:04] [Server thread/INFO]: Done (2.314s)! For help, type /help",
  "[12:00:05] [Server thread/INFO]: BlockSmith joined the game",
  "[12:00:07] [Server thread/INFO]: Health check passed in 12ms",
  "> _",
];

export const socials = [
  { label: "/github", href: "https://github.com", hint: "github.com/blocksmith" },
  { label: "/linkedin", href: "https://linkedin.com", hint: "in/blocksmith" },
  { label: "/email", href: "mailto:hello@blocksmith.dev", hint: "hello@blocksmith.dev" },
  { label: "/resume", href: "#", hint: "loot_table.pdf" },
];
