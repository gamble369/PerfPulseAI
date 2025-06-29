import { NextResponse } from 'next/server';
import { backendUrl, frontendOrigin } from '../../../lib/config/api-config';

export async function GET() {
  const testUrl = `${backendUrl}/api/health`;

  try {
    // 测试性请求，添加详细日志
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Origin': frontendOrigin // 确保与前端地址一致
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': frontendOrigin
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: '后端连接测试失败',
        diagnostic: {
          backendUrl: testUrl,
          error: (error as Error).message,
          suggestion: '请检查后端服务是否运行以及CORS配置'
        }
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': frontendOrigin
        }
      }
    );
  }
}