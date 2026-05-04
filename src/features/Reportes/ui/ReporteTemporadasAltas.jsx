import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabase.config';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress, 
  LinearProgress, Tooltip, IconButton 
} from '@mui/material';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import HotelIcon from '@mui/icons-material/Hotel';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StarIcon from '@mui/icons-material/Star';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ReporteTemporadasAltas() {
  const [datosMensuales, setDatosMensuales] = useState([]);
  const [datosHabitaciones, setDatosHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState({
    tasaOcupacion: 0,
    alos: 0,
    totalRegistros: 0
  });

  const TOTAL_HABITACIONES_HOTEL = 21;

  useEffect(() => {
    const fetchData = async () => {
      const [resMensual, resHabitaciones] = await Promise.all([
        supabase.from('vista_ocupacion_mensual').select('*'),
        supabase.from('vista_demanda_habitaciones').select('*')
      ]);

      if (resMensual.data && resHabitaciones.data) {
        setDatosMensuales(resMensual.data);
        setDatosHabitaciones(resHabitaciones.data);

        // ==========================================
        // CÁLCULOS MATEMÁTICOS (FÓRMULAS EXACTAS)
        // ==========================================
        let sumaNochesTotal = 0;
        let sumaRegistrosTotal = 0;
        
        resMensual.data.forEach(mes => {
          sumaNochesTotal += Number(mes.total_noches) || 0;
          sumaRegistrosTotal += Number(mes.total_registros) || 0;
        });

        // KPI - ALOS
        const calculoALOS = sumaRegistrosTotal > 0 
          ? (sumaNochesTotal / sumaRegistrosTotal).toFixed(1) 
          : 0;

        // KPI - Tasa de Ocupación Estacional
        const mesesAnalizados = resMensual.data.length || 1;
        const totalHabitacionesDisponibles = TOTAL_HABITACIONES_HOTEL * 30 * mesesAnalizados;
        const calculoTasaOcupacion = totalHabitacionesDisponibles > 0
          ? ((sumaNochesTotal / totalHabitacionesDisponibles) * 100).toFixed(1)
          : 0;

        setMetricas({
          tasaOcupacion: calculoTasaOcupacion,
          alos: calculoALOS,
          totalRegistros: sumaRegistrosTotal
        });
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress sx={{ color: '#38bdf8' }} /></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#0f172a', minHeight: '100vh', color: 'white' }}>
      {/* ENCABEZADO MEJORADO */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#f8fafc' }}>
          <InsertChartIcon sx={{ color: '#f59e0b', fontSize: 40 }} />
          Ocupación y Estacionalidad
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#94a3b8', mt: 1, ml: 7 }}>
          Identifica visualmente los picos de demanda histórica para organizar los turnos de tu personal de limpieza y recepción de manera eficiente.
        </Typography>
      </Box>

      {/* TARJETAS DE KPIs (CON EXPLICACIONES PARA EL DUEÑO) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
        
        {/* TARJETA 1: Tasa de Ocupación */}
        <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 3, position: 'relative' }}>
          <Tooltip title="Porcentaje histórico de ocupación. Si es muy bajo, considera lanzar promociones. Si es alto, necesitas al personal completo." placement="top">
            <IconButton sx={{ position: 'absolute', top: 8, right: 8, color: '#64748b' }}>
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ p: 2, bgcolor: 'rgba(56, 189, 248, 0.1)', borderRadius: 2 }}>
            <EventAvailableIcon sx={{ color: '#38bdf8', fontSize: 35 }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>TASA DE OCUPACIÓN ESTACIONAL</Typography>
            <Typography variant="h3" fontWeight="900" sx={{ color: '#e0f2fe' }}>{metricas.tasaOcupacion}%</Typography>
            <Typography variant="caption" sx={{ color: '#38bdf8' }}>De las 21 habitaciones disponibles a lo largo del tiempo.</Typography>
          </Box>
        </Paper>

        {/* TARJETA 2: ALOS */}
        <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 3, position: 'relative' }}>
          <Tooltip title="ALOS (Average Length of Stay). Indica cuántas noches en promedio duerme un cliente. Ayuda a calcular la rotación de sábanas y limpieza." placement="top">
            <IconButton sx={{ position: 'absolute', top: 8, right: 8, color: '#64748b' }}>
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ p: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: 2 }}>
            <BedtimeIcon sx={{ color: '#10b981', fontSize: 35 }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>PROMEDIO DE ESTADÍA (ALOS)</Typography>
            <Typography variant="h3" fontWeight="900" sx={{ color: '#ecfdf5' }}>{metricas.alos} Noches</Typography>
            <Typography variant="caption" sx={{ color: '#10b981' }}>Tiempo promedio que se queda un huésped por visita.</Typography>
          </Box>
        </Paper>

      </Box>

      {/* GRÁFICA DE TEMPORADAS */}
      <Paper sx={{ p: 3, bgcolor: '#1e293b', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', mb: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold" color="#f8fafc">Demanda por Meses (Temporadas Altas y Bajas)</Typography>
        </Box>
        <Box sx={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={datosMensuales} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="mes" stroke="#64748b" tick={{ fill: '#94a3b8' }} tickMargin={10} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '8px' }} 
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="total_noches" name="Total de Noches Ocupadas" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="total_registros" name="Cantidad de Check-ins" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* TABLA: ÍNDICE DE DEMANDA VISUAL */}
      <Paper sx={{ p: 3, bgcolor: '#1e293b', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f8fafc' }}>
            <HotelIcon sx={{ color: '#a855f7' }} /> Desgaste y Demanda por Habitación
          </Typography>
          <Typography variant="caption" color="#94a3b8">
            Las habitaciones con la barra más llena son las que más se alquilan. Requieren mayor mantenimiento.
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
              <TableRow>
                <TableCell sx={{ color: '#cbd5e1', fontWeight: 'bold' }}>Habitación</TableCell>
                <TableCell sx={{ color: '#cbd5e1', fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ color: '#cbd5e1', fontWeight: 'bold', textAlign: 'center' }}>Veces Rentada</TableCell>
                <TableCell sx={{ color: '#cbd5e1', fontWeight: 'bold', width: '40%' }}>Nivel de Demanda (Índice)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datosHabitaciones.map((hab, index) => {
                const indiceDemandaNum = metricas.totalRegistros > 0 
                  ? ((hab.veces_utilizada / metricas.totalRegistros) * 100)
                  : 0;
                
                // Si es una de las 3 habitaciones más rentadas, la pintamos de dorado/morado
                const isTop = index < 3;

                return (
                  <TableRow key={hab.numero_habitacion} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      Nº {hab.numero_habitacion}
                      {isTop && <StarIcon sx={{ color: '#f59e0b', fontSize: 16, ml: 1, verticalAlign: 'middle' }} />}
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8', textTransform: 'capitalize' }}>{hab.categoria}</TableCell>
                    <TableCell sx={{ color: '#38bdf8', fontWeight: 'bold', textAlign: 'center', fontSize: '1.1rem' }}>{hab.veces_utilizada}</TableCell>
                    
                    {/* BARRA DE PROGRESO VISUAL */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={indiceDemandaNum > 100 ? 100 : indiceDemandaNum} 
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              bgcolor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: isTop ? '#a855f7' : '#38bdf8', // Morado para las Top, Celeste para las demás
                                borderRadius: 5
                              }
                            }} 
                          />
                        </Box>
                        <Box sx={{ minWidth: 45 }}>
                          <Typography variant="body2" color="white" fontWeight="bold">
                            {indiceDemandaNum.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}