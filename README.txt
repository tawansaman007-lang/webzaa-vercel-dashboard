Webzaa Downtime Dashboard for Vercel

This site reads the existing Supabase dashboard endpoint. It does not write to or delete Supabase data.

Vercel Environment Variables (Project -> Settings -> Environment Variables):
  SUPABASE_DASHBOARD_URL = https://jmodbqvcjlgnrjhgzeat.supabase.co/functions/v1/webzaa-downtime-api
  DASHBOARD_READ_TOKEN   = same secret value configured as DASHBOARD_READ_TOKEN in the Supabase Edge Function
  DASHBOARD_PASSWORD     = a new password you choose for people viewing this dashboard
  SESSION_SECRET         = a random secret at least 32 characters long

Keep all four values in Vercel Environment Variables. Never paste them into index.html or a browser.
After adding or changing variables, redeploy the Vercel project. The page refreshes data every 60 seconds.

Expected Supabase Edge Function response: { machines, code_minutes, machine_count, record_count,
latest_received_at, month }. The existing SQL function webzaa_dashboard supplies that response.

The login is a shared-password gate with a 12-hour HttpOnly signed session cookie. It is intended
for a small internal pilot; use a strong password and restrict Vercel deployment access if needed.
