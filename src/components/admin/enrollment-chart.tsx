"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  count: {
    label: "Students",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function EnrollmentChart({
  enrollmentByGrade,
}: {
  enrollmentByGrade: { grade: string; count: number }[];
}) {
  return (
    <Card className="rounded-none shadow-none">
      <CardHeader className="border-b pb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Enrollment by Grade
        </span>
        <p className="text-sm text-muted-foreground">Current academic year</p>
      </CardHeader>
      <CardContent className="pt-6">
        {enrollmentByGrade.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No enrollment data yet.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart
              data={enrollmentByGrade}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="grade"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={
                  <ChartTooltipContent hideLabel={false} nameKey="count" />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={0}
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
