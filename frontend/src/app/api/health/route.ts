import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: '智问数研AI智能问卷调研系统运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
