import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCcMirrorNativeUiHardening } from '../../src/core/native-ui-hardening.js';

test('applyCcMirrorNativeUiHardening disables Opus launch announcement', () => {
  const source =
    'f7O={id:"opus48-launch",tier:"announcement",type:"info",promo:!1,priority:TBK.launch,isActive:()=>Xe8(),render:()=>T7.createElement(VpK,null)}';

  const result = applyCcMirrorNativeUiHardening(source);

  assert.equal(result.changed, true);
  assert.ok(result.applied.includes('opus48-launch-announcement'));
  assert.ok(result.content.includes('isActive:()=>!1'));
});

test('applyCcMirrorNativeUiHardening brands startup title and hides version', () => {
  const source =
    'r=kN6?Y4.createElement(kN6.Title,null):Y4.createElement(V,{bold:!0},"Claude Code");let a;if(H[24]!==E)a=Y4.createElement(V,null,r," ",Y4.createElement(V,{dimColor:!0},"v",E))';

  const result = applyCcMirrorNativeUiHardening(source);

  assert.equal(result.changed, true);
  assert.ok(result.applied.includes('startup-title-brand'));
  assert.ok(result.applied.includes('startup-title-version'));
  assert.ok(result.content.includes('process.env.CC_MIRROR_PROVIDER_LABEL||"cc-mirror"'));
  assert.equal(result.content.includes('"v",E'), false);
});
