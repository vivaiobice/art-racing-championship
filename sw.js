const CACHE="art-racing-offline-v1";
const STOP_PAGE="./index.html";
const ASSETS=[STOP_PAGE,"./404.html","./manifest.webmanifest","./assets/art-logo.png","./assets/icon-192.png","./assets/icon-512.png","./assets/apple-touch-icon.png","./assets/favicon-32.png"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    await Promise.all(clients.map(client=>client.navigate("./")));
  })());
});

self.addEventListener("fetch",event=>{
  if(event.request.mode==="navigate"){
    const url=new URL(event.request.url);
    const rootPath=new URL("./",self.registration.scope).pathname;
    if(url.pathname!==rootPath&&url.pathname!==`${rootPath}index.html`&&url.pathname!==`${rootPath}404.html`){
      event.respondWith(Promise.resolve(Response.redirect(new URL("./",self.registration.scope).href,302)));
      return;
    }
    event.respondWith(caches.match("./index.html").then(response=>response||fetch(STOP_PAGE)));
    return;
  }
  if(new URL(event.request.url).origin===self.location.origin){
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  }
});
