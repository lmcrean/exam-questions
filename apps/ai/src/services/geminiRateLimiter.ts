/**
 * Global Gemini API Rate Limiter
 *
 * Ensures we stay within free tier: 45,000 requests/month
 * Strategy: Limit to ~1,333 calls/day (40,000/30 with buffer)
 */

interface RateLimitState {
  callCount: number;
  resetDate: string; // ISO date string (YYYY-MM-DD)
}

class GeminiRateLimiter {
  private state: RateLimitState;
  private readonly dailyLimit: number;

  constructor() {
    // Get daily limit from env, default to 1333 (40K/30 days)
    this.dailyLimit = parseInt(process.env.GEMINI_DAILY_LIMIT || '1333', 10);

    // Initialize state
    this.state = {
      callCount: 0,
      resetDate: this.getTodayDate()
    };
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Reset counter if it's a new day
   */
  private checkAndResetIfNewDay(): void {
    const today = this.getTodayDate();

    if (this.state.resetDate !== today) {
      // New day, reset counter
      this.state.callCount = 0;
      this.state.resetDate = today;
      console.log(`[Gemini Rate Limiter] Reset for new day: ${today}`);
    }
  }

  /**
   * Check if we can make a Gemini API call
   * @returns true if under limit, false if limit exceeded
   */
  canMakeCall(): boolean {
    this.checkAndResetIfNewDay();
    return this.state.callCount < this.dailyLimit;
  }

  /**
   * Increment the call counter
   * Call this AFTER successfully making a Gemini API call
   */
  incrementCallCount(): void {
    this.checkAndResetIfNewDay();
    this.state.callCount++;

    console.log(`[Gemini Rate Limiter] Calls today: ${this.state.callCount}/${this.dailyLimit}`);

    // Warn at 80% capacity
    if (this.state.callCount >= this.dailyLimit * 0.8) {
      console.warn(`[Gemini Rate Limiter] WARNING: ${this.state.callCount}/${this.dailyLimit} calls used today (${Math.round(this.state.callCount / this.dailyLimit * 100)}%)`);
    }
  }

  /**
   * Get current usage stats
   */
  getUsageStats(): {
    callsToday: number;
    dailyLimit: number;
    remaining: number;
    percentUsed: number;
    resetDate: string;
  } {
    this.checkAndResetIfNewDay();

    return {
      callsToday: this.state.callCount,
      dailyLimit: this.dailyLimit,
      remaining: this.dailyLimit - this.state.callCount,
      percentUsed: Math.round((this.state.callCount / this.dailyLimit) * 100),
      resetDate: this.state.resetDate
    };
  }

  /**
   * Get error message when limit exceeded
   */
  getLimitExceededMessage(): string {
    const stats = this.getUsageStats();
    return `Daily Gemini API limit reached (${stats.callsToday}/${stats.dailyLimit} calls). Resets tomorrow. Please try again later or contact support.`;
  }
}

// Singleton instance
export const geminiRateLimiter = new GeminiRateLimiter();
