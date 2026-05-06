import { api } from './client';

export async function sendCaptcha(mobile: string) {
  const res = await api('/captcha/sent', { mobile });
  return res;
}

export interface LoginResult {
  token: string;
  userid: string;
  nickname?: string;
  vipType?: number;
}

export async function loginByCellphone(mobile: string, code: string): Promise<LoginResult | null> {
  const res = await api('/login/cellphone', { mobile, code });
  const data = res?.data;
  if (!data?.token) return null;
  return {
    token: data.token,
    userid: String(data.userid || ''),
    nickname: data.nickname || '',
    vipType: data.vip_type || 0,
  };
}

export async function refreshToken(token: string, userid: string): Promise<{ token: string; userid: string }> {
  const res = await api('/login/token', { token, userid });
  if (res?.status !== 1 || !res?.data?.token) {
    throw new Error('Token refresh failed');
  }
  return {
    token: String(res.data.token),
    userid: String(res.data.userid || userid),
  };
}
