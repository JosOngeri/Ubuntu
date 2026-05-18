const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/onboarding.controller');

router.use(auth);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.initiate);
router.put('/:id/step', ctrl.completeStep);
router.post('/:id/documents', ctrl.uploadDocument);
router.post('/:id/assets', ctrl.assignAsset);
router.post('/:id/review', ctrl.addProbationReview);
router.post('/:id/offer-letter', ctrl.generateOfferLetter);

module.exports = router;
