"use client";

import { useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { SiteHeader } from "@/components/admin/site-header";
import { PageHeader } from "@/components/admin/page-header";
import {
  EntityFormDialog,
  type FieldConfig,
} from "@/components/admin/entity-form-dialog";
import { RowActions } from "@/components/admin/row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminPaymentOptions,
  useCreatePaymentOption,
  useDeletePaymentOption,
  useUpdatePaymentOption,
} from "@/hooks/use-payment-options";

const paymentOptionFields: FieldConfig[] = [
  { name: "name", label: "Display name" },
  {
    name: "payment_method",
    label: "Payment method",
    type: "select",
    options: [
      { label: "Bank transfer", value: "bank_transfer" },
      { label: "Mobile money", value: "mobile_money" },
      { label: "Cash", value: "cash" },
      { label: "Other", value: "other" },
    ],
  },
  { name: "account_name", label: "Account name" },
  { name: "account_number", label: "Account number" },
  { name: "phone_number", label: "Phone number" },
  { name: "icon_url", label: "Icon URL", fullWidth: true },
  { name: "display_order", label: "Display order", type: "number" },
  {
    name: "is_active",
    label: "Visibility",
    type: "select",
    options: [
      { label: "Visible to students", value: "true" },
      { label: "Hidden", value: "false" },
    ],
  },
  { name: "instructions", label: "Instructions", fullWidth: true },
];

const emptyValues = {
  name: "",
  payment_method: "bank_transfer",
  account_name: "PIXELNOAH",
  account_number: "",
  phone_number: "",
  icon_url: "",
  display_order: "0",
  is_active: "true",
  instructions: "",
};

function optionValues(option: {
  name: string;
  paymentMethod: string;
  accountName: string | null;
  accountNumber: string | null;
  phoneNumber: string | null;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  instructions: string | null;
}) {
  return {
    name: option.name,
    payment_method: option.paymentMethod,
    account_name: option.accountName ?? "",
    account_number: option.accountNumber ?? "",
    phone_number: option.phoneNumber ?? "",
    icon_url: option.iconUrl ?? "",
    display_order: String(option.displayOrder),
    is_active: String(option.isActive),
    instructions: option.instructions ?? "",
  };
}

export default function PaymentOptionsPage() {
  const { data, isLoading } = useAdminPaymentOptions();
  const createOption = useCreatePaymentOption();
  const updateOption = useUpdatePaymentOption();
  const deleteOption = useDeletePaymentOption();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <SiteHeader title="Payment Options" />
      <main className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <PageHeader eyebrow="Payment methods" count={data?.length} />
          <EntityFormDialog
            mode="add"
            title="Add payment option"
            description="Add the account details students should use for payment."
            fields={paymentOptionFields}
            initialValues={emptyValues}
            columns={2}
            open={addOpen}
            onOpenChange={setAddOpen}
            onSubmit={(values) => createOption.mutateAsync(values)}
            isLoading={createOption.isPending}
            trigger={
              <Button className="rounded-none">
                <Plus className="size-4" /> Add option
              </Button>
            }
          />
        </div>

        <Card className="rounded-none shadow-none">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Option</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="p-6 text-center text-sm text-muted-foreground"
                    >
                      Loading payment options...
                    </TableCell>
                  </TableRow>
                ) : data?.length ? (
                  data.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {option.iconUrl ? (
                            <span
                              aria-hidden="true"
                              className="size-9 border bg-contain bg-center bg-no-repeat p-1"
                              style={{
                                backgroundImage: `url(${option.iconUrl})`,
                              }}
                            />
                          ) : (
                            <CreditCard className="size-5 text-primary" />
                          )}
                          <div>
                            <p className="font-medium">{option.name}</p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {option.paymentMethod.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {option.accountName || option.accountNumber || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {option.phoneNumber || option.accountNumber || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {option.isActive ? "Visible" : "Hidden"}
                      </TableCell>
                      <TableCell>
                        <RowActions
                          entityName={option.name}
                          fields={paymentOptionFields}
                          values={optionValues(option)}
                          onEdit={(values) =>
                            updateOption.mutateAsync({
                              id: option.id,
                              payload: values,
                            })
                          }
                          onDelete={() => deleteOption.mutateAsync(option.id)}
                          editIsLoading={updateOption.isPending}
                          deleteIsLoading={deleteOption.isPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="p-10 text-center text-sm text-muted-foreground"
                    >
                      No payment options yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
