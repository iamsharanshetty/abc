import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const stripe = await getStripe();
    
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please install the stripe package and set STRIPE_SECRET_KEY.' },
        { status: 503 }
      );
    }
    
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, redirectUrl } = await req.json();
    
    // Use provided priceId or fall back to env var
    const textPriceId = priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;

    if (!textPriceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: textPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${redirectUrl || req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${redirectUrl || req.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
