import { Router } from 'express';
import { createChannel, joinChannel, listChannels, getChannel, deleteChannel, requestJoinChannel, listPendingRequests, approveJoinRequest, rejectJoinRequest } from '../controllers/channelController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = Router();

router.use(authMiddleware); // All channel routes require auth

router.get('/', listChannels);
router.post('/', createChannel);
router.delete('/:id', deleteChannel);
router.get('/:id', getChannel);

// Join mechanism
router.post('/:id/request', requestJoinChannel);
router.get('/:id/requests', listPendingRequests);
router.post('/:id/approve', approveJoinRequest);
router.post('/:id/reject', rejectJoinRequest);

// Maintaining legacy join for now or replacing it
router.post('/:id/join', joinChannel); 

export default router;
