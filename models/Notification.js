const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['customer_added', 'payment_received', 'emi_due', 'status_change', 'project_update', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: '🔔'
    },
    referenceId: {
        type: String,
        default: null
    },
    referenceType: {
        type: String,
        enum: ['customer', 'transaction', 'project', 'plot', null],
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // Auto-delete after 30 days
    }
});

notificationSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
