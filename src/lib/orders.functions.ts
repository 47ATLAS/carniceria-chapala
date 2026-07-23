import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const orderInput = z.object({
  cliente_nombre: z.string().min(1).max(120),
  telefono: z.string().min(6).max(30),
  notas: z.string().max(500).optional().nullable(),
  items: z.array(z.object({
    id_producto: z.string().uuid(),
    cantidad: z.number().int().positive(),
  })).min(1),
});

export const createPublicOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderInput.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    // fetch product prices server-side (never trust client)
    const ids = data.items.map((i) => i.id_producto);
    const { data: prods, error: pErr } = await sb
      .from("productos").select("id_producto, precio, nombre, stock").in("id_producto", ids);
    if (pErr) throw new Error(pErr.message);
    const map = new Map(prods!.map((p) => [p.id_producto, p]));
    let total = 0;
    const lines = data.items.map((it) => {
      const p = map.get(it.id_producto);
      if (!p) throw new Error("Producto no encontrado");
      const price = Number(p.precio);
      total += price * it.cantidad;
      return { id_producto: it.id_producto, cantidad: it.cantidad, precio_unitario: price };
    });
    const { data: order, error: oErr } = await sb
      .from("pedidos")
      .insert({
        cliente_nombre: data.cliente_nombre,
        telefono: data.telefono,
        notas: data.notas ?? null,
        total,
        estado: "en_espera",
      })
      .select()
      .single();
    if (oErr) throw new Error(oErr.message);
    const { error: dErr } = await sb.from("detalle_pedido").insert(
      lines.map((l) => ({ ...l, id_pedido: order.id_pedido })),
    );
    if (dErr) throw new Error(dErr.message);
    return { id_pedido: order.id_pedido, total };
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pedidos")
      .select("*, detalle_pedido(*, productos(nombre))")
      .order("fecha", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    estado: z.enum(["en_espera", "listo_para_recoger", "entregado", "cancelado"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pedidos").update({ estado: data.estado }).eq("id_pedido", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pedidos").delete().eq("id_pedido", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => orderInput.parse(d))
  .handler(async ({ data, context }) => {
    const ids = data.items.map((i) => i.id_producto);
    const { data: prods, error: pErr } = await context.supabase
      .from("productos").select("id_producto, precio").in("id_producto", ids);
    if (pErr) throw new Error(pErr.message);
    const map = new Map(prods!.map((p) => [p.id_producto, Number(p.precio)]));
    let total = 0;
    const lines = data.items.map((it) => {
      const price = map.get(it.id_producto) ?? 0;
      total += price * it.cantidad;
      return { id_producto: it.id_producto, cantidad: it.cantidad, precio_unitario: price };
    });
    const { data: order, error: oErr } = await context.supabase.from("pedidos")
      .insert({
        cliente_nombre: data.cliente_nombre,
        telefono: data.telefono,
        notas: data.notas ?? null,
        total,
        estado: "en_espera",
      })
      .select()
      .single();
    if (oErr) throw new Error(oErr.message);
    await context.supabase.from("detalle_pedido").insert(
      lines.map((l) => ({ ...l, id_pedido: order.id_pedido })),
    );
    return order;
  });