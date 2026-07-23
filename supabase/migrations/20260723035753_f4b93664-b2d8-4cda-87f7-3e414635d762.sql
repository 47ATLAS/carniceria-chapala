
-- Enum para estado de pedidos
CREATE TYPE public.estado_pedido AS ENUM ('en_espera', 'listo_para_recoger', 'entregado', 'cancelado');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Productos
CREATE TABLE public.productos (
  id_producto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'res',
  imagen_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.productos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO authenticated;
GRANT ALL ON public.productos TO service_role;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Pedidos
CREATE TABLE public.pedidos (
  id_pedido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  cliente_nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  estado public.estado_pedido NOT NULL DEFAULT 'en_espera',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pedidos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Detalle pedido
CREATE TABLE public.detalle_pedido (
  id_detalle UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pedido UUID NOT NULL REFERENCES public.pedidos(id_pedido) ON DELETE CASCADE,
  id_producto UUID NOT NULL REFERENCES public.productos(id_producto),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.detalle_pedido TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detalle_pedido TO authenticated;
GRANT ALL ON public.detalle_pedido TO service_role;
ALTER TABLE public.detalle_pedido ENABLE ROW LEVEL SECURITY;

-- Empleados
CREATE TABLE public.empleados (
  id_empleado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  puesto TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  fecha_contratacion DATE NOT NULL DEFAULT CURRENT_DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empleados TO authenticated;
GRANT ALL ON public.empleados TO service_role;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

-- Chat messages (session based)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO anon;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_empleados_updated BEFORE UPDATE ON public.empleados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Policies
-- productos: público lee, admin escribe
CREATE POLICY "productos_public_read" ON public.productos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "productos_admin_write" ON public.productos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- pedidos: cualquiera crea, admin lee/gestiona
CREATE POLICY "pedidos_public_insert" ON public.pedidos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "pedidos_admin_all" ON public.pedidos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- detalle: cualquiera inserta, admin gestiona
CREATE POLICY "detalle_public_insert" ON public.detalle_pedido FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "detalle_admin_all" ON public.detalle_pedido FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- empleados: admin only
CREATE POLICY "empleados_admin_all" ON public.empleados FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- chat: cualquiera lee/escribe su session
CREATE POLICY "chat_public_all" ON public.chat_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- user_roles: usuario lee lo suyo
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Seed productos
INSERT INTO public.productos (nombre, descripcion, precio, stock, categoria) VALUES
('Arrachera Premium', 'Corte marinado de diafragma, jugoso y con carácter.', 289.00, 25, 'res'),
('Ribeye Angus', 'Corte grueso con marmoleo excepcional.', 620.00, 12, 'res'),
('Filete de Res', 'El corte más suave, para ocasiones especiales.', 540.00, 8, 'res'),
('Costilla de Res', 'Ideal para asar lento, sabor profundo.', 320.00, 18, 'res'),
('T-Bone', 'Dos cortes en uno: lomo y filete.', 480.00, 10, 'res'),
('Pierna de Cerdo', 'Fresca, ideal para pastor o al horno.', 165.00, 30, 'cerdo'),
('Chuleta Ahumada', 'Ahumada en casa con leña de mezquite.', 210.00, 22, 'cerdo'),
('Costilla de Cerdo', 'Para BBQ o cocción lenta.', 195.00, 20, 'cerdo'),
('Pollo Entero', 'Pollo de rancho, criado sin hormonas.', 145.00, 40, 'pollo'),
('Pechuga sin Hueso', 'Limpia, fileteada al gusto.', 175.00, 35, 'pollo'),
('Chorizo Artesanal', 'Receta de la casa, especias frescas.', 130.00, 45, 'embutidos'),
('Longaniza Roja', 'Ahumada, perfecta para el desayuno.', 140.00, 38, 'embutidos');
