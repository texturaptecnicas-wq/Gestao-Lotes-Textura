import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Removes orphaned photos from the `fotos-lotes` storage bucket: objects that
// exist in storage but are no longer referenced by any active lote or
// delivered-lote (historico) record. Uses the Storage API (direct SQL deletion
// from storage.objects is blocked) with small batches to stay within the
// per-request object limit.
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

  // 1) Collect every photo path still referenced by active or delivered lotes.
  const referenced = new Set<string>();
  const { data: lotesFotos } = await supabase.from("lotes").select("foto");
  (lotesFotos || []).forEach((l) => {
    if (l.foto && !/^https?:\/\//.test(l.foto)) referenced.add(l.foto);
  });
  const { data: histFotos } = await supabase.from("historico").select("foto");
  (histFotos || []).forEach((h) => {
    if (h.foto && !/^https?:\/\//.test(h.foto)) referenced.add(h.foto);
  });

  // 2) List every object in the bucket (paginated, 1000 per page).
  const allPaths: string[] = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.storage
      .from("fotos-lotes")
      .list("", { limit, offset });
    if (error) break;
    if (!data || data.length === 0) break;
    allPaths.push(...data.map((d) => d.name));
    if (data.length < limit) break;
    offset += limit;
  }

  // 3) Orphans = in storage but not referenced anywhere.
  const orphans = allPaths.filter((p) => !referenced.has(p));

  // 4) Delete orphans in small batches (100) to respect the per-request limit.
  let deleted = 0;
  const errors: string[] = [];
  for (let i = 0; i < orphans.length; i += 100) {
    const batch = orphans.slice(i, i + 100);
    const { error } = await supabase.storage.from("fotos-lotes").remove(batch);
    if (error) {
      errors.push(error.message);
    } else {
      deleted += batch.length;
    }
  }

  return new Response(
    JSON.stringify({
      totalObjects: allPaths.length,
      referenced: referenced.size,
      orphansFound: orphans.length,
      deleted,
      errors,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
