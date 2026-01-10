// Optional Stripe integration - only works if stripe package is installed
// This file will gracefully handle missing stripe package
// Never import stripe at top level - only import when needed inside functions

// Export null stripe for backwards compatibility (prevents build errors)
// Will be initialized lazily via getStripe() if package is installed
export const stripe: any = null;

/**
 * Get Stripe instance (only if package is installed and configured)
 * Returns null if stripe package is not installed or not configured
 */
export async function getStripe() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return null;
    }
    
    // Dynamic import only when needed - won't fail at build time if package is missing
    const StripeModule = await import('stripe').catch((err: any) => {
      if (err?.code === 'MODULE_NOT_FOUND' || err?.message?.includes("Can't resolve")) {
        return null;
      }
      throw err;
    });
    
    if (!StripeModule) {
      console.warn('Stripe package not installed. Billing features will work without Stripe integration.');
      return null;
    }
    
    const Stripe = StripeModule.default;
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover' as any,
      typescript: true,
    });
  } catch (error: any) {
    if (error?.code === 'MODULE_NOT_FOUND' || error?.message?.includes("Can't resolve")) {
      console.warn('Stripe package not installed. Billing features will work without Stripe integration.');
      return null;
    }
    // For other errors, log but don't throw - allow app to continue
    console.error('Error initializing Stripe:', error);
    return null;
  }
}
