import { Badge, EmptyState, SectionHeader, Surface } from "@/components/ui-kit";
import { supportArticles } from "@/lib/data";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Ayuda y soporte"
        title="Documentacion operativa"
        description="Guias rapidas, preguntas frecuentes y contacto de soporte pensados para destrabar la operacion sin recargar la interfaz."
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Surface className="p-6">
          <p className="text-sm font-medium text-slate-50">Guias destacadas</p>
          <div className="mt-5 space-y-4">
            {supportArticles.map((article) => (
              <div key={article.title} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
                <Badge label="Guia rapida" tone="info" />
                <p className="mt-3 font-medium text-slate-100">{article.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{article.summary}</p>
              </div>
            ))}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="p-6">
            <p className="text-sm font-medium text-slate-50">Canales</p>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <p>Soporte operativo: soporte@idnight.demo</p>
              <p>Escalado critico: supervisor central 24/7</p>
              <p>Documentacion interna: base operativa ID-Night</p>
            </div>
          </Surface>
          <EmptyState
            title="No hay incidentes de soporte abiertos"
            description="Tambien quedan resueltos los estados vacios y de baja carga, para que el producto se vea completo y estable en presentacion."
          />
        </div>
      </div>
    </div>
  );
}
