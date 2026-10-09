import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Authorize ChatGPT | L&A Amor & Sugar", robots: { index: false, follow: false } };

export default async function OAuthConsentPage({searchParams}:{searchParams:Promise<{authorization_id?:string}>}) {
  const {authorization_id:id}=await searchParams;
  if(!id || id.length>256) return <main className="container py-16">Invalid authorization request.</main>;
  const client=await createClient();
  const {data:{user}}=await client.auth.getUser();
  if(!user) redirect("/login?next="+encodeURIComponent("/oauth/consent?authorization_id="+encodeURIComponent(id)));
  const role=await getCurrentUserRole();
  if(role!=="admin" && role!=="staff")return <main className="container py-16">Administrator permission required.</main>;
  const {data,error}=await client.auth.oauth.getAuthorizationDetails(id);
  if(error||!data)return <main className="container py-16">Authorization request expired or invalid.</main>;
  if(!("authorization_id" in data))redirect(data.redirect_url);
  return <main className="container max-w-xl py-16">
    <section className="rounded-3xl border bg-white p-8 shadow-sm space-y-5">
      <h1 className="text-2xl font-semibold">Authorize ChatGPT access</h1>
      <p className="text-sm">An app requests permission to use your L&A Amor & Sugar account. Only a team administrator can grant this connection.</p>
      <p className="font-medium">{data.client.name}</p>
      <p className="break-all text-sm">Callback: {data.redirect_uri}</p>
      <p className="text-sm">Requested scopes: {data.scope ?? "Not specified"}</p>
      <p className="text-sm font-medium">If approved, ChatGPT will be able to manage store products, collections and catalog images on behalf of this signed-in team member.</p>
      <form action="/api/oauth/decision" method="post" className="flex gap-3">
        <input type="hidden" name="authorization_id" value={id}/>
        <button name="decision" value="approve" type="submit" className="rounded-xl bg-black px-5 py-3 text-white">Authorize</button>
        <button name="decision" value="deny" type="submit" className="rounded-xl border px-5 py-3">Cancel</button>
      </form>
    </section>
  </main>;
}
