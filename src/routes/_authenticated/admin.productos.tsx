import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listProducts, createProduct, updateProduct, deleteProduct } from "@/lib/products.functions";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/productos")({
  component: AdminProductos,
});

type Product = Awaited<ReturnType<typeof listProducts>>[number];

function AdminProductos() {
  const list = useServerFn(listProducts);
  const create = useServerFn(createProduct);
  const update = useServerFn(updateProduct);
  const del = useServerFn(deleteProduct);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-products"], queryFn: () => list() });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = data.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()));

  const mCreate = useMutation({
    mutationFn: (d: Record<string, unknown>) => create({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); setOpen(false); toast.success("Producto creado"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const mUpdate = useMutation({
    mutationFn: (d: Record<string, unknown>) => update({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); setEditing(null); toast.success("Producto actualizado"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const mDelete = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Producto eliminado"); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="display text-3xl">Productos</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu catálogo.</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-md wine-bg px-4 py-2 text-xs uppercase tracking-widest">
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>
      <input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm" />
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">Categoría</th><th className="px-3 py-2">Precio</th><th className="px-3 py-2">Stock</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id_producto} className="border-t border-border">
                <td className="px-3 py-2">{p.nombre}</td>
                <td className="px-3 py-2 capitalize">{p.categoria}</td>
                <td className="px-3 py-2">${Number(p.precio).toFixed(2)}</td>
                <td className="px-3 py-2">{p.stock}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing(p)} className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => { if (confirm(`¿Eliminar "${p.nombre}"?`)) mDelete.mutate(p.id_producto); }} className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(open || editing) && (
        <ProductForm
          initial={editing}
          onCancel={() => { setOpen(false); setEditing(null); }}
          onSubmit={(d) => editing ? mUpdate.mutate({ id: editing.id_producto, ...d }) : mCreate.mutate(d)}
          loading={mCreate.isPending || mUpdate.isPending}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, onCancel, onSubmit, loading }: {
  initial: Product | null;
  onCancel: () => void;
  onSubmit: (d: { nombre: string; descripcion: string; precio: number; stock: number; categoria: string }) => void;
  loading: boolean;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [precio, setPrecio] = useState(String(initial?.precio ?? ""));
  const [stock, setStock] = useState(String(initial?.stock ?? ""));
  const [categoria, setCategoria] = useState(initial?.categoria ?? "res");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSubmit({ nombre, descripcion, precio: Number(precio), stock: Number(stock), categoria }); }} className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-3">
        <h2 className="display text-2xl">{initial ? "Editar" : "Nuevo"} producto</h2>
        <input required placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <textarea placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input required type="number" step="0.01" placeholder="Precio" value={precio} onChange={(e) => setPrecio(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input required type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="res">Res</option><option value="cerdo">Cerdo</option><option value="pollo">Pollo</option><option value="embutidos">Embutidos</option>
        </select>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-xs uppercase tracking-widest">Cancelar</button>
          <button type="submit" disabled={loading} className="rounded-md wine-bg px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-50">Guardar</button>
        </div>
      </form>
    </div>
  );
}