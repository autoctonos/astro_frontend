import type { APIRoute } from "astro";


export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const data = Object.fromEntries(form.entries());
  console.log("[PayU confirmation]", data);
  return new Response("OK", { status: 200 });
};
