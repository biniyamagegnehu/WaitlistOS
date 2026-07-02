import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL('/login', request.url);
  const response = NextResponse.redirect(url);
  
  // Clear the jwt cookie
  response.cookies.delete('jwt');
  
  return response;
}
