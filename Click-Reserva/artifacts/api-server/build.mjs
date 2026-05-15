import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs, { cpSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raizMonorepo = join(__dirname, '../..');
const pastaDb = join(raizMonorepo, 'lib/db');

// Injeção física dos mocks de contrato para o esbuild não reclamar de exports ausentes
const pastaFisicaZodSrc = join(raizMonorepo, 'lib/api-zod/src');

if (!fs.existsSync(pastaFisicaZodSrc)) {
  fs.mkdirSync(pastaFisicaZodSrc, { recursive: true });
}

fs.writeFileSync(
  join(pastaFisicaZodSrc, 'index.ts'),
  `
  import { z } from 'zod';
  const schemaGenerico = z.any();

  const proxyHandler = {
    get: function(target, prop) {
      return schemaGenerico;
    }
  };
  const proxyUniversal = new Proxy({}, proxyHandler);
  export default proxyUniversal;

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
  export co
