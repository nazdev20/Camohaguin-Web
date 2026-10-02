import { NextResponse } from 'next/server';
import { getUserApplications, submitApplication, trackApplication } from '../../actions/applications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitApplication({
      serviceId: body.serviceId,
      purpose: body.purpose,
      applicantNotes: body.applicantNotes,
      priority: body.priority,
      residentId: body.residentId,
      documents: body.documents,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to submit application.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unexpected server error.' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackingNumber = searchParams.get('trackingNumber');
  const mine = searchParams.get('mine') === 'true';

  if (trackingNumber) {
    const result = await trackApplication(trackingNumber);
    return NextResponse.json({ data: result });
  }

  if (mine) {
    const data = await getUserApplications();
    return NextResponse.json({ data });
  }

  return NextResponse.json({ data: [] });
}
