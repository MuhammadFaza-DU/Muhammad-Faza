import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./load-module.mjs";

test("orbit separates front/back depth and keeps mobile tool targets below the face", async () => {
  const { projectOrbit } = await loadModule("lib/orbit.ts");
  const layout = { centerX: 175, centerY: 302, radiusX: 147, radiusY: 68 };
  assert.equal(projectOrbit(Math.PI / 2, layout).depth, "front");
  assert.equal(projectOrbit(3 * Math.PI / 2, layout).depth, "back");
  for (let degree = 0; degree < 360; degree += 5) {
    const point = projectOrbit(degree * Math.PI / 180, layout);
    assert.ok(point.y - 22 > 190, "44px targets must not cross face/upper chest");
    assert.ok(point.x >= 22 && point.x <= 328);
  }
});

test("seven mobile orbit targets maintain nonoverlapping 44px hit boxes throughout a lap", async () => {
  const { projectOrbit } = await loadModule("lib/orbit.ts");
  for (let degree = 0; degree < 360; degree += 5) {
    const points = Array.from({ length: 7 }, (_, i) => projectOrbit(degree * Math.PI / 180 + i * 2 * Math.PI / 7,
      { centerX: 175, centerY: 302, radiusX: 147, radiusY: 68 }));
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
      assert.ok(Math.abs(points[i].x - points[j].x) >= 44 || Math.abs(points[i].y - points[j].y) >= 44, `Hit overlap at ${degree}: ${i}/${j}`);
    }
  }
});

test("enlarged seven-target orbit fits all supported widths and avoids face",async()=>{
  const {projectOrbit,orbitLayout}=await loadModule("lib/orbit.ts");
  for(const width of [272,342,720,864]) {
    const height=width<720?width*1.55:width*35/54;
    const layout=orbitLayout(width,height);
    assert.ok(layout.hitSize>=56);
    for(let degree=0;degree<360;degree+=2) {
      const points=Array.from({length:7},(_,i)=>projectOrbit((degree/180+i*2/7)*Math.PI,layout));
      for(const point of points) {
        assert.ok(point.x>=layout.hitSize/2&&point.x+layout.hitSize/2<=width);
        assert.ok(point.y-layout.hitSize/2>height*.35,"Face/upper-chest exclusion");
        assert.ok(point.y+layout.hitSize/2<=height);
      }
      for(let i=0;i<7;i++)for(let j=i+1;j<7;j++)assert.ok(
        Math.abs(points[i].x-points[j].x)>=layout.hitSize || Math.abs(points[i].y-points[j].y)>=layout.hitSize,
        `Hit overlap at width${width}, phase${degree}: ${i}/${j}`);
    }
  }
});

test("compacting blank phone stage top preserves portrait-relative orbit positions",async()=>{
  const {projectOrbit,orbitLayout}=await loadModule("lib/orbit.ts");
  for(const width of [272,342,493]) {
    const previousHeight=width*1.55,currentHeight=width*1.15;
    const previous=orbitLayout(width,previousHeight),current=orbitLayout(width,currentHeight);
    for(let degree=0;degree<360;degree+=2) {
      const before=projectOrbit(degree*Math.PI/180,previous),after=projectOrbit(degree*Math.PI/180,current);
      assert.equal(after.x,before.x);
      assert.ok(Math.abs((currentHeight-after.y)-(previousHeight-before.y))<1e-6);
      assert.equal(after.depth,before.depth);
      assert.equal(after.scale,before.scale);
    }
  }
});
