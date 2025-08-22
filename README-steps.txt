READY-PASTE BRIDGE & PROXY — quick steps
1) Start the Node bridge:
   npm i express morgan
   node server.mjs

2) Replace your vite.config.js with the one in this pack (or copy server.proxy).
   Restart: npm run dev

3) Optional: edit .env.local (VITE_SWF_FLASHVARS) to append flashvars to SWF URL.
4) Test in browser:
   /swf/<YourFolder>/index.php?do=verifyscore  -> 1
   /swf/<YourFolder>/sec/sendhigh.php          -> 1
