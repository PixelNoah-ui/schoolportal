// app/admin/page.tsx
import { GraduationCap, Users, Layers, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { StatCard } from "@/components/admin/stat-card";
import { EnrollmentChart } from "@/components/admin/enrollment-chart";
import { RecentStudentsTable } from "@/components/admin/recent-students-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  stats,
  classes,
  topSubjects,
  currentAcademicYear,
  currentSemester,
} from "@/lib/mock-data";

export default function AdminDashboardPage() {
  return (
    <>
      <SiteHeader title="Dashboard" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {currentAcademicYear} · {currentSemester}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Students"
            value={stats.totalStudents}
            delta={stats.studentsDelta}
            icon={GraduationCap}
          />
          <StatCard
            label="Total Teachers"
            value={stats.totalTeachers}
            delta={stats.teachersDelta}
            icon={Users}
          />
          <StatCard
            label="Total Classes"
            value={stats.totalClasses}
            delta={stats.classesDelta}
            icon={Layers}
          />
          <StatCard
            label="Average Score"
            value={`${stats.avgScore}%`}
            delta={stats.avgScoreDelta}
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EnrollmentChart />
          </div>
          <Card className="rounded-none shadow-none">
            <CardHeader className="border-b pb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Top Performing Subjects
              </span>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {topSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{sub.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {sub.className}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {sub.avgScore}%
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <RecentStudentsTable />

        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Classes Overview
            </span>
          </CardHeader>
          <CardContent className="grid grid-cols-1 divide-y p-0 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
            {classes.map((c) => (
              <div key={c.id} className="p-4">
                <p className="text-sm font-medium">
                  Grade {c.grade} - {c.section}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.teacher}
                </p>
                <p className="mt-3 text-2xl font-semibold tabular-nums">
                  {c.studentCount}
                </p>
                <p className="text-xs text-muted-foreground">students</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
