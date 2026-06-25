import { ServiceRecord } from '../model/ServiceRecord.js';

export const getRevenueReport = async (req, res) => {
  try {
    const report = await ServiceRecord.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$serviceDate" } },
          totalRevenue: { $sum: "$totalAmount" },
          serviceCount: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const totalStats = await ServiceRecord.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = totalStats.length > 0 ? totalStats[0].totalRevenue : 0;
    const totalCount = totalStats.length > 0 ? totalStats[0].totalCount : 0;

    res.json({
      monthly: report,
      overall: {
        totalRevenue,
        totalCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
