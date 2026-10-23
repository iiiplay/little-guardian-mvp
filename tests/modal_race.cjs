const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/User/.agents/skills/gstack/node_modules/playwright'),assert=require('assert/strict');
(async()=>{const b=await chromium.launch({headless:true});try{const p=await b.newPage();await p.goto('http://127.0.0.1:8765/index.html');await p.locator('#start').click();
// Reproduce a transition inside one frame; the pending pause update previously replaced the build dialog.
await p.evaluate(()=>{game.save.cleared=[1];game.save.perks.power=1;lastMode='play';showMap();showBuild();update();});
assert.equal(await p.evaluate(()=>modalType),'build');await p.locator('[data-build="power"]').click();assert.equal(await p.evaluate(()=>modalType),'map');await p.locator('#back').click();assert.equal(await p.evaluate(()=>game.mode),'play');console.log('PASS: pause update cannot replace a user-owned build dialog.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
