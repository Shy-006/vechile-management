import { ServiceReminder } from '../model/ServiceReminder.js';

// Retrieve reminders for the logged-in customer
export const getReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Dynamically transition PENDING reminders to SENT if their due date is reached or passed
    await ServiceReminder.updateMany(
      { userId, status: 'PENDING', dueDate: { $lte: now } },
      { status: 'SENT' }
    );

    // Get all reminders for this user, populating vehicle information
    const { status } = req.query;
    let query = { userId };
    
    if (status) {
      query.status = status;
    } else {
      // By default, return active notifications (SENT), pending future reminders (PENDING), and dismissed ones.
      // This helps users see their active notifications and upcoming service dates.
      query.status = { $in: ['PENDING', 'SENT', 'DISMISSED'] };
    }

    const reminders = await ServiceReminder.find(query)
      .populate('vehicleId', 'vehicleNumber manufacturer model')
      .sort({ dueDate: 1 });

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dismiss a reminder (set status to DISMISSED)
export const dismissReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reminder = await ServiceReminder.findById(id);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found.' });
    }

    // Check ownership: Customers can only dismiss their own reminders
    if (req.user.role !== 'ADMIN' && reminder.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only dismiss your own reminders.' });
    }

    reminder.status = 'DISMISSED';
    await reminder.save();

    res.json({ message: 'Reminder successfully dismissed.', reminder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Retrieve all reminders (Admin only)
export const getAdminReminders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      query.status = status;
    }

    const reminders = await ServiceReminder.find(query)
      .populate('userId', 'name email')
      .populate('vehicleId', 'vehicleNumber manufacturer model')
      .sort({ dueDate: 1 });

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Manually trigger due notifications across the entire system (Admin only)
export const triggerAdminNotifications = async (req, res) => {
  try {
    const now = new Date();
    
    // Find all PENDING reminders that are due or past due
    const result = await ServiceReminder.updateMany(
      { status: 'PENDING', dueDate: { $lte: now } },
      { status: 'SENT' }
    );

    res.json({
      message: 'Service reminder notifications triggered successfully.',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
