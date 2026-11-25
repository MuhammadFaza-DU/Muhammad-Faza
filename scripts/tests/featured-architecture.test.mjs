import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

test("MarioKan phone excerpt contains complete controller, player and collision blocks",()=>{
  const media=JSON.parse(readFileSync(new URL("../../docs/v2/assets/featured-media.json",import.meta.url),"utf8"));
  const {excerpt}=media.find(item=>item.id==="mariokan").outputs[1];
  // Pixel bounds on the original 3456×2283 diagram, not its scaled preview.
  const blocks=[
    {label:"Game Controller",left:1320,top:510,right:1803,bottom:723},
    {label:"Player",left:1320,top:915,right:1744,bottom:1099},
    {label:"Collision Detection",left:1995,top:1094,right:2449,bottom:1339},
  ];
  for(const block of blocks)assert.ok(excerpt.left<block.left&&excerpt.top<block.top&&
    excerpt.left+excerpt.width>block.right&&excerpt.top+excerpt.height>block.bottom,
  `${block.label} is cut by the documented source crop`);
});
