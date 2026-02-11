const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all notifications (latest first, max 50)
// @route   GET /api/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(50);

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.status(200).json({
        success: true,
        unreadCount,
        data: notifications
    });
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notification });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.status(200).json({ success: true, data: {} });
});

// @desc    Create a notification (utility - called internally from other controllers)
exports.createNotification = async ({ type, title, message, icon, referenceId, referenceType }) => {
    try {
        await Notification.create({ type, title, message, icon, referenceId, referenceType });
    } catch (err) {
        console.error('Failed to create notification:', err.message);
    }
};
