import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/auth";
export const dynamic="force-dynamic";
export async function POST(request:Request){
  const form=await request.formData();
  const id=form.get("authorization_id"), decision=form.get("decision");
  if(typeof id!=="string"||id.length<1||id.length>256||!(decision==="approve"||decision==="deny")){
    return NextResponse.json({error:"Invalid authorization request"},{status:400});
  }
  const client=await createClient();
  const {data:{user}}=await client.auth.getUser();
  const role=await getCurrentUserRole();
  if(!user || (role!=="admin"&&role!=="staff"))return NextResponse.json({error:"Forbidden"},{status:403});
  const action=decision==="approve" ? client.auth.oauth.approveAuthorization(id) : client.auth.oauth.denyAuthorization(id);
  const {data,error}=await action;
  if(error||!data)return NextResponse.json({error:"Authorization failed"},{status:400});
  return NextResponse.redirect(data.redirect_url,{status:303});
}
