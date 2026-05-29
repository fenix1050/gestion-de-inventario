// =============================================================
// backend/src/controllers/reportes.controller.js
// Orquesta request/response para el módulo de reportes
// =============================================================

const reportesService = require('../services/reportes.service');
const { ok, serverError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

async function getConsumoPorPeriodo(req, res) {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    const data = await reportesService.consumoPorPeriodo({ fecha_desde, fecha_hasta });
    return ok(res, data);
  } catch (err) {
    logger.error('Error en getConsumoPorPeriodo:', err.message);
    return serverError(res, err.message);
  }
}

async function getConsumoPorDepartamento(req, res) {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    const data = await reportesService.consumoPorDepartamento({ fecha_desde, fecha_hasta });
    return ok(res, data);
  } catch (err) {
    logger.error('Error en getConsumoPorDepartamento:', err.message);
    return serverError(res, err.message);
  }
}

async function getMasConsumidos(req, res) {
  try {
    const { fecha_desde, fecha_hasta, limit } = req.query;
    const limitInt = parseInt(limit, 10) || 10;
    const data = await reportesService.masConsumidos({ fecha_desde, fecha_hasta, limit: limitInt });
    return ok(res, data);
  } catch (err) {
    logger.error('Error en getMasConsumidos:', err.message);
    return serverError(res, err.message);
  }
}

async function getValorTotal(req, res) {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    const data = await reportesService.valorTotal({ fecha_desde, fecha_hasta });
    return ok(res, data);
  } catch (err) {
    logger.error('Error en getValorTotal:', err.message);
    return serverError(res, err.message);
  }
}

async function getProyeccionStock(_req, res) {
  try {
    const data = await reportesService.proyeccionStock();
    return ok(res, data);
  } catch (err) {
    logger.error('Error en getProyeccionStock:', err.message);
    return serverError(res, err.message);
  }
}

const exportarExcel = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;
    const workbook = await reportesService.generarExcel({ fecha_desde, fecha_hasta });

    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `reporte-inventario-${fecha}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error('Error al generar Excel:', err);
    return serverError(res, 'No se pudo generar el archivo Excel.');
  }
};

module.exports = {
  getConsumoPorPeriodo,
  getConsumoPorDepartamento,
  getMasConsumidos,
  getValorTotal,
  getProyeccionStock,
  exportarExcel,
};
