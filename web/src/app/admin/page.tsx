import Link from "next/link";

export default function AdminPage() {
  return (
    <div>
      <h1>Panel de administración</h1>
      <ul>
        <li><Link href="/admin/categorias">Gestión de categorías</Link></li>
        <li><Link href="/admin/configuracion">Configuración de la plataforma</Link></li>
      </ul>
    </div>
  );
}