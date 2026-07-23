import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listEmployees, createEmployee, updateEmployee, deleteEmployee } from "@/lib/employees.functions";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/empleados")({
  component: AdminEmpleados,
});

type Emp = Awaited<ReturnType<typeof listEmployees>>[number];

function AdminEmpleados() {
  const list = useServerFn(listEmployees);
  const create = useServerFn(createEmployee);
  const update = useServerFn(updateEmployee);
  const del = useServerFn(deleteEmployee);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-employees"], queryFn: () => list() });
  const [editing, setEditing] = useState<Emp | null>(null);
  const [open, setOpen] = useState(false);

  const inv = () => qc.invalidateQueries({ queryKey: ["admin-employees"] });
  const mC = useMutation({ mutationFn: (d: Record<string, unknown>) => create({ data: d }), onSuccess: () => { inv(); setOpen(false); } });
  const mU = useMutation({ mutationFn: (d: Record<string, unknown>) => update({ data: d }), onSuccess: () => { inv(); setEditing(null); } });
  const mD = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: inv });
  const mToggle = useMutation({ mutationFn: (e: Emp) => update({ data: { id: e.id_empleado, activo: !e.activo } }), onSuccess: inv });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="display text-3xl">Empleados</h1>
          <p className="text-sm text-muted-foreground">Activos e inactivos.</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-md wine-bg px-4 py-2 text-xs uppercase tracking-widest">
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">Puesto</th><th className="px-3 py-2">Contacto</th><th className="px-3 py-2">Ingreso</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id_empleado} className="border-t border-border">
                <td className="px-3 py-2">{e.nombre}</td>
                <td className="px-3 py-2">{e.puesto}</td>
                <td className="px-3 py-2 text-xs">{e.telefono ?? "—"}<br/>{e.email ?? ""}</td>
                <td className="px-3 py-2">{e.fecha_contratacion}</td>
                <td className="px-3 py-2">
                  <button onClick={() => mToggle.mutate(e)} className={`rounded-full px-2 py-0.5 text-xs ${e.activo ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    {e.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing(e)} className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => { if (confirm(`¿Eliminar "${e.nombre}"?`)) mD.mutate(e.id_empleado); }} className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin empleados registrados.</td></tr>}
          </tbody>
        </table>
      </div>

      {(open || editing) && (
        <EmpForm
          initial={editing}
          onCancel={() => { setOpen(false); setEditing(null); }}
          onSubmit={(d) => editing ? mU.mutate({ id: editing.id_empleado, ...d }) : mC.mutate(d)}
          loading={mC.isPending || mU.isPending}
        />
      )}
    </div>
  );
}

function EmpForm({ initial, onCancel, onSubmit, loading }: {
  initial: Emp | null;
  onCancel: () => void;
  onSubmit: (d: { nombre: string; puesto: string; telefono: string; email: string; fecha_contratacion: string; activo: boolean }) => void;
  loading: boolean;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [puesto, setPuesto] = useState(initial?.puesto ?? "");
  const [telefono, setTelefono] = useState(initial?.telefono ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [fecha, setFecha] = useState(initial?.fecha_contratacion ?? new Date().toISOString().slice(0, 10));
  const [activo, setActivo] = useState(initial?.activo ?? true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSubmit({ nombre, puesto, telefono, email, fecha_contratacion: fecha, activo }); }} className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-6">
        <h2 className="display text-2xl">{initial ? "Editar" : "Nuevo"} empleado</h2>
        <input required placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input required placeholder="Puesto" value={puesto} onChange={(e) => setPuesto(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Activo</label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-xs uppercase tracking-widest">Cancelar</button>
          <button type="submit" disabled={loading} className="rounded-md wine-bg px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-50">Guardar</button>
        </div>
      </form>
    </div>
  );
}