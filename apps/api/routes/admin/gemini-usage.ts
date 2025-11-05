/**
 * Gemini API Usage Stats Endpoint
 *
 * GET /api/admin/gemini-usage
 * Returns current Gemini API usage statistics
 */

import { Router, Request, Response } from 'express';
import { geminiRateLimiter } from '../../services/geminiRateLimiter.js';

const router = Router();

/**
 * Get Gemini API usage statistics
 * Useful for monitoring daily usage and ensuring we stay under free tier
 */
router.get('/gemini-usage', (req: Request, res: Response) => {
  try {
    const stats = geminiRateLimiter.getUsageStats();

    // Calculate some useful metrics
    const percentRemaining = Math.round((stats.remaining / stats.dailyLimit) * 100);
    const monthlyProjection = stats.callsToday * 30;
    const freeTierLimit = 45000;
    const projectedMonthlyUsage = Math.round((monthlyProjection / freeTierLimit) * 100);

    res.json({
      success: true,
      data: {
        // Current usage
        callsToday: stats.callsToday,
        dailyLimit: stats.dailyLimit,
        remaining: stats.remaining,
        percentUsed: stats.percentUsed,
        percentRemaining,

        // Reset info
        resetDate: stats.resetDate,
        resetsIn: 'Midnight tonight',

        // Projections
        projections: {
          monthlyCallsAtCurrentRate: monthlyProjection,
          freeTierMonthlyLimit: freeTierLimit,
          projectedMonthlyUsage: `${projectedMonthlyUsage}%`,
          safetyBuffer: freeTierLimit - monthlyProjection,
          willStayFree: monthlyProjection < freeTierLimit
        },

        // Status indicators
        status: stats.percentUsed >= 90 ? 'warning' :
                stats.percentUsed >= 75 ? 'caution' : 'healthy',

        message: stats.percentUsed >= 90
          ? 'Approaching daily limit! Consider monitoring usage.'
          : stats.percentUsed >= 75
          ? 'Usage is high but within safe limits.'
          : 'Usage is healthy and well within limits.'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics',
      message: error.message
    });
  }
});

export default router;
