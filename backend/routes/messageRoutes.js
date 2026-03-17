import { Router } from 'express';
import {
  sendMessage, fetchHistory, editMessage, deleteMessage,
  addReaction, fetchThread, sendThreadReply, togglePinMessage,
  toggleStarMessage, markBulkSeen, markSeen, getStarredMessages, softDeleteMessage
} from '../controllers/messageController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware); // All message routes require auth

router.get('/stars', getStarredMessages); // Specific route before :id
router.post('/', sendMessage);
router.get('/:channelId', fetchHistory);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.delete('/:id/soft', softDeleteMessage);
router.post('/:id/reactions', addReaction);
router.get('/:id/thread', fetchThread);
router.post('/:id/thread', sendThreadReply);
router.put('/:id/pin', togglePinMessage);
router.post('/mark-seen', markBulkSeen);
router.post('/:id/star', toggleStarMessage);
router.post('/:id/read', markSeen); // Keep /read endpoint mapping to markSeen for compatibility
router.post('/:id/seen', markSeen);

export default router;
