import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetRooms, useCreateReservation, useCheckConflicts, useGetProfessors, getGetReservationsQueryKey, getCheckConflictsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, CalendarPlus, Clock, Sun, Sunset, Moon, Tablet } from "lucide-react"; // ← TABLET
import { cn } from "@/lib/utils";

const newReservationSchema = z.object({
  roomId: z.string().min(1, "Selecione uma sala"),
  date: z.string().min(1, "Informe a data"),
  startTime: z.string().min(1, "Informe o horário de início"),
  endTime: z.string().min(1, "Informe o horário de término"),
  subject: z.string().min(1, "Informe a disciplina"),
  classGroup: z.string().min(1, "Informe a turma"),
  professorId: z.string().optional(),
  tabletQuantity: z.number().int().min(0).max(30).default(0), // ← TABLET
});

type NewReservationForm = z.infer<typeof newReservationSchema>;

type SlotEntry = { label: string; start: string; end: string };

const SCHEDULES: Record<"A" | "B", { manha: SlotEntry[]; tarde: SlotEntry[]; noite:
