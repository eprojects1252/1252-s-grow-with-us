import { NextResponse } from "next/server";
import { requireAdmin, isAdminContext, requireRoles } from "@/lib/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHIEF_ADMIN_ONLY = ["chief_admin"] as const;

export async function POST(request: Request) {
  const context = await requireAdmin(request);
  if (!isAdminContext(context)) return context;
  const denied = requireRoles(context, CHIEF_ADMIN_ONLY);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter the registered email of an existing customer account." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await context.admin
    .from("profiles").select("supabase_user_id,email,full_name")
    .ilike("email", email).maybeSingle();
  if (profileError) return NextResponse.json({ error: "Unable to verify this account." }, { status: 503 });
  if (!profile?.supabase_user_id) {
    return NextResponse.json({ error: "No E-Commerce account is linked to this email. Ask the person to sign in once first." }, { status: 404 });
  }
  if (profile.supabase_user_id === context.userId) {
    return NextResponse.json({ error: "Your Chief Admin account cannot be changed into a Sub Admin." }, { status: 409 });
  }

  const { data: existing, error: existingError } = await context.admin
    .from("admin_members").select("role").eq("user_id", profile.supabase_user_id).maybeSingle();
  if (existingError) return NextResponse.json({ error: "Unable to verify the existing role." }, { status: 503 });
  if (existing?.role === "chief_admin") {
    return NextResponse.json({ error: "A Chief Admin account cannot be reassigned as Sub Admin." }, { status: 409 });
  }

  const { error } = await context.admin.from("admin_members").upsert({
    user_id: profile.supabase_user_id, role: "sub_admin", is_active: true
  }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Unable to assign Sub Admin access." }, { status: 400 });

  await context.admin.from("audit_logs").insert({
    actor_user_id: context.userId, action: "admin.sub_admin_assigned",
    entity_type: "admin_member", entity_id: profile.supabase_user_id,
    details: { email, role: "sub_admin" }
  });
  return NextResponse.json({ success: true, member: { user_id: profile.supabase_user_id, email, full_name: profile.full_name, role: "sub_admin", is_active: true } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await requireAdmin(request);
  if (!isAdminContext(context)) return context;
  const denied = requireRoles(context, CHIEF_ADMIN_ONLY);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return NextResponse.json({ error: "A valid Sub Admin account is required." }, { status: 400 });
  }
  if (userId === context.userId) return NextResponse.json({ error: "Chief Admin cannot disable their own master account here." }, { status: 409 });

  const { data: existing, error: existingError } = await context.admin
    .from("admin_members").select("role,is_active").eq("user_id", userId).maybeSingle();
  if (existingError) return NextResponse.json({ error: "Unable to verify this member." }, { status: 503 });
  if (!existing) return NextResponse.json({ error: "Admin member not found." }, { status: 404 });
  if (existing.role !== "sub_admin") return NextResponse.json({ error: "Only Sub Admin memberships can be changed here." }, { status: 403 });
  if (typeof body?.is_active !== "boolean") return NextResponse.json({ error: "Choose whether this Sub Admin should be active." }, { status: 400 });

  const { error } = await context.admin.from("admin_members")
    .update({ is_active: body.is_active, updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (error) return NextResponse.json({ error: "Unable to update Sub Admin access." }, { status: 400 });

  await context.admin.from("audit_logs").insert({
    actor_user_id: context.userId, action: body.is_active ? "admin.sub_admin_activated" : "admin.sub_admin_disabled",
    entity_type: "admin_member", entity_id: userId, details: { role: "sub_admin", is_active: body.is_active }
  });
  return NextResponse.json({ success: true, userId, is_active: body.is_active });
}
