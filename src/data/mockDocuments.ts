export type DocStatus = 'Borrador' | 'En revisión' | 'Aprobado' | 'Archivado' | 'Rechazado'
export type ProcessCategory = 'Contratos' | 'RRHH' | 'Finanzas' | 'Legal' | 'Operaciones' | 'Calidad'

export interface MockDocument {
  id: string
  title: string
  description: string
  author: string
  createdAt: string
  updatedAt: string
  status: DocStatus
  processName: string
  category: ProcessCategory
  version: string
  tags: string[]
}

export interface ProcessSummary {
  name: string
  displayName: string
  description: string
  documentCount: number
  category: ProcessCategory
}

export const mockDocuments: MockDocument[] = [
  { id: 'DOC-001', title: 'Contrato Marco Servicios IT 2024', description: 'Acuerdo marco para provisión de servicios de tecnología.', author: 'Ana García', createdAt: '2024-01-15', updatedAt: '2024-02-20', status: 'Aprobado', processName: 'contratos-it', category: 'Contratos', version: '2.1', tags: ['IT', 'Marco', 'Servicios'] },
  { id: 'DOC-002', title: 'Política de Teletrabajo', description: 'Normativa interna sobre trabajo remoto y equipamiento.', author: 'Luis Martínez', createdAt: '2024-01-22', updatedAt: '2024-03-01', status: 'Aprobado', processName: 'politicas-rrhh', category: 'RRHH', version: '1.0', tags: ['RRHH', 'Teletrabajo'] },
  { id: 'DOC-003', title: 'Presupuesto Anual 2024', description: 'Presupuesto consolidado y desglose por áreas.', author: 'María López', createdAt: '2023-12-10', updatedAt: '2024-01-05', status: 'Aprobado', processName: 'presupuesto', category: 'Finanzas', version: '3.0', tags: ['Finanzas', 'Presupuesto'] },
  { id: 'DOC-004', title: 'Acta Junta General 2023', description: 'Acta de la junta general de accionistas del ejercicio 2023.', author: 'Carlos Ruiz', createdAt: '2024-02-01', updatedAt: '2024-02-01', status: 'Archivado', processName: 'juntas', category: 'Legal', version: '1.0', tags: ['Legal', 'Junta'] },
  { id: 'DOC-005', title: 'Procedimiento Gestión de Incidencias', description: 'Procedimiento operativo para registro y cierre de incidencias.', author: 'Elena Sánchez', createdAt: '2024-01-08', updatedAt: '2024-02-15', status: 'En revisión', processName: 'incidencias', category: 'Operaciones', version: '1.2', tags: ['Operaciones', 'Incidencias'] },
  { id: 'DOC-006', title: 'Manual de Calidad ISO 9001', description: 'Manual del sistema de gestión de la calidad.', author: 'Pedro Fernández', createdAt: '2023-11-20', updatedAt: '2024-02-28', status: 'Aprobado', processName: 'calidad-iso', category: 'Calidad', version: '4.0', tags: ['Calidad', 'ISO'] },
  { id: 'DOC-007', title: 'NDA Cliente Alpha Corp', description: 'Acuerdo de confidencialidad con Alpha Corp.', author: 'Ana García', createdAt: '2024-02-10', updatedAt: '2024-02-12', status: 'Aprobado', processName: 'contratos-it', category: 'Contratos', version: '1.0', tags: ['NDA', 'Cliente'] },
  { id: 'DOC-008', title: 'Evaluación Desempeño Q1 2024', description: 'Plantilla y criterios de evaluación de desempeño.', author: 'Luis Martínez', createdAt: '2024-03-01', updatedAt: '2024-03-01', status: 'Borrador', processName: 'politicas-rrhh', category: 'RRHH', version: '0.9', tags: ['RRHH', 'Evaluación'] },
  { id: 'DOC-009', title: 'Informe Auditoría Interna', description: 'Informe de auditoría interna del primer trimestre.', author: 'María López', createdAt: '2024-03-05', updatedAt: '2024-03-05', status: 'En revisión', processName: 'auditoria', category: 'Finanzas', version: '1.0', tags: ['Auditoría', 'Finanzas'] },
  { id: 'DOC-010', title: 'Estatutos Sociales', description: 'Estatutos de la sociedad vigentes.', author: 'Carlos Ruiz', createdAt: '2022-06-01', updatedAt: '2023-09-15', status: 'Aprobado', processName: 'legal-corporativo', category: 'Legal', version: '2.0', tags: ['Legal', 'Estatutos'] },
  { id: 'DOC-011', title: 'SLA Proveedor Cloud', description: 'Acuerdo de nivel de servicio con proveedor cloud.', author: 'Ana García', createdAt: '2024-01-30', updatedAt: '2024-02-01', status: 'Aprobado', processName: 'contratos-it', category: 'Contratos', version: '1.0', tags: ['SLA', 'Cloud'] },
  { id: 'DOC-012', title: 'Código de Conducta', description: 'Código de conducta y ética empresarial.', author: 'Luis Martínez', createdAt: '2023-10-01', updatedAt: '2024-01-10', status: 'Aprobado', processName: 'politicas-rrhh', category: 'RRHH', version: '1.1', tags: ['RRHH', 'Ética'] },
  { id: 'DOC-013', title: 'Flujo de Caja Proyectado', description: 'Proyección de flujo de caja para el ejercicio.', author: 'María López', createdAt: '2024-02-15', updatedAt: '2024-02-20', status: 'Aprobado', processName: 'presupuesto', category: 'Finanzas', version: '1.0', tags: ['Finanzas', 'Cash flow'] },
  { id: 'DOC-014', title: 'Dictamen Legal Fusion', description: 'Dictamen jurídico sobre operación de fusión.', author: 'Carlos Ruiz', createdAt: '2024-02-28', updatedAt: '2024-03-02', status: 'En revisión', processName: 'legal-corporativo', category: 'Legal', version: '0.8', tags: ['Legal', 'Fusión'] },
  { id: 'DOC-015', title: 'Checklist Despliegue', description: 'Checklist para despliegues en producción.', author: 'Elena Sánchez', createdAt: '2024-01-12', updatedAt: '2024-02-22', status: 'Aprobado', processName: 'incidencias', category: 'Operaciones', version: '2.0', tags: ['Operaciones', 'Despliegue'] },
  { id: 'DOC-016', title: 'Certificado ISO 9001:2015', description: 'Certificado de conformidad ISO 9001.', author: 'Pedro Fernández', createdAt: '2023-07-01', updatedAt: '2023-07-01', status: 'Archivado', processName: 'calidad-iso', category: 'Calidad', version: '1.0', tags: ['Calidad', 'Certificado'] },
  { id: 'DOC-017', title: 'Orden de Compra #4521', description: 'Orden de compra equipamiento informático.', author: 'Ana García', createdAt: '2024-02-25', updatedAt: '2024-02-26', status: 'Aprobado', processName: 'contratos-it', category: 'Contratos', version: '1.0', tags: ['Compra', 'IT'] },
  { id: 'DOC-018', title: 'Plan de Formación 2024', description: 'Plan anual de formación para empleados.', author: 'Luis Martínez', createdAt: '2024-01-18', updatedAt: '2024-02-28', status: 'Aprobado', processName: 'politicas-rrhh', category: 'RRHH', version: '1.0', tags: ['RRHH', 'Formación'] },
  { id: 'DOC-019', title: 'Informe Trimestral Resultados', description: 'Resumen de resultados financieros Q4 2023.', author: 'María López', createdAt: '2024-01-30', updatedAt: '2024-01-30', status: 'Archivado', processName: 'presupuesto', category: 'Finanzas', version: '1.0', tags: ['Finanzas', 'Resultados'] },
  { id: 'DOC-020', title: 'Contrato Arrendamiento Sede', description: 'Contrato de arrendamiento de la sede principal.', author: 'Carlos Ruiz', createdAt: '2023-05-10', updatedAt: '2024-01-15', status: 'Aprobado', processName: 'legal-corporativo', category: 'Legal', version: '1.0', tags: ['Legal', 'Arrendamiento'] },
  { id: 'DOC-021', title: 'Runbook Servidor App', description: 'Procedimiento de operación del servidor de aplicaciones.', author: 'Elena Sánchez', createdAt: '2024-02-01', updatedAt: '2024-02-18', status: 'Aprobado', processName: 'incidencias', category: 'Operaciones', version: '1.5', tags: ['Operaciones', 'Runbook'] },
  { id: 'DOC-022', title: 'No Conformidades 2024', description: 'Registro de no conformidades y acciones correctivas.', author: 'Pedro Fernández', createdAt: '2024-01-01', updatedAt: '2024-03-04', status: 'En revisión', processName: 'calidad-iso', category: 'Calidad', version: '0.5', tags: ['Calidad', 'NC'] },
  { id: 'DOC-023', title: 'Renovación Licencias Software', description: 'Documentación renovación licencias anuales.', author: 'Ana García', createdAt: '2024-03-01', updatedAt: '2024-03-01', status: 'Borrador', processName: 'contratos-it', category: 'Contratos', version: '0.7', tags: ['Licencias', 'IT'] },
  { id: 'DOC-024', title: 'Reglamento Interno', description: 'Reglamento de régimen interno de trabajo.', author: 'Luis Martínez', createdAt: '2023-08-15', updatedAt: '2024-02-01', status: 'Aprobado', processName: 'politicas-rrhh', category: 'RRHH', version: '2.0', tags: ['RRHH', 'Reglamento'] },
  { id: 'DOC-025', title: 'Política de Gastos', description: 'Política de gastos y dietas de viaje.', author: 'María López', createdAt: '2024-01-10', updatedAt: '2024-01-25', status: 'Aprobado', processName: 'presupuesto', category: 'Finanzas', version: '1.2', tags: ['Finanzas', 'Gastos'] },
  { id: 'DOC-026', title: 'Compliance RGPD', description: 'Evaluación de cumplimiento normativo RGPD.', author: 'Carlos Ruiz', createdAt: '2024-02-20', updatedAt: '2024-02-25', status: 'En revisión', processName: 'legal-corporativo', category: 'Legal', version: '1.0', tags: ['Legal', 'RGPD'] },
  { id: 'DOC-027', title: 'Escalado Incidencias Críticas', description: 'Procedimiento de escalado para incidencias P1.', author: 'Elena Sánchez', createdAt: '2024-01-05', updatedAt: '2024-02-10', status: 'Aprobado', processName: 'incidencias', category: 'Operaciones', version: '1.0', tags: ['Operaciones', 'Escalado'] },
  { id: 'DOC-028', title: 'Auditoría Interna Calidad', description: 'Informe auditoría interna sistema calidad.', author: 'Pedro Fernández', createdAt: '2024-02-15', updatedAt: '2024-02-28', status: 'Aprobado', processName: 'calidad-iso', category: 'Calidad', version: '1.0', tags: ['Calidad', 'Auditoría'] },
  { id: 'DOC-029', title: 'Addendum Contrato Mantenimiento', description: 'Addendum al contrato de mantenimiento hardware.', author: 'Ana García', createdAt: '2024-02-18', updatedAt: '2024-02-19', status: 'Aprobado', processName: 'contratos-it', category: 'Contratos', version: '1.0', tags: ['Contrato', 'Mantenimiento'] },
  { id: 'DOC-030', title: 'Onboarding Nuevos Empleados', description: 'Proceso de incorporación y onboarding.', author: 'Luis Martínez', createdAt: '2024-01-25', updatedAt: '2024-02-05', status: 'Aprobado', processName: 'politicas-rrhh', category: 'RRHH', version: '1.1', tags: ['RRHH', 'Onboarding'] },
  { id: 'DOC-031', title: 'Previsión Tesorería Marzo', description: 'Previsión de tesorería para marzo 2024.', author: 'María López', createdAt: '2024-02-28', updatedAt: '2024-02-28', status: 'Aprobado', processName: 'presupuesto', category: 'Finanzas', version: '1.0', tags: ['Finanzas', 'Tesorería'] },
  { id: 'DOC-032', title: 'Poder Notarial Representación', description: 'Poder notarial para representación legal.', author: 'Carlos Ruiz', createdAt: '2024-01-20', updatedAt: '2024-01-20', status: 'Archivado', processName: 'legal-corporativo', category: 'Legal', version: '1.0', tags: ['Legal', 'Poder'] },
  { id: 'DOC-033', title: 'Backup y Recuperación', description: 'Procedimiento de backup y recuperación ante desastres.', author: 'Elena Sánchez', createdAt: '2024-02-05', updatedAt: '2024-02-25', status: 'Aprobado', processName: 'incidencias', category: 'Operaciones', version: '2.0', tags: ['Operaciones', 'Backup'] },
  { id: 'DOC-034', title: 'Indicadores Calidad KPI', description: 'Definición de indicadores de calidad y metas.', author: 'Pedro Fernández', createdAt: '2024-01-15', updatedAt: '2024-02-01', status: 'Aprobado', processName: 'calidad-iso', category: 'Calidad', version: '1.0', tags: ['Calidad', 'KPI'] },
  { id: 'DOC-035', title: 'RFP Servicios de Seguridad', description: 'Pliego de condiciones para servicios de ciberseguridad.', author: 'Ana García', createdAt: '2024-03-02', updatedAt: '2024-03-03', status: 'Borrador', processName: 'contratos-it', category: 'Contratos', version: '0.5', tags: ['RFP', 'Seguridad'] },
  { id: 'DOC-036', title: 'Política de Vacaciones', description: 'Normativa de solicitud y disfrute de vacaciones.', author: 'Luis Martínez', createdAt: '2023-12-01', updatedAt: '2024-01-15', status: 'Aprobado', processName: 'politicas-rrhh', category: 'RRHH', version: '1.0', tags: ['RRHH', 'Vacaciones'] },
  { id: 'DOC-037', title: 'Cierre Contable Febrero', description: 'Documentación de cierre contable mensual.', author: 'María López', createdAt: '2024-03-05', updatedAt: '2024-03-05', status: 'En revisión', processName: 'presupuesto', category: 'Finanzas', version: '1.0', tags: ['Finanzas', 'Cierre'] },
  { id: 'DOC-038', title: 'Reclamación Cliente Beta', description: 'Expediente de reclamación y respuesta legal.', author: 'Carlos Ruiz', createdAt: '2024-02-22', updatedAt: '2024-03-01', status: 'En revisión', processName: 'legal-corporativo', category: 'Legal', version: '0.9', tags: ['Legal', 'Reclamación'] },
  { id: 'DOC-039', title: 'Cambio Horario Mantenimiento', description: 'Comunicado ventana de mantenimiento programado.', author: 'Elena Sánchez', createdAt: '2024-03-04', updatedAt: '2024-03-04', status: 'Aprobado', processName: 'incidencias', category: 'Operaciones', version: '1.0', tags: ['Operaciones', 'Mantenimiento'] },
  { id: 'DOC-040', title: 'Revisión Anual Sistema Calidad', description: 'Informe de revisión por la dirección del SGC.', author: 'Pedro Fernández', createdAt: '2024-02-28', updatedAt: '2024-03-02', status: 'Rechazado', processName: 'calidad-iso', category: 'Calidad', version: '0.8', tags: ['Calidad', 'Revisión'] },
  { id: 'DOC-041', title: 'Contrato Consultoría Proyecto X', description: 'Contrato de consultoría para proyecto estratégico.', author: 'Ana García', createdAt: '2024-02-05', updatedAt: '2024-02-15', status: 'Aprobado', processName: 'contratos-it', category: 'Contratos', version: '1.0', tags: ['Consultoría', 'Proyecto'] },
  { id: 'DOC-042', title: 'Encuesta Clima Laboral 2024', description: 'Resultados encuesta de clima laboral.', author: 'Luis Martínez', createdAt: '2024-02-20', updatedAt: '2024-03-01', status: 'En revisión', processName: 'politicas-rrhh', category: 'RRHH', version: '1.0', tags: ['RRHH', 'Clima'] },
  { id: 'DOC-043', title: 'Análisis Desviaciones Presupuesto', description: 'Análisis de desviaciones respecto a presupuesto.', author: 'María López', createdAt: '2024-02-25', updatedAt: '2024-02-28', status: 'Aprobado', processName: 'presupuesto', category: 'Finanzas', version: '1.0', tags: ['Finanzas', 'Desviaciones'] },
  { id: 'DOC-044', title: 'Convenio Colectivo Aplicable', description: 'Resumen convenio colectivo sector.', author: 'Carlos Ruiz', createdAt: '2023-01-01', updatedAt: '2024-01-10', status: 'Aprobado', processName: 'legal-corporativo', category: 'Legal', version: '1.0', tags: ['Legal', 'Convenio'] },
  { id: 'DOC-045', title: 'SOP Monitoreo 24/7', description: 'Procedimiento estándar monitoreo de sistemas.', author: 'Elena Sánchez', createdAt: '2024-01-20', updatedAt: '2024-02-12', status: 'Aprobado', processName: 'incidencias', category: 'Operaciones', version: '1.2', tags: ['Operaciones', 'SOP'] },
  { id: 'DOC-046', title: 'Formación Auditoría Interna', description: 'Material de formación para auditores internos.', author: 'Pedro Fernández', createdAt: '2024-02-10', updatedAt: '2024-02-20', status: 'Aprobado', processName: 'calidad-iso', category: 'Calidad', version: '1.0', tags: ['Calidad', 'Formación'] },
  { id: 'DOC-047', title: 'Condiciones Comerciales Partner', description: 'Condiciones generales con partner tecnológico.', author: 'Ana García', createdAt: '2024-01-28', updatedAt: '2024-02-02', status: 'Aprobado', processName: 'contratos-it', category: 'Contratos', version: '1.0', tags: ['Comercial', 'Partner'] },
  { id: 'DOC-048', title: 'Protocolo Prevención Acoso', description: 'Protocolo de prevención y actuación acoso.', author: 'Luis Martínez', createdAt: '2024-02-15', updatedAt: '2024-02-25', status: 'Aprobado', processName: 'politicas-rrhh', category: 'RRHH', version: '1.0', tags: ['RRHH', 'Prevención'] },
  { id: 'DOC-049', title: 'Informe Inversiones Q1', description: 'Informe de inversiones realizadas en el trimestre.', author: 'María López', createdAt: '2024-03-01', updatedAt: '2024-03-03', status: 'Borrador', processName: 'presupuesto', category: 'Finanzas', version: '0.9', tags: ['Finanzas', 'Inversiones'] },
  { id: 'DOC-050', title: 'Resumen Cumplimiento Normativo', description: 'Resumen anual de cumplimiento normativo.', author: 'Carlos Ruiz', createdAt: '2024-02-28', updatedAt: '2024-03-02', status: 'En revisión', processName: 'legal-corporativo', category: 'Legal', version: '1.0', tags: ['Legal', 'Cumplimiento'] },
]

const processNames = [...new Set(mockDocuments.map(d => d.processName))]

export const processes: ProcessSummary[] = processNames.map(name => {
  const docs = mockDocuments.filter(d => d.processName === name)
  const first = docs[0]
  const displayNames: Record<string, string> = {
    'contratos-it': 'Contratos IT',
    'politicas-rrhh': 'Políticas RRHH',
    'presupuesto': 'Presupuesto y Finanzas',
    'juntas': 'Juntas y Actas',
    'incidencias': 'Gestión de Incidencias',
    'calidad-iso': 'Calidad ISO',
    'auditoria': 'Auditoría Interna',
    'legal-corporativo': 'Legal Corporativo',
  }
  return {
    name,
    displayName: displayNames[name] ?? name,
    description: `Proceso de ${displayNames[name] ?? name}. ${docs.length} documento(s).`,
    documentCount: docs.length,
    category: first?.category ?? 'Operaciones',
  }
})

export function getDocumentById(id: string): MockDocument | undefined {
  return mockDocuments.find(d => d.id === id)
}

export function getDocumentsByProcess(processName: string): MockDocument[] {
  return mockDocuments.filter(d => d.processName === processName)
}

export function searchDocuments(query: string): MockDocument[] {
  const q = query.toLowerCase().trim()
  if (!q) return mockDocuments
  return mockDocuments.filter(
    d =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.author.toLowerCase().includes(q) ||
      d.tags.some(t => t.toLowerCase().includes(q)) ||
      d.id.toLowerCase().includes(q)
  )
}
