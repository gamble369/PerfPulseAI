import { NextResponse } from 'next/server';
import { getBackendApiUrl } from '../../../../lib/config/api-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Forward the request to the backend auth 登录接口
    const response = await fetch(`${getBackendApiUrl()}/api/auth/login`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': getBackendApiUrl()
      },
      body: JSON.stringify(body),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // 错误日志已移除
      // 优先使用后端提供的 detail 或 message，然后回退到中文通用提示
      const errorMsg = errorData.detail || errorData.message || `后端错误: ${response.status}`;
      return NextResponse.json(
        {
          success: false,
          message: errorMsg,
          error: errorMsg
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // 登录错误日志已移除
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process login request',
        error: String(error)
      },
      { status: 500 }
    );
  }
}
