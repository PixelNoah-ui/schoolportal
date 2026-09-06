import { createClient } from "@/utils/supabase/client";

export type PaymentOptionRow = {
  id: string;
  name: string;
  paymentMethod: string;
  accountName: string | null;
  accountNumber: string | null;
  phoneNumber: string | null;
  instructions: string | null;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

type PaymentOptionRecord = {
  id: string;
  name: string;
  payment_method: string;
  account_name: string | null;
  account_number: string | null;
  phone_number: string | null;
  instructions: string | null;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
};

function mapOption(option: PaymentOptionRecord): PaymentOptionRow {
  return {
    id: option.id,
    name: option.name,
    paymentMethod: option.payment_method,
    accountName: option.account_name,
    accountNumber: option.account_number,
    phoneNumber: option.phone_number,
    instructions: option.instructions,
    iconUrl: option.icon_url,
    displayOrder: option.display_order,
    isActive: option.is_active,
  };
}

const selectFields =
  "id, name, payment_method, account_name, account_number, phone_number, instructions, icon_url, display_order, is_active";

export async function fetchPaymentOptions(
  includeInactive = false,
): Promise<PaymentOptionRow[]> {
  const supabase = createClient();
  let request = supabase
    .from("payment_options")
    .select(selectFields)
    .order("display_order", { ascending: true });
  if (!includeInactive) request = request.eq("is_active", true);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data as PaymentOptionRecord[]).map(mapOption);
}

export async function createPaymentOption(payload: Record<string, string>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_options")
    .insert({
      name: payload.name.trim(),
      payment_method: payload.payment_method,
      account_name: payload.account_name.trim() || null,
      account_number: payload.account_number.trim() || null,
      phone_number: payload.phone_number.trim() || null,
      instructions: payload.instructions.trim() || null,
      icon_url: payload.icon_url.trim() || null,
      display_order: Number(payload.display_order) || 0,
      is_active: payload.is_active !== "false",
    })
    .select(selectFields)
    .single();
  if (error) throw new Error(error.message);
  return mapOption(data as PaymentOptionRecord);
}

export async function updatePaymentOption(
  id: string,
  payload: Record<string, string>,
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_options")
    .update({
      name: payload.name.trim(),
      payment_method: payload.payment_method,
      account_name: payload.account_name.trim() || null,
      account_number: payload.account_number.trim() || null,
      phone_number: payload.phone_number.trim() || null,
      instructions: payload.instructions.trim() || null,
      icon_url: payload.icon_url.trim() || null,
      display_order: Number(payload.display_order) || 0,
      is_active: payload.is_active !== "false",
    })
    .eq("id", id)
    .select(selectFields)
    .single();
  if (error) throw new Error(error.message);
  return mapOption(data as PaymentOptionRecord);
}

export async function deletePaymentOption(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("payment_options")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { id };
}
