import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/SiteLayout";
import { listProducts } from "@/lib/products.functions";
import { createPublicOrder } from "@/lib/orders.functions";
import { Minus, Plus, Check } from "lucide-react";

const productsQO = queryOptions({ queryKey: ["products"], queryFn: () => listProducts() });

export const Route = createFileRoute("/pedido")({
  head: () => ({
    meta: [
      { title: "Aparta tu pedido — Carnicería Chapala" },
      { name: "description", content: "Selecciona tus cortes y apartalos para recoger en tienda. Sin pago en línea." },
      { property: "og:title", content: "Aparta tu pedido — Carnicería Chapala" },
      { property: "og:description", content: "Aparta tus cortes en línea, paga y recoge en tienda." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  component: Pedido,
});

function Pedido() {
  const { data: products } = useSuspenseQuery(productsQO);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const create = useServerFn(createPublicOrder);
  const mut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => create({ data: payload }),
    onSuccess: (r) => { setConfirmedId(r.id_pedido); setCart({}); setNombre(""); setTelefono(""); setNotas(""); },
  });

  const items = useMemo(() =>
    Object.entries(cart).map(([id, qty]) => {
      const p = products.find((x) => x.id_producto === id)!;
      return { p, qty };
    }).filter((i) => i.p), [cart, products]);
  const total = items.reduce((s, i) => s + Number(i.p.precio) * i.qty, 0);

  function set(id: string, delta: number, max: number) {
    setCart((c) => {
      const cur = c[id] ?? 0;
      const next = Math.max(0, Math.min(max, cur + delta));
      const copy = { ...c };
      if (next === 0) delete copy[id]; else copy[id] = next;
      return copy;
    });
  }

  if (confirmedId) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-2xl px-6 py-32 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full wine-bg">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="display mt-6 text-5xl">Pedido apartado</h1>
          <p className="mt-4 text-muted-foreground">
            Te esperamos en tienda para recogerlo. Tu folio: <span className="font-mono text-foreground">{confirmedId.slice(0, 8)}</span>
          </p>
          <button onClick={() => setConfirmedId(null)} className="mt-8 rounded-md border border-border px-6 py-2 text-sm uppercase tracking-widest hover:border-accent">
            Hacer otro pedido
          </button>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-accent">Apartado</p>
        <h1 className="display text-5xl md:text-7xl">Arma tu pedido</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">Selecciona cortes y cantidades. Guardamos tu pedido y lo recoges en tienda — sin pago en línea.</p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            {products.filter((p) => p.stock > 0).map((p) => {
              const qty = cart[p.id_producto] ?? 0;
              return (
                <div key={p.id_producto} className="flex items-center justify-between border-b border-border/60 py-4">
                  <div>
                    <h3 className="display text-xl">{p.nombre}</h3>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.categoria} · ${Number(p.precio).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => set(p.id_producto, -1, p.stock)} className="flex h-8 w-8 items-center justify-center rounded-full border border-border disabled:opacity-30" disabled={qty === 0}>
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="w-8 text-center text-sm">{qty}</div>
                    <button onClick={() => set(p.id_producto, 1, p.stock)} className="flex h-8 w-8 items-center justify-center rounded-full border border-border disabled:opacity-30" disabled={qty >= p.stock}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="rounded-lg border border-border bg-card p-6">
            <h2 className="display text-2xl">Tu pedido</h2>
            {items.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Aún no has agregado nada.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {items.map((i) => (
                  <li key={i.p.id_producto} className="flex justify-between">
                    <span>{i.p.nombre} × {i.qty}</span>
                    <span>${(Number(i.p.precio) * i.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base">
              <span className="uppercase tracking-widest text-muted-foreground">Total</span>
              <span className="display text-2xl text-accent">${total.toFixed(2)}</span>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (items.length === 0) return;
              mut.mutate({
                cliente_nombre: nombre,
                telefono,
                notas: notas || null,
                items: items.map((i) => ({ id_producto: i.p.id_producto, cantidad: i.qty })),
              });
            }} className="mt-6 space-y-3">
              <input required placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input required placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea placeholder="Notas (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button type="submit" disabled={items.length === 0 || mut.isPending || !nombre || !telefono} className="btn-shine glow-pulse w-full rounded-md wine-bg px-4 py-3 text-sm uppercase tracking-widest disabled:opacity-50 disabled:glow-none">
                {mut.isPending ? "Enviando…" : "Apartar pedido"}
              </button>
              {mut.error && <p className="text-xs text-destructive">{(mut.error as Error).message}</p>}
            </form>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}