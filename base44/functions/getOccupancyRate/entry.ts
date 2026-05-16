import { createClientFromRequest } from "npm:@base44/sdk@0.7.1";
import { eachDayOfInterval, format } from "npm:date-fns@3.6.0";

/**
 * @description Calcula a taxa de ocupação real do usuário baseada nas horas de trabalho configuradas
 *              e nos agendamentos concluídos no período especificado.
 * @param {string} startDate - Data de início em formato ISO (ex: "2024-01-01T00:00:00.000Z")
 * @param {string} endDate - Data de fim em formato ISO (ex: "2024-01-31T23:59:59.999Z")
 * @returns {Response} - Objeto JSON contendo a taxa de ocupação calculada
 * @example
 * // Request body: { "startDate": "2024-01-01T00:00:00.000Z", "endDate": "2024-01-31T23:59:59.999Z" }
 * // Response: { "occupancyRate": 85.5, "hoursWorked": 120, "hoursAvailable": 140 }
 */
Deno.serve(async (req) => {
    console.log("[OCCUPANCY_FN_V1] getOccupancyRate function invoked.");
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        
        // Autenticação obrigatória
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), { 
                status: 401, 
                headers: corsHeaders 
            });
        }

        // Extração dos parâmetros de entrada
        const { startDate, endDate } = await req.json();
        
        if (!startDate || !endDate) {
            return new Response(JSON.stringify({ 
                error: 'startDate e endDate são obrigatórios',
                example: { startDate: "2024-01-01T00:00:00.000Z", endDate: "2024-01-31T23:59:59.999Z" }
            }), { status: 400, headers: corsHeaders });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Busca das configurações de horário de trabalho do usuário
        const userData = await base44.asServiceRole.entities.User.filter({ id: user.id });
        const userProfile = userData[0];
        
        // Configurações padrão de horário de trabalho (8h/dia, seg-sex)
        const defaultWorkingHours = {
            monday: [{ start: '09:00', end: '18:00' }],
            tuesday: [{ start: '09:00', end: '18:00' }],
            wednesday: [{ start: '09:00', end: '18:00' }],
            thursday: [{ start: '09:00', end: '18:00' }],
            friday: [{ start: '09:00', end: '18:00' }],
            saturday: [],
            sunday: []
        };
        
        const workingHours = userProfile?.work_hours || defaultWorkingHours;
        
        // Mapeamento dos dias da semana
        const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        // Cálculo do total de horas disponíveis no período
        let totalAvailableMinutes = 0;
        const daysInPeriod = eachDayOfInterval({ start, end });
        
        daysInPeriod.forEach(day => {
            const dayOfWeek = dayMap[day.getDay()];
            const dayHours = workingHours[dayOfWeek] || [];
            
            dayHours.forEach(period => {
                const [startHour, startMinute] = period.start.split(':').map(Number);
                const [endHour, endMinute] = period.end.split(':').map(Number);
                
                const startMinutes = startHour * 60 + startMinute;
                const endMinutes = endHour * 60 + endMinute;
                
                totalAvailableMinutes += (endMinutes - startMinutes);
            });
        });
        
        // Busca dos agendamentos concluídos no período
        const completedAppointments = await base44.asServiceRole.entities.Appointment.filter({
            start_time_gte: start.toISOString(),
            start_time_lte: end.toISOString(),
            status: 'concluido'
        });
        
        // Cálculo do total de horas trabalhadas (baseado na duração dos agendamentos)
        const totalWorkedMinutes = completedAppointments.reduce((sum, appointment) => {
            // Busca a duração do serviço associado ao agendamento
            // Como fallback, usa a diferença entre start_time e end_time se disponível
            const startTime = new Date(appointment.start_time);
            const endTime = new Date(appointment.end_time);
            const durationFromTimes = (endTime - startTime) / (1000 * 60); // em minutos
            
            return sum + (durationFromTimes || 60); // fallback de 60 min se não conseguir calcular
        }, 0);
        
        // Cálculo da taxa de ocupação
        const occupancyRate = totalAvailableMinutes > 0 
            ? (totalWorkedMinutes / totalAvailableMinutes) * 100 
            : 0;
        
        // Conversão para horas para facilitar a interpretação
        const hoursWorked = Math.round((totalWorkedMinutes / 60) * 10) / 10; // 1 casa decimal
        const hoursAvailable = Math.round((totalAvailableMinutes / 60) * 10) / 10; // 1 casa decimal
        const finalOccupancyRate = Math.round(occupancyRate * 10) / 10; // 1 casa decimal
        
        return new Response(JSON.stringify({
            occupancyRate: finalOccupancyRate,
            hoursWorked: hoursWorked,
            hoursAvailable: hoursAvailable,
            appointmentsCount: completedAppointments.length,
            periodDays: daysInPeriod.length
        }), {
            status: 200,
            headers: corsHeaders,
        });

    } catch (error) {
        console.error("[FATAL] Erro em getOccupancyRate:", error);
        return new Response(JSON.stringify({ 
            error: 'Internal Server Error', 
            details: error.message 
        }), { 
            status: 500, 
            headers: corsHeaders 
        });
    }
});