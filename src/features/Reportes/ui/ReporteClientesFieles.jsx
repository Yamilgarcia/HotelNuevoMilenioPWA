import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabase.config';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function ReporteClientesFieles() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState({ totalUnicos: 0, porcentajeRetorno: 0 });

  useEffect(() => {
    const fetchClientesFieles = async () => {
      const { data, error } = await supabase
        .from('vista_clientes_fieles')
        .select('*');

      if (error) {
        console.error("Error cargando reporte:", error);
      } else if (data) {
        setClientes(data);

        // --- CÁLCULO EXACTO DEL KPI SEGÚN DOCUMENTO EDA ---
        const totalClientes = data.length; // Total de clientes únicos registrados
        const clientesRepetidos = data.filter(c => c.total_visitas > 1).length; // Número de cédulas que se repiten
        
        // (Número de cédulas repetidas / Total de clientes únicos) * 100
        const porcentaje = totalClientes > 0 
          ? Math.round((clientesRepetidos / totalClientes) * 100) 
          : 0;

        setMetricas({
          totalUnicos: totalClientes,
          porcentajeRetorno: porcentaje
        });
      }
      setLoading(false);
    };

    fetchClientesFieles();
  }, []);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress sx={{ color: '#38bdf8' }} /></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <Typography variant="h4" fontWeight="800" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <WorkspacePremiumIcon sx={{ color: '#f59e0b', fontSize: 40 }} />
        Reporte de Fidelización y Perfilado Demográfico
      </Typography>

      {/* TARJETA DEL KPI PRINCIPAL */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
        <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'rgba(56, 189, 248, 0.1)', borderRadius: 2 }}>
            <AnalyticsIcon sx={{ color: '#38bdf8', fontSize: 35 }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>
              ÍNDICE DE REPETICIÓN DE CLIENTES
            </Typography>
            <Typography variant="h3" fontWeight="900" sx={{ color: '#e0f2fe' }}>
              {metricas.porcentajeRetorno}%
            </Typography>
            <Typography variant="caption" sx={{ color: '#38bdf8' }}>
              De {metricas.totalUnicos} clientes únicos en la muestra, el {metricas.porcentajeRetorno}% registra más de una visita.
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* TABLA DE CLIENTES (Incluye Perfilado Demográfico) */}
      <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.3)' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Top</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre del Cliente</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Procedencia</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Total Visitas</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'right' }}>Ingreso Histórico</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientes.slice(0, 50).map((cliente, index) => (
              <TableRow key={cliente.cedula} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                <TableCell sx={{ color: 'white' }}>#{index + 1}</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                  {cliente.nombre_completo}
                  {index < 3 && <WorkspacePremiumIcon sx={{ color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : '#b45309', fontSize: 16, ml: 1, verticalAlign: 'middle' }} />}
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <LocationOnIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5, color: 'rgba(255,255,255,0.4)' }} />
                  {cliente.lugar_nacimiento || 'No registrado'}
                </TableCell>
                <TableCell sx={{ color: '#38bdf8', fontWeight: '900', fontSize: '1.1rem', textAlign: 'center' }}>{cliente.total_visitas}</TableCell>
                <TableCell sx={{ color: '#4ade80', fontWeight: 'bold', textAlign: 'right' }}>C$ {cliente.total_gastado}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}