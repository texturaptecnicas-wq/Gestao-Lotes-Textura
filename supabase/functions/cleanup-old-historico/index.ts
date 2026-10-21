import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// One-time cleanup: removes delivered lotes (historico) older than 1 month
// together with their stored photos. Photos are deleted through the Storage
// API (direct SQL deletion from storage.objects is blocked by a guard
// trigger), so no orphaned files are left behind.
//
// Scope is strict: only rows in `historico` (delivered lotes) with a valid
// `data_entrega` older than one calendar month are removed. Active lotes,
// recent deliveries, programacao, finance and quality data are untouched.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing server credentials." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // One calendar month ago.
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 1);
  const cutoffIso = cutoff.toISOString();

  // 1) Fetch the old delivered lotes (ids + photo paths).
  const { data: oldRecords, error: fetchErr } = await supabase
    .from("historico")
    .select("id, foto")
    .lt("data_entrega", cutoffIso);

  if (fetchErr) {
    return new Response(
      JSON.stringify({ error: fetchErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const records = oldRecords || [];
  // Only path-style photos are stored in our bucket; full URLs are external.
  const photoPaths = records
    .map((r) => r.foto)
    .filter((f): f is string => !!f && !/^https?:\/\//.test(f));

  // 2) Delete the photos through the Storage API (batched, max 1000 per call).
  let photosDeleted = 0;
  const storageErrors: string[] = [];
  for (let i = 0; i < photoPaths.length; i += 1000) {
    const batch = photoPaths.slice(i, i + 1000);
    const { error: storageErr } = await supabase.storage
      .from("fotos-lotes")
      .remove(batch);
    if (storageErr) {
      storageErrors.push(storageErr.message);
    } else {
      photosDeleted += batch.length;
    }
  }

  // 3) Delete the old delivered lotes themselves.
  const { count: recordsDeleted, error: delErr } = await supabase
    .from("historico")
    .delete({ count: "exact" })
    .lt("data_entrega", cutoffIso);

  if (delErr) {
    return new Response(
      JSON.stringify({ error: delErr.message, photosDeleted, storageErrors }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      cutoff: cutoffIso,
      recordsDeleted: recordsDeleted ?? 0,
      photosDeleted,
      storageErrors,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
