import { useGetRooms } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { MonitorPlay, Users, Wifi } from "lucide-react";

export function RoomsPage() {
  const { data: rooms, isLoading } = useGetRooms();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Salas de Informática e Laboratórios</h1>
        <p className="text-muted-foreground mt-1">Espaços disponíveis para agendamento.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(rooms ?? []).map(r => (
            <Card
              key={r.id}
              className={`transition-shadow hover:shadow-md ${!r.isActive ? "opacity-60" : ""}`}
              data-testid={`card-sala-${r.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wide">
                        {r.number}
                      </span>
                      {!r.isActive && (
                        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          Inativa
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mt-2">{r.name}</h3>
                  </div>
                  <MonitorPlay className="h-6 w-6 text-primary/40" />
                </div>

                {r.description && (
                  <p className="text-sm text-muted-foreground mb-4">{r.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MonitorPlay className="h-3.5 w-3.5" />
                    {r.computers} computadores
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {r.capacity} lugares
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
