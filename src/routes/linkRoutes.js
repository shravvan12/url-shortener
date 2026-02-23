const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { createLink , getUserLinks, getLinkAnalytics , toggleLinkStatus, deleteLink} = require('../controllers/linkController');
const rateLimit = require('express-rate-limit');

const createLinkLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: {
    message: 'Too many links created. Please slow down.'
  }
});

router.post('/', protect, createLinkLimiter, createLink);
router.get('/', protect, getUserLinks);
router.get('/:id/analytics', protect, getLinkAnalytics);
router.patch('/:id/toggle', protect, toggleLinkStatus);
router.delete('/:id', protect, deleteLink);
module.exports = router;