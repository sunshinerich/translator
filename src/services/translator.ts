import * as https from 'https';
import * as crypto from 'crypto';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Simple Settings Manager
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

export function getSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        }
    } catch (e) {
        console.error('Failed to load settings', e);
    }
    return { provider: 'google', youdaoAppKey: '', youdaoAppSecret: '', baiduAppId: '', baiduKey: '' };
}

export function saveSettings(settings: any) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error('Failed to save settings', e);
    }
}

export async function translate(text: string, source: string, target: string): Promise<string> {
    const settings = getSettings();
    if (settings.provider === 'youdao') {
        return translateYoudao(text, source, target, settings.youdaoAppKey, settings.youdaoAppSecret);
    } else if (settings.provider === 'baidu') {
        return translateBaidu(text, source, target, settings.baiduAppId, settings.baiduKey);
    } else {
        return translateGoogle(text, source, target);
    }
}

function request(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    // Google returns weird JSON sometimes (arrays), which is valid but might need care
                    // For Google we might need to parse specifically if it's not standard JSON object
                    // But JSON.parse handles arrays fine.
                    resolve(data);
                }
            });
        }).on('error', (err) => reject(err));
    });
}

async function translateGoogle(text: string, source: string, target: string): Promise<string> {
    const sl = source === 'auto' ? 'auto' : source;
    const tl = target;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    // Google returns [[["translated text", ...], ...], ...]
                    const result = JSON.parse(data);
                    if (result && result[0] && result[0][0] && result[0][0][0]) {
                        resolve(result[0].map((item: any) => item[0]).join(''));
                    } else {
                        resolve(text); // Fallback
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Google response'));
                }
            });
        }).on('error', (err) => reject(err));
    });
}

async function translateYoudao(text: string, source: string, target: string, appKey: string, appSecret: string): Promise<string> {
    if (!appKey || !appSecret) {
        throw new Error('Youdao API Key or Secret is missing.');
    }

    const salt = (new Date).getTime().toString();
    const curtime = Math.round(new Date().getTime() / 1000).toString();
    const str1 = appKey + truncate(text) + salt + curtime + appSecret;
    const sign = crypto.createHash('sha256').update(str1).digest('hex'); // Youdao v3 uses SHA256 usually, or MD5. Let's check docs. v3 uses SHA256.

    const from = source === 'auto' ? 'auto' : source;
    const to = target;

    const query = new URLSearchParams({
        q: text,
        appKey: appKey,
        salt: salt,
        from: from,
        to: to,
        sign: sign,
        signType: 'v3',
        curtime: curtime,
    }).toString();

    const url = `https://openapi.youdao.com/api?${query}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.errorCode === '0') {
                        resolve(result.translation ? result.translation[0] : '');
                    } else {
                        reject(new Error(`Youdao Error: ${result.errorCode}`));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Youdao response'));
                }
            });
        }).on('error', (err) => reject(err));
    });
}

async function translateBaidu(text: string, source: string, target: string, appId: string, key: string): Promise<string> {
    if (!appId || !key) {
        throw new Error('Baidu App ID or Key is missing.');
    }

    const salt = (new Date).getTime().toString();
    const str1 = appId + text + salt + key;
    const sign = crypto.createHash('md5').update(str1).digest('hex');

    // Baidu uses 'zh' for Chinese, not 'zh-CN'
    let from = source === 'auto' ? 'auto' : source;
    let to = target;

    if (from === 'zh-CN') from = 'zh';
    if (to === 'zh-CN') to = 'zh';

    const query = new URLSearchParams({
        q: text,
        appid: appId,
        salt: salt,
        from: from,
        to: to,
        sign: sign,
    }).toString();

    const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?${query}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (!result.error_code) {
                        resolve(result.trans_result ? result.trans_result[0].dst : '');
                    } else {
                        reject(new Error(`Baidu Error: ${result.error_code} - ${result.error_msg}`));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Baidu response'));
                }
            });
        }).on('error', (err) => reject(err));
    });
}

function truncate(q: string): string {
    const len = q.length;
    if (len <= 20) return q;
    return q.substring(0, 10) + len + q.substring(len - 10, len);
}
