import { NextResponse } from "next/server";
import { requireAdmin, isAdminContext, requireRoles } from "@/lib/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const OWNER_ROLES = ["chief_admin"] as const;

export async function GET(request: Request) {
  const context = await requireAdmin(request);
  if (!isAdminContext(context)) return context;
  const denied = requireRoles(context, OWNER_ROLES);
  if (denied) return denied;
  const { data: stores, error } = await context.admin.from("partner_stores")
    .select("id,store_code,store_name,status,created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load Partner Stores." }, { status: 503 });
  const ids = (stores ?? []).map((s) => s.id);
  const { data: members, error: memberError } = ids.length
    ? await context.admin.from("partner_store_members").select("store_id,user_id,role,is_active,created_at").in("store_id", ids)
    : { data: [], error: null };
  if (memberError) return NextResponse.json({ error: "Unable to load Store members." }, { status: 503 });
  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: profiles, error: profileError } = userIds.length
    ? await context.admin.from("profiles").select("supabase_user_id,email,full_name,phone_e164").in("supabase_user_id", userIds)
    : { data: [], error: null };
  if (profileError) return NextResponse.json({ error: "Unable to load Store user profiles." }, { status: 503 });
  const byUser = new Map((profiles ?? []).map((p) => [p.supabase_user_id, p]));
  return NextResponse.json({ stores: (stores ?? []).map((s) => ({
    ...s, members: (members ?? []).filter((m) => m.store_id === s.id).map((m) => ({
      ...m, email: byUser.get(m.user_id)?.email ?? null, full_name: byUser.get(m.user_id)?.full_name ?? null
    }))
  })) }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(request: Request) {
  const context = await requireAdmin(request);
  if (!isAdminContext(context)) return context;
  const denied = requireRoles(context, OWNER_ROLES);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() :
    typeof body.ownerEmail === "string" ? body.ownerEmail.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter the registered email of the user." }, { status: 400 });
  const { data: profile, error: profileError } = await context.admin.from("profiles")
    .select("supabase_user_id,email").ilike("email", email).maybeSingle();
  if (profileError) return NextResponse.json({ error: "Unable to find the user account." }, { status: 503 });
  if (!profile?.supabase_user_id) return NextResponse.json({ error: "No E-Commerce account is linked to this email. Ask the user to sign in to the storefront once, then assign the Store ID." }, { status: 404 });

  if (typeof body.storeCode === "string") {
    const storeCode = body.storeCode.trim().toUpperCase();
    const role = ["owner", "admin", "staff"].includes(body.role) ? body.role : "staff";
    const { data: store, error: storeError } = await context.admin.from("partner_stores")
      .select("id,store_code,status").eq("store_code", storeCode).maybeSingle();
    if (storeError || !store) return NextResponse.json({ error: "Store ID not found." }, { status: 404 });
    if (store.status !== "active") return NextResponse.json({ error: "This Store is not active." }, { status: 409 });
    const { error } = await context.admin.from("partner_store_members").upsert({
      store_id: store.id, user_id: profile.supabase_user_id, role, is_active: true, created_by: context.userId
    }, { onConflict: "store_id,user_id" });
    if (error) return NextResponse.json({ error: "Unable to assign this user to the Store." }, { status: 400 });
    await context.admin.from("audit_logs").insert({ actor_user_id: context.userId, action: "partner_store.member_assigned", entity_type: "partner_store", entity_id: store.id, details: { email, role, store_code: store.store_code } });
    return NextResponse.json({ success: true, storeCode: store.store_code });
  }

  const storeName = typeof body.storeName === "string" ? body.storeName.trim() : "";
  if (storeName.length < 2 || storeName.length > 120) return NextResponse.json({ error: "Store name must be 2–120 characters." }, { status: 400 });
  const { data: store, error: createError } = await context.admin.from("partner_stores")
    .insert({ store_name: storeName, created_by: context.userId }).select("id,store_code,store_name,status").single();
  if (createError || !store) return NextResponse.json({ error: "Unable to create Partner Store." }, { status: 400 });
  const { error: memberError } = await context.admin.from("partner_store_members").insert({
    store_id: store.id, user_id: profile.supabase_user_id, role: "owner", is_active: true, created_by: context.userId
  });
  if (memberError) {
    await context.admin.from("partner_stores").delete().eq("id", store.id);
    return NextResponse.json({ error: "Store was created but owner assignment failed. Please retry." }, { status: 400 });
  }
  await context.admin.from("audit_logs").insert({ actor_user_id: context.userId, action: "partner_store.created", entity_type: "partner_store", entity_id: store.id, details: { store_name: storeName, store_code: store.store_code, owner_email: email } });
  return NextResponse.json({ store }, { status: 201 });
}
