import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listOrders, updateOrderStatus, deleteOrder, createManualOrder } from "@/lib/orders.functions";
import { listProducts } from "@/lib/products.functions";
import { Trash2, Plus, Minus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: AdminPedidos,
});

const ESTADOS = ["en_espera", "listo_para_recoger", "entregado", "cancelado"] as const;
const ESTADO_LABEL: Record<typeof ESTADOS[number], string> = {
  en_espera: "En espera",
  listo_para_recoger: "Listo para recoger",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function AdminPedidos() {
  const list = useServerFn(listOrders);
  const upd = useServerFn(updateOrderStatus);
  const del = useServerFn(deleteOrder);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-orders"], queryFn: () => list() });
  const [filter, setFilter] = useState<string>("todos");
  const [manual, setManual] = useState(false);

  const mUpd = useMutation({
    mutationFn: (v: { id: string; estado: typeof ESTADOS[number] }) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });
  const mDel = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const filtered = filter === "todos" ? data : data.filter((o) => o.estado === filter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="display text-3xl">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Gestiona el flujo desde en-espera hasta entregado.</p>
        </div>
        <button onClick={() => setManual(true)} className="flex items-center gap-2 rounded-md wine-bg px-4 py-2 text-xs uppercase tracking-widest">
          <Plus className="h-4 w-4" /> Pedido manual
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["todos", ...ESTADOS].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full border px-3 py-1 text-xs uppercase tracking-widest ${filter === s ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>
            {s === "todos" ? "Todos" : ESTADO_LABEL[s as typeof ESTADOS[number]]}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((o) => (
          <div key={o.id_pedido} className="rounded-md border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="display text-lg">{o.cliente_nombre}</div>
                <div className="text-xs text-muted-foreground">{o.telefono} · {new Date(o.fecha).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="display text-xl text-accent">${Number(o.total).toFixed(2)}</div>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {o.detalle_pedido?.map((d: { id_detalle: string; cantidad: number; productos?: { nombre: string } | null }) => (
                <li key={d.id_detalle}>{d.cantidad} × {d.productos?.nombre ?? "Producto"}</li>
              ))}
            </ul>
            {o.notas && <p className="mt-2 text-xs italic text-muted-foreground">"{o.notas}"</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select value={o.estado} onChange={(e) => mUpd.mutate({ id: o.id_pedido, estado: e.target.value as typeof ESTADOS[number] })} className="rounded-md border border-input bg-background px-2 py-1 text-xs">
                {ESTADOS.map((s) => <option key={s} value={s}>{ESTADO_LABEL[s]}</option>)}
              </select>
              <button onClick={() => { if (confirm("¿Eliminar pedido?")) mDel.mutate(o.id_pedido); }} className="ml-auto text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Sin pedidos.</div>}
      </div>

      {manual && <ManualOrderForm onClose={() => setManual(false)} />}
    </div>
  );
}

function ManualOrderForm({ onClose }: { onClose: () => void }) {
  const products = useServerFn(listProducts);
  const create = useServerFn(createManualOrder);
  const qc = useQueryClient();
  const { data: prods = [] } = useQuery({ queryKey: ["admin-products-for-order"], queryFn: () => products() });
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const mut = useMutation({
    mutationFn: (d: Record<string, unknown>) => create({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); onClose(); },
  });
  function bump(id: string, delta: number, max: number) {
    setCart((c) => {
      const next = Math.max(0, Math.min(max, (c[id] ?? 0) + delta));
      const copy = { ...c }; if (next === 0) delete copy[id]; else copy[id] = next; return copy;
    });
  }
  const items = Object.entries(cart).map(([id, qty]) => ({ id_producto: id, cantidad: qty }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); mut.mutate({ cliente_nombre: nombre, telefono, items }); }} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6 space-y-3">
        <h2 className="display text-2xl">Pedido manual</h2>
        <div className="grid grid-cols-2 gap-2">
          <input required placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input required placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {prods.map((p) => {
            const qty = cart[p.id_producto] ?? 0;
            return (
              <div key={p.id_producto} className="flex items-center justify-between border-b border-border/60 py-2 text-sm">
                <div><div>{p.nombre}</div><div className="text-xs text-muted-foreground">${Number(p.precio).toFixed(2)} · stock {p.stock}</div></div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => bump(p.id_producto, -1, p.stock)} className="flex h-7 w-7 items-center justify-center rounded-full border"><Minus className="h-3 w-3" /></button>
                  <span className="w-6 text-center">{qty}</span>
                  <button type="button" onClick={() => bump(p.id_producto, 1, p.stock)} className="flex h-7 w-7 items-center justify-center rounded-full border"><Plus className="h-3 w-3" /></button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-xs uppercase tracking-widest">Cancelar</button>
          <button type="submit" disabled={items.length === 0 || mut.isPending} className="rounded-md wine-bg px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-50">Guardar</button>
        </div>
      </form>
    </div>
  );
}