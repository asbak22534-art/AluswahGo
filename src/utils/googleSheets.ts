export const DEFAULT_SPREADSHEET_ID = '1yfluI30DCk3o901wFo7Iknux1hUyN_FtRkjrDOFSA_s';

/**
 * Loads data from a public Google Sheet using GViz JSONP callback to bypass CORS issues in all browsers/environments.
 */
export function fetchSheetJsonp(
  sheetId: string = DEFAULT_SPREADSHEET_ID,
  sheetName?: string,
  query?: string,
  timeoutMs: number = 10000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = 'gviz_jsonp_' + Math.floor(Math.random() * 1000000) + '_' + Date.now();
    const script = document.createElement('script');
    script.id = callbackName;

    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      delete (window as any)[callbackName];
      const el = document.getElementById(callbackName);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error(`Gagal memuat Google Sheet via JSONP (${sheetName || sheetId})`));
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout memuat Google Sheet (${sheetName || sheetId})`));
    }, timeoutMs);

    let url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}&t=${Date.now()}`;
    if (sheetName) {
      url += `&sheet=${encodeURIComponent(sheetName)}`;
    }
    if (query) {
      url += `&tq=${encodeURIComponent(query)}`;
    }

    script.src = url;
    document.body.appendChild(script);
  });
}
