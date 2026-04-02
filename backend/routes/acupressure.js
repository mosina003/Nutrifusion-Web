const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Load acupressure points data
const acupressurePointsPath = path.join(__dirname, '../data/acupressure_points.json');

// Helper function to load points
async function loadAcupressurePoints() {
  try {
    const data = await fs.readFile(acupressurePointsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading acupressure points:', error);
    return [];
  }
}

// GET /api/acupressure-points - Get all acupressure points
router.get('/acupressure-points', async (req, res) => {
  try {
    const points = await loadAcupressurePoints();
    res.json({
      success: true,
      data: points,
      count: points.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch acupressure points',
      error: error.message
    });
  }
});

// GET /api/acupressure-points/:id - Get specific point details
router.get('/acupressure-points/:id', async (req, res) => {
  try {
    const points = await loadAcupressurePoints();
    const point = points.find(p => p.id === req.params.id);
    
    if (!point) {
      return res.status(404).json({
        success: false,
        message: `Acupressure point ${req.params.id} not found`
      });
    }
    
    res.json({
      success: true,
      data: point
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch point details',
      error: error.message
    });
  }
});

// GET /api/acupressure/filter - Filter points by framework or body part
router.get('/acupressure/filter', async (req, res) => {
  try {
    const { framework, bodyPart, symptom } = req.query;
    let points = await loadAcupressurePoints();
    
    // Filter by framework if provided
    if (framework) {
      points = points.filter(point => {
        const mapping = point.frameworkMapping || {};
        return Object.values(mapping).some(val => 
          val.toLowerCase().includes(framework.toLowerCase())
        );
      });
    }
    
    // Filter by body part if provided
    if (bodyPart) {
      points = points.filter(p => p.bodyPart === bodyPart);
    }
    
    // Filter by symptom if provided
    if (symptom) {
      points = points.filter(p =>
        p.symptoms.some(s => 
          s.toLowerCase().includes(symptom.toLowerCase())
        )
      );
    }
    
    res.json({
      success: true,
      data: points,
      count: points.length,
      filters: { framework, bodyPart, symptom }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to filter acupressure points',
      error: error.message
    });
  }
});

// GET /api/acupressure/search - Search points by keyword
router.get('/acupressure/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword is required'
      });
    }
    
    const points = await loadAcupressurePoints();
    const searchTerm = keyword.toLowerCase();
    
    const results = points.filter(point => {
      const nameMatch = point.name.toLowerCase().includes(searchTerm);
      const chineseNameMatch = (point.name.match(/[\u4e00-\u9fa5]+/g) || []).some(char => 
        char.toLowerCase().includes(searchTerm)
      );
      const meridianMatch = point.meridian.toLowerCase().includes(searchTerm);
      const symptomMatch = point.symptoms.some(s => s.toLowerCase().includes(searchTerm));
      const benefitMatch = point.benefits.some(b => b.toLowerCase().includes(searchTerm));
      
      return nameMatch || chineseNameMatch || meridianMatch || symptomMatch || benefitMatch;
    });
    
    res.json({
      success: true,
      data: results,
      count: results.length,
      keyword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search acupressure points',
      error: error.message
    });
  }
});

// GET /api/acupressure/by-body-part - Get all points for front or back
router.get('/acupressure/by-body-part/:part', async (req, res) => {
  try {
    const { part } = req.params;
    
    if (!['front', 'back'].includes(part)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid body part. Use "front" or "back"'
      });
    }
    
    const points = await loadAcupressurePoints();
    const filtered = points.filter(p => p.bodyPart === part);
    
    res.json({
      success: true,
      data: filtered,
      count: filtered.length,
      bodyPart: part
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch points by body part',
      error: error.message
    });
  }
});

module.exports = router;
