const endpoint = "https://qklnaqfspvmnlequqagf.supabase.co/functions/v1/workshop-create-order";
const workshopSlug = "sql-for-data-analysis-2026-11-14";
export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) return Response.json({ error: "Please enter valid registration details." }, { status: 400 });
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: new URL(request.url).origin },
      body: JSON.stringify({
        workshopSlug,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        experience: input.experience,
        goal: input.goal,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await response.json();
    return Response.json(data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "Please enter valid registration details." }, { status: 400 });
    return Response.json({ error: "Payment could not be started. Please try again shortly." }, { status: 502 });
  }
}
