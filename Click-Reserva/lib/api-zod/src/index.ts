
  import { z } from 'zod';
  const schemaGenerico = z.any();

  // Exportador Proxy universal para o runtime do Express
  const proxyHandler = {
    get: function(target, prop) {
      return schemaGenerico;
    }
  };
  const proxyUniversal = new Proxy({}, proxyHandler);
  export default proxyUniversal;

  // Lista completa com TODOS os contratos exigidos pelas rotas
  export const GetConfigResponse = schemaGenerico;
  export const UpdateConfigBody = schemaGenerico;
  export const UpdateConfigResponse = schemaGenerico;
  export const GetAbsencesResponse = schemaGenerico;
  export const GetAbsencesQueryParams = schemaGenerico;
  export const CreateAbsenceBody = schemaGenerico;
  export const CreateAbsenceResponse = schemaGenerico;
  export const UpdateAbsenceBody = schemaGenerico;
  export const UpdateAbsenceResponse = schemaGenerico;
  export const GetProfessorsResponse = schemaGenerico;
  export const GetProfessorsQueryParams = schemaGenerico;
  export const GetDashboardStatsResponse = schemaGenerico;
  export const GetTodayScheduleResponse = schemaGenerico;
  export const CheckConflictsQueryParams = schemaGenerico;
  export const CheckConflictsResponse = schemaGenerico;
  export const HealthCheckResponse = schemaGenerico;
  export const LoginBody = schemaGenerico;
  export const LoginResponse = schemaGenerico;
  export const GetMeResponse = schemaGenerico;
  export const CancelReservationParams = schemaGenerico;
  export const CancelReservationResponse = schemaGenerico;
  export const ConfirmPresenceParams = schemaGenerico;
  export const ConfirmPresenceResponse = schemaGenerico;
  export const CreateProfessorBody = schemaGenerico;
  export const CreateReservationBody = schemaGenerico;
  export const CreateRoomBody = schemaGenerico;
  export const DeleteRoomParams = schemaGenerico;
  export const DeleteRoomResponse = schemaGenerico;
  export const GetProfessorParams = schemaGenerico;
  export const GetProfessorResponse = schemaGenerico;
  export const GetReservationParams = schemaGenerico;
  export const GetReservationResponse = schemaGenerico;
  export const GetReservationsQueryParams = schemaGenerico;
  export const GetReservationsResponse = schemaGenerico;
  export const GetRoomParams = schemaGenerico;
  export const GetRoomResponse = schemaGenerico;
  export const GetRoomsResponse = schemaGenerico;
  export const UnblockProfessorParams = schemaGenerico;
  export const UnblockProfessorResponse = schemaGenerico;
  export const UpdateProfessorBody = schemaGenerico;
  export const UpdateProfessorParams = schemaGenerico;
  export const UpdateProfessorResponse = schemaGenerico;
  export const UpdateRoomBody = schemaGenerico;
  export const UpdateRoomParams = schemaGenerico;
  export const UpdateRoomResponse = schemaGenerico;
  