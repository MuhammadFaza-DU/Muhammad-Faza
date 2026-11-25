import assert from "node:assert/strict";
import test from "node:test";
import {loadModule} from "./load-module.mjs";

test("contact retains all six approved channels with truthful canonical destinations",async()=>{
  const {contactChannels}=await loadModule("data/contact.ts");
  assert.deepEqual(contactChannels.map(channel=>channel.id).sort(),["email","github","instagram","linkedin","tiktok","youtube"]);
  assert.equal(contactChannels.find(channel=>channel.id==="email").url,"mailto:lexfaza@gmail.com");
  assert.equal(contactChannels.find(channel=>channel.id==="youtube").url,"https://www.youtube.com/@MuhammadFaza-justone");
  for(const channel of contactChannels) {
    assert.ok(channel.label && channel.handle && channel.icon);
    assert.match(channel.url,/^(https:\/\/|mailto:)/);
  }
});
