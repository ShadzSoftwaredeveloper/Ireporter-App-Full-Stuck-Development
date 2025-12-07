const notificationsDal = require('../repositories/notifications');

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await notificationsDal.listByUser(req.user.id);
    res.json({
      status: 'success',
      count: notifications.length,
      data: { notifications }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationsDal.countUnread(req.user.id);
    res.json({ status: 'success', data: { count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await notificationsDal.markAsRead(req.params.id, req.user.id);
    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }
    res.json({ status: 'success', message: 'Notification marked as read', data: { notification } });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ status: 'error', message: 'Error updating notification', error: error.message });
  }
};

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await notificationsDal.markAllAsRead(req.user.id);
    res.json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ status: 'error', message: 'Error updating notifications', error: error.message });
  }
};

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    await notificationsDal.deleteById(req.params.id, req.user.id);
    res.json({ status: 'success', message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ status: 'error', message: 'Error deleting notification', error: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
