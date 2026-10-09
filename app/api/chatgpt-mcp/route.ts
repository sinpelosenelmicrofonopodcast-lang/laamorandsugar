import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = [
  { name:"list_catalog", description:"List products, their published state, categories and images.", inputSchema:{ type:"object", properties:{}, additionalProperties:false }, annotations:{readOnlyHint:true} },
  { name:"save_product", description:"Create or modify a product. An id updates an existing item. New products require a name, slug, and confirmed price. No auto-publication.", inputSchema:{type:"object",properties:{id:{type:"string"},name:{type:"string"},slug:{type:"string"},category_id:{type:"string"},base_price:{type:"number"},short_description:{type:"string"},description:{type:"string"},seasonal:{type:"boolean"},featured:{type:"boolean"},status:{type:"string",enum:["active","draft","archived"]},active:{type:"boolean"}},additionalProperties:false}, annotations:{destructiveHint:false} },
  { name:"save_collection",description:"Create or modify a category or collection.", inputSchema:{type:"object",properties:{id:{type:"string"},name:{type:"string"},slug:{type:"string"},description:{type:"string"},image_url:{type:"string"},sort_order:{type:"integer"}},additionalProperties:false},annotations:{destructiveHint:false} },
  { name:"upload_product_image",description:"Upload an original image (base64 PNG/JPEG/WebP, <=4 MB), optionally attach to a product. Call only for owner-supplied assets; never label generated concepts as photos of actual products.",inputSchema:{type:"object",properties:{filename:{type:"string"},base64:{type:"string"},product_id:{type:"string"},alt_text:{type:"string"}},required:["filename","base64"],additionalProperties:false},annotations:{destructiveHint:false} },
  { name:"remove_product_image",description:"Unlink a product image without destroying the original stored file. Requires image row id.",inputSchema:{type:"object",properties:{image_id:{type:"string"}},required:["image_id"],additionalProperties:false},annotations:{destructiveHint:true} }
] as const;
const uuid = (value:unknown) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const textVal = (s:unknown, length=500) => typeof s === "string" && s.length<=length ? s : undefined;
const result = (value:unknown) => ({content:[{type:"text",text:JSON.stringify(value)}]});
const rpc = (id:unknown, body:unknown) => NextResponse.json({jsonrpc:"2.0",id,result:body},{headers:{"Cache-Control":"no-store"}});
const failure = (id:unknown,code:number,message:string,status=200) => NextResponse.json({jsonrpc:"2.0",id,error:{code,message}},{status,headers:{"Cache-Control":"no-store"}});

async function authorized(request:Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token.length > 8192) return false;
  const authClient = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(),{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error} = await authClient.auth.getUser(token);
  if (error || !user) return false;
  const admin = createAdminClient();
  const {data:role} = await admin.from("roles").select("role").eq("user_id",user.id).maybeSingle();
  return role?.role === "admin" || role?.role === "staff";
}
async function callTool(name:string,args:Record<string,unknown>) {
  const db = createAdminClient();
  if (name === "list_catalog") {
    const [p,c,i] = await Promise.all([
      db.from("products").select("id,name,slug,category_id,base_price,status,active,seasonal").order("name"),
      db.from("categories").select("id,name,slug,description,image_url,sort_order").order("sort_order"),
      db.from("product_images").select("id,product_id,url,alt_text,sort_order,is_primary").order("sort_order")
    ]);
    if(p.error || c.error || i.error) throw Error(p.error?.message||c.error?.message||i.error?.message);
    return {products:p.data,categories:c.data,images:i.data};
  }
  if (name === "save_product") {
    const keys = ["name","slug","category_id","base_price","short_description","description","seasonal","featured","status","active"] as const;
    const patch:Record<string,unknown> = {};
    for(const key of keys) if(args[key]!==undefined) patch[key]=args[key];
    for(const key of ["name","slug","short_description","description"]) if(patch[key]!==undefined && !textVal(patch[key], key==="description"?10000:500)) throw Error("Invalid "+key);
    if(patch.category_id!==undefined && !uuid(patch.category_id)) throw Error("Invalid category_id");
    if(patch.base_price!==undefined && (typeof patch.base_price!=="number"||!Number.isFinite(patch.base_price)||patch.base_price<0)) throw Error("Invalid price");
    if (args.id && !uuid(args.id)) throw Error("Invalid product id");
    if (!args.id && (!patch.name||!patch.slug||patch.base_price===undefined)) throw Error("Name, slug and price required.");
    if (!args.id){ patch.status="draft"; patch.active=false; }
    const query = args.id ? db.from("products").update(patch).eq("id",args.id as string) : db.from("products").insert(patch as never);
    const {data,error}=await query.select("id,name,slug,status,active").single();
    if(error) throw Error(error.message);
    return data;
  }
  if (name === "save_collection") {
    const keys=["name","slug","description","image_url","sort_order"] as const;
    const patch:Record<string,unknown>={};
    for(const key of keys) if(args[key]!==undefined) patch[key]=args[key];
    if(args.id && !uuid(args.id)) throw Error("Invalid category id");
    for(const k of ["name","slug","description","image_url"]) if(patch[k]!==undefined && !textVal(patch[k], k==="description"?3000:800)) throw Error("Invalid "+k);
    if(!args.id && (!patch.name||!patch.slug)) throw Error("Name and slug required");
    if(patch.sort_order!==undefined && (!Number.isInteger(patch.sort_order)||Number(patch.sort_order)<0)) throw Error("Invalid sort order");
    const q=args.id ? db.from("categories").update(patch).eq("id",args.id as string) : db.from("categories").insert(patch as never);
    const {data,error}=await q.select("*").single();if(error)throw Error(error.message);return data;
  }
  if (name === "upload_product_image") {
    const b64=textVal(args.base64,6_000_000),fileName=textVal(args.filename,180);
    if(!b64||!fileName||!/^[A-Za-z0-9_-]+\.(png|jpe?g|webp)$/i.test(fileName))throw Error("Invalid image");
    if(args.product_id && !uuid(args.product_id)) throw Error("Invalid product id");
    const binary=Buffer.from(b64,"base64");
    if(binary.length===0||binary.length>4*1024*1024||binary.toString("base64").replace(/=+$/,"")!==b64.replace(/=+$/,""))throw Error("Invalid image data or size");
    const isPng=binary.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const isJpg=binary.subarray(0,3).equals(Buffer.from([255,216,255]));
    const isWebp=binary.toString("ascii",0,4)==="RIFF"&&binary.toString("ascii",8,12)==="WEBP";
    const ext=isPng?"png":isJpg?"jpg":isWebp?"webp":null;
    if(!ext)throw Error("Unsupported image bytes");
    const mime=ext==="png"?"image/png":ext==="jpg"?"image/jpeg":"image/webp";
    const path=`admin/chatgpt/${new Date().toISOString().slice(0,10)}/${randomUUID()}.${ext}`;
    const {error}=await db.storage.from("brand-media").upload(path,binary,{contentType:mime,upsert:false});
    if(error)throw Error(error.message);
    const url=db.storage.from("brand-media").getPublicUrl(path).data.publicUrl;
    await db.from("media_assets").insert({file_name:fileName,storage_path:path,public_url:url,bucket:"brand-media",mime_type:mime,size_bytes:binary.length,alt_text:textVal(args.alt_text,300)??null});
    if(args.product_id){
      const {count}=await db.from("product_images").select("id",{count:"exact",head:true}).eq("product_id",args.product_id as string);
      const {error:attachError}=await db.from("product_images").insert({product_id:args.product_id as string,url,alt_text:textVal(args.alt_text,300)??null,is_primary:(count??0)===0,sort_order:count??0});
      if(attachError)throw Error("Uploaded but not attached: "+attachError.message);
    }
    return {url,storage_path:path,attached_to:args.product_id??null};
  }
  if (name==="remove_product_image") {
    if(!uuid(args.image_id))throw Error("Invalid image_id");
    const {data,error}=await db.from("product_images").delete().eq("id",args.image_id as string).select("id,product_id").single();
    if(error)throw Error(error.message);
    return {unlinked:data,original_file_preserved:true};
  }
  throw Error("Unknown tool");
}
export async function POST(request:Request) {
  const length=Number(request.headers.get("content-length")??"0");
  if(length>6_000_000)return NextResponse.json({error:"Payload too large"},{status:413});
  const data=await request.json().catch(()=>null);
  if(!data||data.jsonrpc!=="2.0"||typeof data.method!=="string")return failure(null,-32600,"Invalid request",400);
  const id=data.id??null;
  if(data.method==="initialize")return rpc(id,{protocolVersion:"2025-06-18",capabilities:{tools:{}},serverInfo:{name:"amor-sugar-catalog",version:"0.1.0"}});
  if(data.method==="notifications/initialized")return new Response(null,{status:202});
  if(data.method==="ping")return rpc(id,{});
  if(data.method==="tools/list"){
    if(!await authorized(request))return failure(id,-32001,"Unauthorized",401);
    return rpc(id,{tools:METHODS});
  }
  if(data.method==="tools/call"){
    if(!await authorized(request))return failure(id,-32001,"Unauthorized",401);
    const name=data.params?.name,args=data.params?.arguments??{};
    if(!METHODS.some(x=>x.name===name))return failure(id,-32602,"Unknown tool");
    if(!args||Array.isArray(args)||typeof args!=="object")return failure(id,-32602,"Invalid arguments");
    try{return rpc(id,result(await callTool(name,args)));}
    catch(e){return rpc(id,{content:[{type:"text",text:e instanceof Error?e.message:"Operation failed"}],isError:true});}
  }
  return failure(id,-32601,"Method not found");
}
export async function GET(){return new Response("MCP endpoint",{status:405,headers:{"Cache-Control":"no-store"}});}
