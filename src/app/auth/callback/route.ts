/**
 * Auth Callback Route — Handles email confirmation redirect.
 * Supabase redirects here after the user clicks the confirm link in their email.
 * Exchanges the auth code for a session and redirects to the dashboard.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const redirectTo = searchParams.get("redirect_to") ?? "/dashboard";

    if (code) {
        const supabase = await getSupabaseServerClient();
        await supabase.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(new URL(redirectTo, request.url));
}
