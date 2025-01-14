import { NextResponse } from 'next/server';
import { AlchemyService } from '../../../services/alchemy';
import { CASTER_TOKEN_ADDRESS } from '../../../constants/addresses';

const alchemyService = new AlchemyService(
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
  process.env.NEXT_PUBLIC_CASTER_TOKEN_ADDRESS!
);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await alchemyService.handleWebhook(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process webhook' }, { status: 500 });
  }
}
