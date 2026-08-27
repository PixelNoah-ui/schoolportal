// app/admin/settings/page.tsx
import { SiteHeader } from "@/components/admin/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { schoolProfile } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <>
      <SiteHeader title="Settings" />
      <div className="flex flex-1 flex-col gap-5 p-6 max-w-2xl">
        <Card className="rounded-none shadow-none">
          <CardHeader className="border-b pb-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              School Profile
            </span>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 pt-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input
                defaultValue={schoolProfile.name}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Principal</Label>
              <Input
                defaultValue={schoolProfile.principal}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                defaultValue={schoolProfile.email}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                defaultValue={schoolProfile.phone}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input
                defaultValue={schoolProfile.address}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Website</Label>
              <Input
                defaultValue={schoolProfile.website}
                className="rounded-none"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button className="rounded-none">Save changes</Button>
        </div>
      </div>
    </>
  );
}
