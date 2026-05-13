import Channel from '../models/Channel.js';

// POST /api/channels
export const createChannel = async (req, res) => {
  try {
    const { name, description, isPrivate, members } = req.body;

    // Permissions: any authenticated user can create a standard channel.

    let initialMembers = [req.user._id];
    if (members && Array.isArray(members)) {
      initialMembers = [...new Set([...initialMembers, ...members])];
    }

    const channel = await Channel.create({
      name,
      description,
      isPrivate: isPrivate || false,
      createdBy: req.user._id,
      members: initialMembers,
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Create channel error:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Channel name already exists' });
    }
    res.status(500).json({ message: 'Server error creating channel' });
  }
};

// POST /api/channels/:id/join
export const joinChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    if (channel.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member of this channel' });
    }

    channel.members.push(req.user._id);
    await channel.save();

    res.status(200).json(channel);
  } catch (error) {
    console.error('Join channel error:', error.message);
    res.status(500).json({ message: 'Server error joining channel' });
  }
};

// GET /api/channels
export const listChannels = async (req, res) => {
  try {
    const channels = await Channel.find()
      .populate('members', 'username avatar')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    const currentUserId = req.user._id.toString();
    const processedChannels = channels.map(ch => {
      const isMember = ch.members.some(m => m._id.toString() === currentUserId);
      const isPending = ch.waitingList?.some(id => id.toString() === currentUserId);
      
      // Hide members and waitingList for non-members to keep data clean, 
      // but keep count or just the flag
      return {
        ...ch,
        isMember,
        isPending,
        // If private and not a member, we might not even want to show it, 
        // but for public channels, we show the "Join" state.
        isVisible: !ch.isPrivate || isMember
      };
    }).filter(ch => ch.isVisible);

    res.json(processedChannels);
  } catch (error) {
    console.error('List channels error:', error.message);
    res.status(500).json({ message: 'Server error listing channels' });
  }
};

// GET /api/channels/:id
export const getChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('members', 'username avatar')
      .populate('createdBy', 'username');

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    res.json(channel);
  } catch (error) {
    console.error('Get channel error:', error.message);
    res.status(500).json({ message: 'Server error getting channel' });
  }
};
// DELETE /api/channels/:id
export const deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Permission check
    const isDM = channel.name.startsWith('dm-');
    const isAdmin = req.user.role === 'admin';
    const isMember = channel.members.some(id => id.toString() === req.user._id.toString());
    const isCreator = channel.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !(isDM && isMember) && !isCreator) {
      return res.status(403).json({ message: 'Access denied. Only the channel creator or an admin can delete this channel.' });
    }

    await Channel.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete channel error:', error.message);
    res.status(500).json({ message: 'Server error deleting channel' });
  }
};

// POST /api/channels/:id/request
export const requestJoinChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    if (channel.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    if (channel.waitingList.includes(req.user._id)) {
      return res.status(400).json({ message: 'Request already pending' });
    }

    channel.waitingList.push(req.user._id);
    await channel.save();

    res.status(200).json({ message: 'Request sent successfully' });
  } catch (error) {
    console.error('Request join error:', error.message);
    res.status(500).json({ message: 'Server error sending request' });
  }
};

// GET /api/channels/:id/requests
export const listPendingRequests = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate('waitingList', 'username email avatar');
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    // Only admin or the creator of the channel can view requests
    const isAdmin = req.user.role === 'admin';
    const isCreator = channel.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Access denied. Only the channel creator or an admin can view pending requests.' });
    }

    res.json(channel.waitingList);
  } catch (error) {
    console.error('List requests error:', error.message);
    res.status(500).json({ message: 'Server error listing requests' });
  }
};

// POST /api/channels/:id/approve
export const approveJoinRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    // Only admin or the creator of the channel can approve requests
    const isAdmin = req.user.role === 'admin';
    const isCreator = channel.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Access denied. Only the channel creator or an admin can approve join requests.' });
    }

    if (!channel.waitingList.some(id => id.toString() === userId)) {
      return res.status(404).json({ message: 'User request not found in waiting list' });
    }

    // Move from waitingList to members
    channel.waitingList = channel.waitingList.filter(id => id.toString() !== userId);
    channel.members.push(userId);
    await channel.save();

    const updatedChannel = await Channel.findById(req.params.id).populate('members', 'username avatar');
    
    // Notify the user via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('membership_updated', { userId, channelId: req.params.id, status: 'approved' });
    }

    res.status(200).json(updatedChannel);
  } catch (error) {
    console.error('Approve request error:', error.message);
    res.status(500).json({ message: 'Server error approving request' });
  }
};

// POST /api/channels/:id/reject
export const rejectJoinRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const channel = await Channel.findById(req.params.id);
    if (!channel) return res.status(404).json({ message: 'Channel not found' });

    // Only admin or the creator of the channel can reject requests
    const isAdmin = req.user.role === 'admin';
    const isCreator = channel.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Access denied. Only the channel creator or an admin can reject join requests.' });
    }

    if (!channel.waitingList.some(id => id.toString() === userId)) {
      return res.status(404).json({ message: 'User request not found in waiting list' });
    }

    // Remove from waitingList
    channel.waitingList = channel.waitingList.filter(id => id.toString() !== userId);
    await channel.save();

    const updatedChannel = await Channel.findById(req.params.id).populate('members', 'username avatar');
    
    // Notify the user via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('membership_updated', { userId, channelId: req.params.id, status: 'rejected' });
    }

    res.status(200).json(updatedChannel);
  } catch (error) {
    console.error('Reject request error:', error.message);
    res.status(500).json({ message: 'Server error rejecting request' });
  }
};
