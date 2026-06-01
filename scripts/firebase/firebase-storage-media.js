/* ================================================================
   STEP280: Firebase Storage Media Uploader
   画像ファイルを localStorage ではなく Firebase Storage に保存する
   ================================================================ */
(function(){
  if (window.PNXFirebaseStorageMedia && window.PNXFirebaseStorageMedia.version === 'step280') return;

  function now(){ return new Date().toISOString(); }
  function safeName(name){
    return String(name || 'image')
      .normalize('NFKC')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'image';
  }
  function extFromType(type){
    const map = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif', 'image/svg+xml':'svg' };
    return map[String(type||'').toLowerCase()] || 'jpg';
  }
  function buildPath(opts){
    const folder = String((opts && opts.folder) || 'general').replace(/[^a-zA-Z0-9/_-]/g, '') || 'general';
    const d = new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const base = safeName((opts && opts.filename) || 'image');
    const stem = base.includes('.') ? base.replace(/\.[^.]+$/, '') : base;
    const ext = (base.match(/\.([^.]+)$/) || [])[1] || extFromType(opts && opts.contentType);
    const id = Date.now() + '_' + Math.random().toString(36).slice(2,8);
    return `cms-media/${folder}/${yyyy}/${mm}/${id}_${stem}.${ext}`;
  }

  const API = {
    version:'step280',
    async ensure(){
      if (window.PNXFirebaseApp && window.PNXFirebaseApp.init) {
        await window.PNXFirebaseApp.init();
      }
      return !!(window.PNXFirebaseApp && window.PNXFirebaseApp.storage && window.PNXFirebaseApp.hasRealConfig && window.PNXFirebaseApp.hasRealConfig());
    },
    isReady(){
      return !!(window.PNXFirebaseApp && window.PNXFirebaseApp.storage && window.PNXFirebaseApp.hasRealConfig && window.PNXFirebaseApp.hasRealConfig());
    },
    getStatus(){
      const app = window.PNXFirebaseApp || {};
      return {
        checkedAt: now(),
        hasRealConfig: !!(app.hasRealConfig && app.hasRealConfig()),
        ready: !!app.ready,
        hasStorage: !!app.storage,
        bucket: app.app && app.app.options ? app.app.options.storageBucket : ''
      };
    },
    async uploadDataUrl(dataUrl, opts={}){
      const ok = await this.ensure();
      if (!ok || !window.PNXFirebaseApp.storage) throw new Error('Firebase Storage未接続です');
      const path = buildPath(opts);
      const ref = window.PNXFirebaseApp.storage.ref().child(path);
      const metadata = {
        contentType: opts.contentType || 'image/jpeg',
        customMetadata: Object.assign({ source:'step280-dataurl', uploadedAt: now() }, opts.customMetadata || {})
      };
      const snapshot = await ref.putString(String(dataUrl || ''), 'data_url', metadata);
      const url = await snapshot.ref.getDownloadURL();
      return { ok:true, path, fullPath:path, url, downloadURL:url, contentType: metadata.contentType };
    },
    async uploadFile(file, opts={}){
      const ok = await this.ensure();
      if (!ok || !window.PNXFirebaseApp.storage) throw new Error('Firebase Storage未接続です');
      const path = buildPath(Object.assign({}, opts, { filename:(opts && opts.filename) || (file && file.name), contentType:(opts && opts.contentType) || (file && file.type) }));
      const ref = window.PNXFirebaseApp.storage.ref().child(path);
      const metadata = {
        contentType: (opts && opts.contentType) || (file && file.type) || 'application/octet-stream',
        customMetadata: Object.assign({ source:'step280-file', uploadedAt: now() }, opts.customMetadata || {})
      };
      const snapshot = await ref.put(file, metadata);
      const url = await snapshot.ref.getDownloadURL();
      return { ok:true, path, fullPath:path, url, downloadURL:url, contentType: metadata.contentType };
    }
  };

  window.PNXFirebaseStorageMedia = API;
})();
