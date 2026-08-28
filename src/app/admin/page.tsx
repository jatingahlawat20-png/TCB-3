import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireUser(["ADMIN"]);

  let totalUsers = 0;
  let totalTrainers = 0;
  let totalClients = 0;
  let totalRequests = 0;
  let recentUsers: any[] = [];

  try {
    [totalUsers, totalTrainers, totalClients, totalRequests] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "TRAINER" } }),
        prisma.user.count({ where: { role: "CLIENT" } }),
        prisma.coachingRequest.count().catch(() => 0),
      ]);

    recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
  }

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <span className="rounded-full bg-red-500/10 border border-red-500/30 px-3.5 py-1 text-xs font-bold text-red-400 uppercase tracking-wider">
              Super Admin Console
            </span>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">
              System Administration
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Authenticated Admin: <span className="font-semibold text-white">{user.name}</span> ({user.email})
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total Accounts</p>
            <p className="mt-2 text-3xl font-black text-white">{totalUsers}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Trainers</p>
            <p className="mt-2 text-3xl font-black text-[#7CFF3B]">{totalTrainers}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Clients</p>
            <p className="mt-2 text-3xl font-black text-blue-400">{totalClients}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Coaching Requests</p>
            <p className="mt-2 text-3xl font-black text-yellow-400">{totalRequests}</p>
          </div>
        </div>

        <div className="mt-10 rounded-[32px] border border-white/10 bg-[#11161D] p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Accounts</h2>
          <div className="divide-y divide-white/10">
            {recentUsers.map((u) => (
              <div key={u.id} className="py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">{u.name}</h4>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-gray-300">
                    {u.role}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
